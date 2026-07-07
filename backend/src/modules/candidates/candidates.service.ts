import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindManyOptions } from 'typeorm';
import { CandidateEntity } from './entities/candidate.entity';
import { CandidateNoteEntity } from './entities/candidate-note.entity';
import { CandidateTagEntity } from './entities/candidate-tag.entity';
import { CandidateTimelineEntity } from './entities/candidate-timeline.entity';
import { CandidateDocumentEntity } from './entities/candidate-document.entity';
import { CandidateImportBatchEntity } from './entities/candidate-import-batch.entity';
import { CandidateProfileEntity } from './entities/candidate-profile.entity';
import { CandidateAccessEntity } from './entities/candidate-access.entity';
import {
  CreateCandidateDto,
  UpdateCandidateDto,
  QueryCandidatesDto,
  CreateCandidateNoteDto,
  UpdateCandidateNoteDto,
  CreateCandidateTagDto,
  CreateCandidateProfileDto,
  UpdateCandidateProfileDto,
} from './dto/candidates.dto';
import { UserEntity } from '../users/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { getRlsWhere, isBlocked } from '../../common/utils/rls.utils';
import {
  buildPaginatedResponse,
  getSkipTake,
} from '../../common/utils/pagination.utils';

@Injectable()
export class CandidatesService {
  constructor(
    @InjectRepository(CandidateEntity)
    private readonly candidateRepo: Repository<CandidateEntity>,
    @InjectRepository(CandidateNoteEntity)
    private readonly noteRepo: Repository<CandidateNoteEntity>,
    @InjectRepository(CandidateTagEntity)
    private readonly tagRepo: Repository<CandidateTagEntity>,
    @InjectRepository(CandidateTimelineEntity)
    private readonly timelineRepo: Repository<CandidateTimelineEntity>,
    @InjectRepository(CandidateDocumentEntity)
    private readonly documentRepo: Repository<CandidateDocumentEntity>,
    @InjectRepository(CandidateImportBatchEntity)
    private readonly batchRepo: Repository<CandidateImportBatchEntity>,
    @InjectRepository(CandidateProfileEntity)
    private readonly profileRepo: Repository<CandidateProfileEntity>,
    @InjectRepository(CandidateAccessEntity)
    private readonly accessRepo: Repository<CandidateAccessEntity>,
  ) {}

  // ─── Candidates ──────────────────────────────────────────────────────────
  async findAll(query: QueryCandidatesDto, user: UserEntity) {
    const { page, limit, sort, order, search, status, domain_id, role_id,
      recruiter_id, team_manager_id, is_deleted, parsing_status, review_required, import_batch_id } = query;

    const rlsWhere = getRlsWhere('Candidate', {
      id: user.id, role: user.role, organization_id: user.organization_id,
      employer_company_id: user.employer_company_id, email: user.email,
      impersonating: user.impersonating,
    });

    if (isBlocked(rlsWhere)) return buildPaginatedResponse([], 0, { page, limit });

    const where: Record<string, any> = { ...rlsWhere };
    if (status) where.status = status;
    if (domain_id) where.domain_id = domain_id;
    if (role_id) where.role_id = role_id;
    if (recruiter_id) where.recruiter_id = recruiter_id;
    if (team_manager_id) where.team_manager_id = team_manager_id;
    if (is_deleted !== undefined) where.is_deleted = is_deleted;
    if (parsing_status) where.parsing_status = parsing_status;
    if (review_required !== undefined) where.review_required = review_required;
    if (import_batch_id) where.import_batch_id = import_batch_id;

    const { skip, take } = getSkipTake(page, limit);

    let findWhere: any = where;
    if (search) {
      findWhere = [
        { ...where, full_name: Like(`%${search}%`) },
        { ...where, email: Like(`%${search}%`) },
      ];
    }

    const [data, total] = await this.candidateRepo.findAndCount({
      where: findWhere,
      order: { [sort]: order },
      skip,
      take,
    });

    return buildPaginatedResponse(data, total, { page, limit, sort, order });
  }

  async findById(id: number, user: UserEntity): Promise<CandidateEntity> {
    const candidate = await this.candidateRepo.findOne({ where: { id } as any });
    if (!candidate) throw new NotFoundException(`Candidate ${id} not found`);
    this.checkAccess(candidate, user);
    return candidate;
  }

