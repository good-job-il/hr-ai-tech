import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, LessThanOrEqual, Repository } from 'typeorm';
import { BackgroundJobEntity, BackgroundJobType } from '../entities/background-job.entity';
import { UserEntity } from '../../users/user.entity';
import { ImportSourceEntity } from '../../import-sources/import-source.entity';
import { ImportService } from './import.service';
import { JobCrawlerService } from './job-crawler.service';
import { UserRole } from '../../../common/enums/user-role.enum';
import { OperationalMetricsService } from '../../../common/monitoring/operational-metrics.service';

@Injectable()
export class BackgroundJobsService {
  private readonly logger = new Logger(BackgroundJobsService.name);
  private processing = false;

  constructor(
    @InjectRepository(BackgroundJobEntity) private readonly jobs: Repository<BackgroundJobEntity>,
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    @InjectRepository(ImportSourceEntity) private readonly sources: Repository<ImportSourceEntity>,
    private readonly imports: ImportService,
    private readonly crawler: JobCrawlerService,
    private readonly metrics: OperationalMetricsService,
  ) {}

  async enqueue(
    type: BackgroundJobType,
    payload: Record<string, unknown>,
    idempotencyKey: string,
    user: UserEntity,
  ) {
    const scopedKey = `${type}:${user.organization_id ?? 'platform'}:${idempotencyKey}`;
    const existing = await this.jobs.findOne({ where: { idempotency_key: scopedKey } });
    if (existing) return existing;
    try {
      const created = await this.jobs.save(this.jobs.create({
        type,
        status: 'pending',
        idempotency_key: scopedKey,
        payload,
        result: null,
        error: null,
        organization_id: user.organization_id,
        requested_by: user.id,
        attempts: 0,
        max_attempts: 3,
        run_after: new Date(),
      }));
      if (type === 'candidate_file_import') this.metrics.increment('imports_enqueued');
      return created;
    } catch (error) {
      const raced = await this.jobs.findOne({ where: { idempotency_key: scopedKey } });
      if (raced) return raced;
      throw error;
    }
  }

  async findById(id: number, user: UserEntity) {
    const where = user.role === 'admin'
      ? { id }
      : { id, organization_id: user.organization_id };
    const job = await this.jobs.findOne({ where });
    if (!job) throw new NotFoundException(`Background job ${id} not found`);
    return job;
  }

  async retryCandidateBatch(batchId: number, user: UserEntity) {
    const recent = await this.jobs.find({
      where: user.role === UserRole.ADMIN
        ? { type: 'candidate_file_import' }
        : { type: 'candidate_file_import', organization_id: user.organization_id },
      order: { created_date: 'DESC' },
      take: 200,
    });
    const job = recent.find(candidate => Number(candidate.payload.batch_id) === batchId);
    if (!job) throw new NotFoundException(`No import job found for batch ${batchId}`);
    if (job.status === 'running') throw new ConflictException('Import is already running');
    Object.assign(job, {
      status: 'pending', attempts: 0, error: null, result: null,
      payload: { ...job.payload, retry_failed_only: true },
      run_after: new Date(), locked_at: null, completed_at: null,
    });
    this.metrics.increment('queue_retries');
    return this.jobs.save(job);
  }

  @Interval(2000)
  async processNext() {
    if (this.processing) return;
    this.processing = true;
    try {
      await this.recoverAbandonedJobs();
      const job = await this.jobs.findOne({
        where: { status: 'pending', run_after: LessThanOrEqual(new Date()) },
        order: { created_date: 'ASC' },
      });
      if (!job) return;
      const claim = await this.jobs.update({ id: job.id, status: 'pending' }, {
        status: 'running', locked_at: new Date(), attempts: job.attempts + 1,
      });
      if (!claim.affected) return;
      await this.execute(job.id);
    } finally {
      this.processing = false;
    }
  }

  @Interval(60_000)
  async scheduleDueImportSources() {
    const admin = await this.users.findOne({ where: { role: UserRole.ADMIN, is_active: true } });
    if (!admin) return;
    const now = Date.now();
    const sources = await this.sources.find({ where: { is_active: true } });
    for (const source of sources) {
      if (!source.interval_hours) continue;
      const intervalMs = source.interval_hours * 60 * 60 * 1000;
      if (source.last_sync && now - source.last_sync.getTime() < intervalMs) continue;
      const window = Math.floor(now / intervalMs);
      await this.enqueue('import_source_sync', { source_id: source.id }, `scheduled-source-${source.id}-${window}`, admin);
    }
  }

  private async execute(id: number) {
    const job = await this.jobs.findOneOrFail({ where: { id } });
    try {
      const user = await this.users.findOne({ where: { id: job.requested_by } });
      if (!user || !user.is_active) throw new Error('Requesting user is no longer active');
      let result: Record<string, unknown>;
      if (job.type === 'candidate_file_import') {
        result = await this.imports.importCandidatesFromFile({
          fileUrl: String(job.payload.file_url),
          batchId: Number(job.payload.batch_id),
          fileName: job.payload.file_name ? String(job.payload.file_name) : undefined,
          retryFailedOnly: Boolean(job.payload.retry_failed_only),
        }, user);
      } else {
        const source = await this.sources.findOne({ where: { id: Number(job.payload.source_id) } });
        if (!source) throw new Error('Import source not found');
        result = await this.crawler.crawlCareerPage({
          url: source.url,
          source_id: source.id,
          company_name: source.name,
        }, user);
        if ((result as any).errors_count > 0) throw new Error((result as any).errors?.join('; ') || 'Import source failed');
      }
      Object.assign(job, { status: 'completed', result, error: null, completed_at: new Date(), locked_at: null });
      await this.jobs.save(job);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (job.type === 'candidate_file_import') this.metrics.increment('import_failures');
      const exhausted = job.attempts >= job.max_attempts;
      if (job.type === 'import_source_sync') {
        const source = await this.sources.findOne({ where: { id: Number(job.payload.source_id) } });
        if (source) {
          source.last_sync_status = 'error';
          source.last_error = message;
          source.retry_count = job.attempts;
          source.last_retry_attempt = new Date();
          await this.sources.save(source);
        }
      }
      Object.assign(job, {
        status: exhausted ? 'failed' : 'pending',
        error: message,
        locked_at: null,
        run_after: exhausted ? null : new Date(Date.now() + Math.min(60_000, 2 ** job.attempts * 1000)),
      });
      await this.jobs.save(job);
      this.logger.warn(`Background job ${job.id} ${exhausted ? 'failed' : 'will retry'}: ${message}`);
    }
  }

  private async recoverAbandonedJobs() {
    const cutoff = new Date(Date.now() - 15 * 60 * 1000);
    await this.jobs.update({ status: 'running', locked_at: LessThan(cutoff) }, {
      status: 'pending', locked_at: null, run_after: new Date(), error: 'Recovered after worker interruption',
    });
  }
}
