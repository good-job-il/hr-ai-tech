/**
 * getDashboardStats — Platform admin dashboard aggregation
 *
 * TODO (BACKLOG — pre-scale, before ~5,000+ candidates):
 * ─────────────────────────────────────────────────────────────────────────────
 * The countAll() helper paginates until exhaustion — correct, but O(N) in API
 * calls as data grows. The recentCandidates/recentJobs/recentApplications lists
 * (list 500/200) are loaded purely to compute 7-day trend data and source
 * breakdown in JS. At scale this is a bottleneck.
 *
 * Required refactors:
 *   1. Replace countAll() with a native DB count/aggregate endpoint when available.
 *   2. Replace recentCandidates (list 500) trend calculation with a dedicated
 *      time-bucketed aggregation query (e.g. GROUP BY date, source).
 *   3. Replace recentApplications (list 200) trend with same approach.
 *   4. CandidateImportBatch: load only last 30 batches (not 200) — batch stats
 *      should be stored as pre-aggregated totals on an ImportSummary entity.
 *
 * Current risk: ~3 extra API round-trips per 500 candidates above the first batch.
 * Acceptable for pilot (<1,000 candidates per org). NOT acceptable at 10k+.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const db = base44.asServiceRole;

    async function countAll(entity, filter = null) {
      let total = 0;
      let skip = 0;
      const batchSize = 500;
      while (true) {
        const batch = filter
          ? await entity.filter(filter, '-created_date', batchSize, skip)
          : await entity.list('-created_date', batchSize, skip);
        total += batch.length;
        if (batch.length < batchSize) break;
        skip += batchSize;
      }
      return total;
    }

    // Run all counts + recent data in parallel
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
      countAll(db.entities.Candidate),
      countAll(db.entities.Job, { is_closed: false }),
      countAll(db.entities.Job),
      countAll(db.entities.Application),
      countAll(db.entities.Interview, { status: 'scheduled' }),
      countAll(db.entities.Company),
      countAll(db.entities.Candidate, { review_required: true }),
      countAll(db.entities.Application, { status: 'new' }),
      db.entities.CandidateImportBatch.list('-created_date', 200),
      db.entities.Candidate.list('-created_date', 500),
      db.entities.Job.list('-created_date', 200),
      db.entities.Application.list('-created_date', 200),
      db.entities.CandidateTimeline.list('-created_date', 30),
    ]);

    // Batch-level stats
    const totalImported = batches.reduce((s, b) => s + (b.successful_imports || 0), 0);
    const failedImports = batches.reduce((s, b) => s + (b.failed_imports || 0), 0);
    const conversionFailed = batches.reduce((s, b) => s + (b.conversion_failures || 0), 0);
    const pendingBatches = batches.filter(b => b.status === 'in_progress' || b.status === 'pending').length;

    // ── Build 7-day trend data ──────────────────────────────────────────────
    const now = new Date();
    const trendDays = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd   = new Date(dayStart.getTime() + 86400000);
      const label = `${d.getDate()}/${d.getMonth() + 1}`;

      const dayEnd_iso = dayEnd.toISOString();
      const dayStart_iso = dayStart.toISOString();

      trendDays.push({
        day: label,
        candidates: recentCandidates.filter(c => c.created_date >= dayStart_iso && c.created_date < dayEnd_iso).length,
        jobs: recentJobs.filter(j => j.created_date >= dayStart_iso && j.created_date < dayEnd_iso).length,
        applications: recentApplications.filter(a => a.created_date >= dayStart_iso && a.created_date < dayEnd_iso).length,
        imports: batches.filter(b => b.created_date >= dayStart_iso && b.created_date < dayEnd_iso).length,
      });
    }

    // ── Recent imports (last 5 completed batches) ───────────────────────────
    const recentImports = batches
      .filter(b => b.status === 'completed' || b.successful_imports > 0)
      .slice(0, 5)
      .map(b => ({
        name: b.source_file || b.batch_name || 'קובץ לא ידוע',
        company: b.batch_name || '—',
        date: b.processing_completed_at
          ? new Date(b.processing_completed_at).toLocaleString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
          : new Date(b.created_date).toLocaleString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        count: b.successful_imports || 0,
        status: b.status,
      }));

    // ── Recent activity feed from CandidateTimeline ─────────────────────────
    const recentActivity = recentTimelines.slice(0, 6).map(t => {
      const typeMap = {
        imported:            { icon: 'UserPlus',   color: '#8B5CF6', bg: '#F3EFFF' },
        resume_uploaded:     { icon: 'FileText',   color: '#3B82F6', bg: '#EFF6FF' },
        status_changed:      { icon: 'Activity',   color: '#F59E0B', bg: '#FFFBEB' },
        interview_scheduled: { icon: 'Calendar',   color: '#10B981', bg: '#ECFDF5' },
        hired:               { icon: 'CheckCircle2', color: '#10B981', bg: '#ECFDF5' },
        rejected:            { icon: 'XCircle',    color: '#EF4444', bg: '#FFF1F2' },
        note_added:          { icon: 'MessageSquare', color: '#6366F1', bg: '#EEF2FF' },
        sent_to_employer:    { icon: 'Send',        color: '#0891B2', bg: '#E0F2FE' },
      };
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

    // ── Import source breakdown ─────────────────────────────────────────────
    const sourceCounts = {};
    recentCandidates.forEach(c => {
      const src = c.source || 'manual';
      sourceCounts[src] = (sourceCounts[src] || 0) + 1;
    });
    const sourceLabels = { manual: 'ידני', import: 'ייבוא', linkedin: 'LinkedIn', upload: 'העלאה', crawl: 'סריקה' };
    const importSourceData = Object.entries(sourceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([key, val]) => ({
        name: sourceLabels[key] || key,
        value: Math.round((val / recentCandidates.length) * 100),
      }));

    return Response.json({
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
      trendData: trendDays,
      recentImports,
      recentActivity,
      importSourceData,
    });
  } catch (error) {
    console.error('[getDashboardStats] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});