  async create(dto: CreateCandidateDto, user: UserEntity): Promise<CandidateEntity> {
    const candidate = this.candidateRepo.create({
      ...dto,
      organization_id: user.organization_id,
      recruiter_id: dto.recruiter_id ?? (user.role === UserRole.RECRUITER ? user.id : null),
      team_manager_id: dto.team_manager_id ?? (user.role === UserRole.TEAM_MANAGER ? user.id : null),
    } as any);
    return this.candidateRepo.save(candidate) as unknown as Promise<CandidateEntity>;
  }

  async update(id: number, dto: UpdateCandidateDto, user: UserEntity): Promise<CandidateEntity> {
    const candidate = await this.findById(id, user);
    Object.assign(candidate, dto);
    if (dto.is_deleted && !candidate.deleted_at) {
      candidate.deleted_at = new Date();
      candidate.deleted_by = user.id;
    }
    return this.candidateRepo.save(candidate) as unknown as Promise<CandidateEntity>;
  }

  async softDelete(id: number, user: UserEntity): Promise<void> {
    await this.update(id, { is_deleted: true } as any, user);
  }

  // ─── Notes ──────────────────────────────────────────────────────────────
  async getNotes(candidateId: number, user: UserEntity) {
    await this.findById(candidateId, user);
    return this.noteRepo.find({
      where: { candidate_id: candidateId },
      order: { is_pinned: 'DESC', created_date: 'DESC' },
    });
  }

  async createNote(dto: CreateCandidateNoteDto, user: UserEntity) {
    await this.findById(dto.candidate_id, user);
    const note = this.noteRepo.create({
      ...dto,
      organization_id: user.organization_id,
    } as any);
    return this.noteRepo.save(note);
  }

  async updateNote(noteId: number, dto: UpdateCandidateNoteDto, user: UserEntity) {
    const note = await this.noteRepo.findOne({ where: { id: noteId } });
    if (!note) throw new NotFoundException(`Note ${noteId} not found`);
    Object.assign(note, dto);
    return this.noteRepo.save(note);
  }

  async deleteNote(noteId: number, user: UserEntity) {
    const note = await this.noteRepo.findOne({ where: { id: noteId } });
    if (!note) throw new NotFoundException(`Note ${noteId} not found`);
    await this.noteRepo.remove(note);
  }

  // ─── Tags ──────────────────────────────────────────────────────────────
  async getTags(candidateId: number, user: UserEntity) {
    await this.findById(candidateId, user);
    return this.tagRepo.find({ where: { candidate_id: candidateId } });
  }

  async createTag(dto: CreateCandidateTagDto, user: UserEntity) {
    await this.findById(dto.candidate_id, user);
    const tag = this.tagRepo.create(dto as any);
    return this.tagRepo.save(tag);
  }

  async deleteTag(tagId: number, user: UserEntity) {
    const tag = await this.tagRepo.findOne({ where: { id: tagId } });
    if (!tag) throw new NotFoundException(`Tag ${tagId} not found`);
    await this.tagRepo.remove(tag);
  }

  // ─── Timeline ───────────────────────────────────────────────────────────
  async getTimeline(candidateId: number, user: UserEntity) {
    await this.findById(candidateId, user);
    return this.timelineRepo.find({
      where: { candidate_id: candidateId },
      order: { created_date: 'DESC' },
    });
  }

  async createTimelineEvent(data: Partial<CandidateTimelineEntity>) {
    const event = this.timelineRepo.create(data);
    return this.timelineRepo.save(event);
  }

  // ─── Documents ──────────────────────────────────────────────────────────
  async getDocuments(candidateId: number, user: UserEntity) {
    await this.findById(candidateId, user);
    return this.documentRepo.find({
      where: { candidate_id: candidateId },
      order: { uploaded_at: 'DESC' },
    });
  }

  async createDocument(data: Partial<CandidateDocumentEntity>, user: UserEntity) {
    const doc = this.documentRepo.create({
      ...data,
      organization_id: user.organization_id,
    } as any);
    return this.documentRepo.save(doc);
  }

  // ─── Import Batches ──────────────────────────────────────────────────────
  async getBatches(user: UserEntity) {
    const where: Record<string, any> = {};
    if (user.role !== UserRole.ADMIN) {
      where.recruiter_id = user.id;
    }
    return this.batchRepo.find({ where, order: { created_date: 'DESC' } });
  }

