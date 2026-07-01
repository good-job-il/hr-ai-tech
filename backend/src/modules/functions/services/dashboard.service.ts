import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CandidateEntity } from '../../candidates/entities/candidate.entity';
import { CandidateImportBatchEntity } from '../../candidates/entities/candidate-import-batch.entity';
import { CandidateTimelineEntity } from '../../candidates/entities/candidate-timeline.entity';
import { JobEntity } from '../../jobs/entities/job.entity';
import { ApplicationEntity } from '../../applications/entities/application.entity';
import { InterviewEntity } from '../../interviews/interview.entity';
import { CompanyEntity } from '../../companies/company.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(CandidateEntity) private readonly candidateRepo: Repository<CandidateEntity>,
    @InjectRepository(CandidateImportBatchEntity) private readonly batchRepo: Repository<CandidateImportBatchEntity>,
    @InjectRepository(CandidateTimelineEntity) private readonly timelineRepo: Repository<CandidateTimelineEntity>,
    @InjectRepository(JobEntity) private readonly jobRepo: Repository<JobEntity>,
    @InjectRepository(ApplicationEntity) private readonly appRepo: Repository<ApplicationEntity>,
    @InjectRepository(InterviewEntity) private readonly interviewRepo: Repository<InterviewEntity>,
    @InjectRepository(CompanyEntity) private readonly companyRepo: Repository<CompanyEntity>,
  ) {}

  async getDashboardStats() {
    const [
      candidates,
      openJobs,
      allJobs,
      applications,
      scheduledInterviews,
      companies,
      reviewRequired,
      newApplications,
      batches,
      recentCandidates,
      recentJobs,
      recentApplications,
      recentTimelines,
    ] = await Promise.all([
      this.candidateRepo.count(),
      this.jobRepo.count({ where: { is_closed: false } }),
      this.jobRepo.count(),
      this.appRepo.count(),
      this.interviewRepo.count({ where: { status: 'scheduled' } }),
      this.companyRepo.count(),
      this.candidateRepo.count({ where: { review_required: true } }),
      this.appRepo.count({ where: { status: 'new' } }),
      this.batchRepo.find({ order: { created_date: 'DESC' }, take: 200 }),
      this.candidateRepo.find({ order: { created_date: 'DESC' }, take: 500 }),
      this.jobRepo.find({ order: { created_date: 'DESC' }, take: 200 }),
      this.appRepo.find({ order: { created_date: 'DESC' }, take: 200 }),
      this.timelineRepo.find({ order: { created_date: 'DESC' }, take: 30 }),
    ]);

    const totalImported = batches.reduce((s, b) => s + (b.successful_imports || 0), 0);
    const failedImports = batches.reduce((s, b) => s + (b.failed_imports || 0), 0);
    const conversionFailed = batches.reduce((s, b) => s + (b.conversion_failures || 0), 0);
    const pendingBatches = batches.filter((b) => b.status === 'processing' || b.status === 'pending').length;

    // ── 7-day trend ──────────────────────────────────────────────────────
    const now = new Date();
    const trendData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(dayStart.getTime() + 86400000);
      const label = `${d.getDate()}/${d.getMonth() + 1}`;

      trendData.push({
        day: label,
        candidates: recentCandidates.filter((c) => c.created_date >= dayStart && c.created_date < dayEnd).length,
        jobs: recentJobs.filter((j) => j.created_date >= dayStart && j.created_date < dayEnd).length,
        applications: recentApplications.filter((a) => a.created_date >= dayStart && a.created_date < dayEnd).length,
        imports: batches.filter((b) => b.created_date >= dayStart && b.created_date < dayEnd).length,
      });
    }

    // ── Recent imports ───────────────────────────────────────────────────
    const recentImports = batches
      .filter((b) => b.status === 'completed' || b.successful_imports > 0)
      .slice(0, 5)
      .map((b) => ({
        name: b.source_file || b.batch_name || 'קובץ לא ידוע',
        company: b.batch_name || '—',
        date: (b.processing_completed_at || b.created_date).toLocaleString('he-IL', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        count: b.successful_imports || 0,
        status: b.status,
      }));

    // ── Recent activity feed ─────────────────────────────────────────────
    const typeMap: Record<string, { icon: string; color: string; bg: string }> = {
      imported: { icon: 'UserPlus', color: '#8B5CF6', bg: '#F3EFFF' },
      resume_uploaded: { icon: 'FileText', color: '#3B82F6', bg: '#EFF6FF' },
      status_changed: { icon: 'Activity', color: '#F59E0B', bg: '#FFFBEB' },
      interview_scheduled: { icon: 'Calendar', color: '#10B981', bg: '#ECFDF5' },
      hired: { icon: 'CheckCircle2', color: '#10B981', bg: '#ECFDF5' },
      rejected: { icon: 'XCircle', color: '#EF4444', bg: '#FFF1F2' },
      note_added: { icon: 'MessageSquare', color: '#6366F1', bg: '#EEF2FF' },
      sent_to_employer: { icon: 'Send', color: '#0891B2', bg: '#E0F2FE' },
    };
    const recentActivity = recentTimelines.slice(0, 6).map((t) => {
      const meta = typeMap[t.event_type] || { icon: 'Activity', color: '#64748B', bg: '#F1F5F9' };
      const elapsed = Date.now() - new Date(t.created_date).getTime();
      const hours = Math.floor(elapsed / 3600000);
      const minutes = Math.floor((elapsed % 3600000) / 60000);
      const timeAgo = hours > 0 ? `לפני ${hours} שעות` : `לפני ${minutes} דקות`;
      return {
        icon: meta.icon,
        color: meta.color,
        bg: meta.bg,
        text: t.description || t.event_type,
        sub: t.candidate_email || t.performed_by || '',
        time: timeAgo,
      };
    });

    // ── Import source breakdown ──────────────────────────────────────────
    const sourceCounts: Record<string, number> = {};
    recentCandidates.forEach((c) => {
      const src = c.source || 'manual';
      sourceCounts[src] = (sourceCounts[src] || 0) + 1;
    });
    const sourceLabels: Record<string, string> = {
      manual: 'ידני',
      import: 'ייבוא',
      linkedin: 'LinkedIn',
      upload: 'העלאה',
      crawl: 'סריקה',
    };
    const importSourceData = Object.entries(sourceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([key, val]) => ({
        name: sourceLabels[key] || key,
        value: recentCandidates.length ? Math.round((val / recentCandidates.length) * 100) : 0,
      }));

    return {
      candidates,
      openJobs,
      allJobs,
      applications,
      scheduledInterviews,
      companies,
      reviewRequired,
      newApplications,
      totalImported,
      failedImports,
      conversionFailed,
      pendingBatches,
      batchCount: batches.length,
      trendData,
      recentImports,
      recentActivity,
      importSourceData,
    };
  }
}

