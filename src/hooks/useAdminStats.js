import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { httpClient } from '@/api/client/httpClient';

export function getDateRange(range, customFrom, customTo) {
  const now = new Date();
  const startOfDay = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
  const endOfDay = (d) => { const x = new Date(d); x.setHours(23,59,59,999); return x; };

  switch (range) {
    case 'today':
      return { from: startOfDay(now), to: endOfDay(now) };
    case 'yesterday': {
      const y = new Date(now); y.setDate(y.getDate() - 1);
      return { from: startOfDay(y), to: endOfDay(y) };
    }
    case 'week': {
      const w = new Date(now); w.setDate(w.getDate() - 6);
      return { from: startOfDay(w), to: endOfDay(now) };
    }
    case 'month': {
      const m = new Date(now); m.setDate(m.getDate() - 29);
      return { from: startOfDay(m), to: endOfDay(now) };
    }
    case 'quarter': {
      const q = new Date(now); q.setDate(q.getDate() - 89);
      return { from: startOfDay(q), to: endOfDay(now) };
    }
    case 'year': {
      const yr = new Date(now); yr.setDate(yr.getDate() - 364);
      return { from: startOfDay(yr), to: endOfDay(now) };
    }
    case 'custom':
      return {
        from: customFrom ? startOfDay(new Date(customFrom)) : startOfDay(new Date(now.setDate(now.getDate() - 29))),
        to: customTo ? endOfDay(new Date(customTo)) : endOfDay(new Date()),
      };
    default:
      return { from: startOfDay(new Date(now.setDate(now.getDate() - 6))), to: endOfDay(new Date()) };
  }
}

export function getPrevRange(range, customFrom, customTo) {
  const { from, to } = getDateRange(range, customFrom, customTo);
  const diff = to - from;
  return { from: new Date(from - diff), to: new Date(from - 1) };
}

function inRange(dateStr, from, to) {
  const d = new Date(dateStr);
  return d >= from && d <= to;
}