  async getBatch(id: number) {
    const batch = await this.batchRepo.findOne({ where: { id } });
    if (!batch) throw new NotFoundException(`Import batch ${id} not found`);
    return batch;
  }

  async createBatch(data: Partial<CandidateImportBatchEntity>) {
    const batch = this.batchRepo.create(data);
    return this.batchRepo.save(batch);
  }

  async updateBatch(id: number, data: Partial<CandidateImportBatchEntity>) {
    const batch = await this.getBatch(id);
    Object.assign(batch, data);
    return this.batchRepo.save(batch);
  }

  // ─── Profile ─────────────────────────────────────────────────────────────
  async getProfile(userEmail: string) {
    return this.profileRepo.findOne({ where: { user_email: userEmail } });
  }

  /** Flat list with optional filters — mirrors base44.entities.CandidateProfile.filter(...) */
  async findAllProfiles(filters: { user_email?: string; is_public?: boolean }) {
    const where: Record<string, any> = {};
    if (filters.user_email) where.user_email = filters.user_email;
    if (filters.is_public !== undefined) where.is_public = filters.is_public;
    return this.profileRepo.find({ where, order: { created_date: 'DESC' } as any });
  }

  async upsertProfile(dto: CreateCandidateProfileDto | UpdateCandidateProfileDto) {
    const existing = await this.profileRepo.findOne({ where: { user_email: (dto as any).user_email } });
    if (existing) {
      Object.assign(existing, dto);
      return this.profileRepo.save(existing);
    }
    const profile = this.profileRepo.create(dto as any);
    return this.profileRepo.save(profile);
  }

  /** Update by profile id (int) OR user_email — mirrors base44's `.update(profile.id, data)` usage */
  async updateProfileByKey(key: string, dto: Partial<CandidateProfileEntity>) {
    const numericId = parseInt(key, 10);
    let existing: CandidateProfileEntity | null = null;
    if (!isNaN(numericId)) {
      existing = await this.profileRepo.findOne({ where: { id: numericId } });
    }
    if (!existing) existing = await this.profileRepo.findOne({ where: { user_email: key } });
    if (!existing) throw new NotFoundException(`Candidate profile ${key} not found`);
    Object.assign(existing, dto);
    return this.profileRepo.save(existing);
  }

  // ─── Access ──────────────────────────────────────────────────────────────
  async getAccess(candidateId: number) {
    return this.accessRepo.find({ where: { candidate_id: candidateId } });
  }

  /** Flat list — mirrors base44.entities.CandidateAccess.list(...) */
  async findAllAccess(filters: Record<string, any> = {}) {
    const where: Record<string, any> = {};
    if (filters.candidate_id) where.candidate_id = filters.candidate_id;
    if (filters.granted_to_organization_id) where.granted_to_organization_id = filters.granted_to_organization_id;
    return this.accessRepo.find({ where, order: { created_date: 'DESC' } as any });
  }

  async createAccess(data: Partial<CandidateAccessEntity>) {
    const access = this.accessRepo.create(data);
    return this.accessRepo.save(access);
  }

  async updateAccess(id: number, data: Partial<CandidateAccessEntity>) {
    const access = await this.accessRepo.findOne({ where: { id } });
    if (!access) throw new NotFoundException(`Access ${id} not found`);
    Object.assign(access, data);
    return this.accessRepo.save(access);
  }

  async deleteAccess(id: number) {
    const access = await this.accessRepo.findOne({ where: { id } });
    if (!access) throw new NotFoundException(`Access ${id} not found`);
    await this.accessRepo.remove(access);
  }

  // ─── Private helpers ─────────────────────────────────────────────────────
  private checkAccess(candidate: CandidateEntity, user: UserEntity) {
    if (user.role === UserRole.ADMIN) return;
    if (candidate.organization_id !== user.organization_id) {
      throw new ForbiddenException('Access denied');
    }
    if (user.role === UserRole.RECRUITER || user.role === UserRole.INTERNAL_RECRUITER) {
      if (candidate.recruiter_id && candidate.recruiter_id !== user.id) {
        throw new ForbiddenException('Access denied to this candidate');
      }
    }
    if (user.role === UserRole.TEAM_MANAGER) {
      if (candidate.team_manager_id && candidate.team_manager_id !== user.id) {
        throw new ForbiddenException('Access denied to this candidate');
      }
    }
  }
}