export function useAdminStats(range, customFrom, customTo) {
  const { data: jobs = [], isLoading: l1 } = useQuery({
    queryKey: ['admin-stats-jobs'],
    queryFn: () => httpClient.get('/jobs?sort=created_date&order=DESC&limit=1000', { cache: false }),
    staleTime: 60_000,
  });
  const { data: applications = [], isLoading: l2 } = useQuery({
    queryKey: ['admin-stats-apps'],
    queryFn: () => httpClient.get('/applications?sort=created_date&order=DESC&limit=1000', { cache: false }),
    staleTime: 60_000,
  });
  const { data: candidates = [], isLoading: l3 } = useQuery({
    queryKey: ['admin-stats-candidates'],
    queryFn: () => httpClient.get('/candidates/profiles?sort=created_date&order=DESC&limit=1000', { cache: false }),
    staleTime: 60_000,
  });
  const { data: savedJobs = [], isLoading: l4 } = useQuery({
    queryKey: ['admin-stats-saved'],
    queryFn: () => httpClient.get('/jobs/saved?sort=created_date&order=DESC&limit=1000', { cache: false }),
    staleTime: 60_000,
  });

  const isLoading = l1 || l2 || l3 || l4;

  const stats = useMemo(() => {
    const { from, to } = getDateRange(range, customFrom, customTo);
    const { from: pFrom, to: pTo } = getPrevRange(range, customFrom, customTo);

    const inCur = (d) => inRange(d, from, to);
    const inPrev = (d) => inRange(d, pFrom, pTo);

    const pct = (cur, prev) => prev === 0 ? null : Math.round(((cur - prev) / prev) * 100);

    // Jobs
    const jobsPublished = jobs.filter(j => inCur(j.created_date)).length;
    const jobsPublishedPrev = jobs.filter(j => inPrev(j.created_date)).length;
    const jobsActive = jobs.filter(j => !j.is_closed).length;
    const jobsClosed = jobs.filter(j => j.is_closed && inCur(j.updated_date)).length;
    const jobsClosedPrev = jobs.filter(j => j.is_closed && inPrev(j.updated_date)).length;
    const jobsImported = jobs.filter(j => j.external_id && inCur(j.created_date)).length;
    const jobsImportedPrev = jobs.filter(j => j.external_id && inPrev(j.created_date)).length;

    // Applications
    const appsReceived = applications.filter(a => inCur(a.created_date)).length;
    const appsReceivedPrev = applications.filter(a => inPrev(a.created_date)).length;
    const resumesUploaded = applications.filter(a => a.resume_url && inCur(a.created_date)).length;
    const resumesUploadedPrev = applications.filter(a => a.resume_url && inPrev(a.created_date)).length;

    // Candidates (new registrations proxy: candidates created in range)
    const newCandidates = candidates.filter(c => inCur(c.created_date)).length;
    const newCandidatesPrev = candidates.filter(c => inPrev(c.created_date)).length;

    // Employers (jobs from unique employer_ids created in range)
    const employersInCur = new Set(jobs.filter(j => j.employer_id && inCur(j.created_date)).map(j => j.employer_id)).size;
    const employersInPrev = new Set(jobs.filter(j => j.employer_id && inPrev(j.created_date)).map(j => j.employer_id)).size;

    // Saved jobs
    const savedCount = savedJobs.filter(s => inCur(s.created_date)).length;
    const savedCountPrev = savedJobs.filter(s => inPrev(s.created_date)).length;

    // Views total (from all jobs - cumulative, just show total)
    const totalViews = jobs.reduce((sum, j) => sum + (j.views || 0), 0);

    // Conversion rate
    const totalApps = applications.length;
    const convRate = totalViews > 0 ? ((totalApps / totalViews) * 100).toFixed(1) : 0;

    // Chart data - daily breakdown for current range
    const dayCount = Math.ceil((to - from) / 86400000) + 1;
    const chartDays = Array.from({ length: Math.min(dayCount, 30) }, (_, i) => {
      const d = new Date(from);
      d.setDate(d.getDate() + i);
      const label = d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' });
      const dayStart = new Date(d); dayStart.setHours(0,0,0,0);
      const dayEnd = new Date(d); dayEnd.setHours(23,59,59,999);
      return {
        date: label,
        apps: applications.filter(a => inRange(a.created_date, dayStart, dayEnd)).length,
        jobs: jobs.filter(j => inRange(j.created_date, dayStart, dayEnd)).length,
        candidates: candidates.filter(c => inRange(c.created_date, dayStart, dayEnd)).length,
      };
    });

    // Top jobs by applications
    const jobAppCounts = {};
    applications.filter(a => inCur(a.created_date)).forEach(a => {
      jobAppCounts[a.job_id] = (jobAppCounts[a.job_id] || 0) + 1;
    });
    const topJobs = jobs
      .map(j => ({
        ...j,
        appCount: jobAppCounts[j.id] || 0,
        convRate: j.views > 0 ? ((jobAppCounts[j.id] || 0) / j.views * 100).toFixed(1) : '0',
      }))
      .sort((a, b) => b.appCount - a.appCount)
      .slice(0, 8);

    // Top employers by apps
    const employerStats = {};
    jobs.forEach(j => {
      if (!j.employer_id) return;
      if (!employerStats[j.employer_id]) employerStats[j.employer_id] = { id: j.employer_id, jobs: 0, apps: 0, views: 0 };
      employerStats[j.employer_id].jobs++;
      employerStats[j.employer_id].views += j.views || 0;
    });
    applications.forEach(a => {
      if (a.employer_id && employerStats[a.employer_id]) {
        employerStats[a.employer_id].apps++;
      }
    });
    const topEmployers = Object.values(employerStats).sort((a, b) => b.apps - a.apps).slice(0, 6);

    // Sources breakdown
    const sourceCount = { app: 0, linkedin: 0, facebook: 0, jobsite: 0, other: 0 };
    applications.filter(a => inCur(a.created_date)).forEach(a => {
      const s = a.source || 'other';
      sourceCount[s] = (sourceCount[s] || 0) + 1;
    });

    return {
      jobsPublished, jobsPublishedPrev, pctJobsPublished: pct(jobsPublished, jobsPublishedPrev),
      jobsActive,
      jobsClosed, jobsClosedPrev, pctJobsClosed: pct(jobsClosed, jobsClosedPrev),
      jobsImported, jobsImportedPrev, pctJobsImported: pct(jobsImported, jobsImportedPrev),
      appsReceived, appsReceivedPrev, pctApps: pct(appsReceived, appsReceivedPrev),
      resumesUploaded, resumesUploadedPrev, pctResumes: pct(resumesUploaded, resumesUploadedPrev),
      newCandidates, newCandidatesPrev, pctCandidates: pct(newCandidates, newCandidatesPrev),
      employersInCur, employersInPrev, pctEmployers: pct(employersInCur, employersInPrev),
      savedCount, savedCountPrev, pctSaved: pct(savedCount, savedCountPrev),
      totalViews,
      convRate,
      chartDays,
      topJobs,
      topEmployers,
      sourceCount,
    };
  }, [jobs, applications, candidates, savedJobs, range, customFrom, customTo]);

  return { stats, isLoading, jobs, applications };
}
