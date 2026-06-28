import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { base44 } from '@/api/base44Client';
import { createStageChangeNotifications } from '@/lib/pipelineNotifications';

function getDefaultStages(t) {
  return [
    { id: 'new', label: t('pipeline.stages.new'), color: '#64748B', slaHours: 24 },
    { id: 'screening', label: t('pipeline.stages.screening'), color: '#F59E0B', slaHours: 48 },
    { id: 'phone_interview', label: t('pipeline.stages.phone_interview'), color: '#3B82F6', slaHours: 72 },
    { id: 'professional_interview', label: t('pipeline.stages.professional_interview'), color: '#8B5CF6', slaHours: 96 },
    { id: 'client_stage', label: t('pipeline.stages.client_stage'), color: '#EC4899', slaHours: 120 },
    { id: 'hired', label: t('pipeline.stages.hired'), color: '#10B981', slaHours: null },
    { id: 'rejected', label: t('pipeline.stages.rejected'), color: '#EF4444', slaHours: null },
  ];
}

function stageLabel(t, id) {
  return t(`pipeline.stages.${id}`, { defaultValue: id });
}

function getMockApplications(t) {
  return [
    {
      id: 'demo-1', _isMock: true, candidate_name: t('pipeline.data.mock.candidate1Name'), job_title: 'Full Stack Developer',
      status: 'new', match_score: 94, source: 'linkedin', recruiter: t('pipeline.data.mock.recruiter1'),
      created_date: new Date(Date.now() - 2 * 3600000).toISOString(),
      stage_entered_at: new Date(Date.now() - 2 * 3600000).toISOString(),
      tags: ['React', 'Node.js'], candidate_email: 'daniel@example.com',
      candidate_phone: '050-1234567', location: t('pipeline.data.mock.locationTelAviv'), experience_years: 5,
      notes: '', resume_url: null, skills: ['React', 'Node.js', 'AWS'],
    },
    {
      id: 'demo-2', _isMock: true, candidate_name: t('pipeline.data.mock.candidate2Name'), job_title: 'Product Manager',
      status: 'screening', match_score: 88, source: 'app', recruiter: t('pipeline.data.mock.recruiter2'),
      created_date: new Date(Date.now() - 26 * 3600000).toISOString(),
      stage_entered_at: new Date(Date.now() - 26 * 3600000).toISOString(),
      tags: ['B2B', 'SaaS'], candidate_email: 'michal@example.com',
      candidate_phone: '052-9876543', location: t('pipeline.data.mock.locationHerzliya'), experience_years: 7,
      notes: t('pipeline.data.mock.noteStrongCandidate'), resume_url: null, skills: ['Product Strategy', 'Agile'],
    },
    {
      id: 'demo-3', _isMock: true, candidate_name: t('pipeline.data.mock.candidate3Name'), job_title: 'DevOps Engineer',
      status: 'phone_interview', match_score: 76, source: 'jobsite', recruiter: t('pipeline.data.mock.recruiter1'),
      created_date: new Date(Date.now() - 72 * 3600000).toISOString(),
      stage_entered_at: new Date(Date.now() - 10 * 3600000).toISOString(),
      tags: ['AWS', 'K8s'], candidate_email: 'avi@example.com',
      candidate_phone: '054-1111222', location: t('pipeline.data.mock.locationRamatGan'), experience_years: 4,
      notes: '', resume_url: null, skills: ['AWS', 'Kubernetes', 'Terraform'],
    },
    {
      id: 'demo-4', _isMock: true, candidate_name: t('pipeline.data.mock.candidate4Name'), job_title: 'UI/UX Designer',
      status: 'professional_interview', match_score: 91, source: 'linkedin', recruiter: t('pipeline.data.mock.recruiter2'),
      created_date: new Date(Date.now() - 96 * 3600000).toISOString(),
      stage_entered_at: new Date(Date.now() - 5 * 3600000).toISOString(),
      tags: ['Figma', 'Design System'], candidate_email: 'noa@example.com',
      candidate_phone: '053-3334444', location: t('pipeline.data.mock.locationTelAviv'), experience_years: 6,
      notes: t('pipeline.data.mock.noteGreatInterview'), resume_url: null, skills: ['Figma', 'User Research'],
    },
    {
      id: 'demo-5', _isMock: true, candidate_name: t('pipeline.data.mock.candidate5Name'), job_title: 'Data Analyst',
      status: 'client_stage', match_score: 83, source: 'import', recruiter: t('pipeline.data.mock.recruiter1'),
      created_date: new Date(Date.now() - 120 * 3600000).toISOString(),
      stage_entered_at: new Date(Date.now() - 20 * 3600000).toISOString(),
      tags: ['Python', 'SQL'], candidate_email: 'ron@example.com',
      candidate_phone: '050-5556666', location: t('pipeline.data.mock.locationHaifa'), experience_years: 3,
      notes: '', resume_url: null, skills: ['Python', 'SQL', 'Tableau'],
    },
  ];
}

export function usePipelineData(user, filters = {}, onNotificationCreated) {
  const { t, i18n } = useTranslation();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMockData, setIsMockData] = useState(false);
  const appsSnapshot = useRef([]);

  const stages = useMemo(() => getDefaultStages(t), [t, i18n.language]);
  const mockApplications = useMemo(() => getMockApplications(t), [t, i18n.language]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const apps = await base44.entities.Application.list('-created_date', 500);
      const isReal = apps && apps.length > 0;
      setIsMockData(!isReal);
      const filtered = applyFilters(isReal ? apps : mockApplications, filters, user);
      setApplications(filtered);
      appsSnapshot.current = filtered;
    } catch {
      const isDemoRoute = window.location.pathname.includes('demo');
      if (isDemoRoute) {
        setIsMockData(true);
        const filtered = applyFilters(mockApplications, filters, user);
        setApplications(filtered);
        appsSnapshot.current = filtered;
      } else {
        setApplications([]);
        appsSnapshot.current = [];
      }
    } finally {
      setLoading(false);
    }
  }, [filters, user, mockApplications]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const moveApplication = useCallback(async (appId, newStage) => {
    let oldStage = null;
    let application = null;

    setApplications(prev => {
      application = prev.find(a => a.id === appId);
      oldStage = application?.status;
      const next = prev.map(a => a.id === appId
        ? { ...a, status: newStage, stage_entered_at: new Date().toISOString() }
        : a
      );
      appsSnapshot.current = next;
      return next;
    });

    if (appId.startsWith('demo-')) return;

    try {
      await base44.entities.Application.update(appId, {
        status: newStage,
        stage_entered_at: new Date().toISOString(),
      });

      if (application && oldStage && oldStage !== newStage) {
        base44.functions.invoke('createApplicationTimeline', {
          application_id: appId,
          event_type: 'status_changed',
          previous_value: oldStage,
          new_value: newStage,
          description: t('pipeline.activityTimeline.stageChange', {
            from: stageLabel(t, oldStage),
            to: stageLabel(t, newStage),
          }),
          performed_by_role: user?.role || 'recruiter',
        }).catch(() => {});

        createStageChangeNotifications({
          application,
          oldStage,
          newStage,
          changedBy: user?.full_name || user?.email || t('pipeline.data.defaultRecruiter'),
          user,
        }).catch(() => {});

        if (onNotificationCreated) onNotificationCreated();
      }
    } catch {
      setApplications(prev =>
        prev.map(a => a.id === appId ? { ...a, status: oldStage || a.status } : a)
      );
    }
  }, [user, onNotificationCreated, t]);

  return {
    stages,
    applications,
    loading,
    isMockData,
    moveApplication,
    refresh: loadData,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// VISIBILITY POLICY — single source of truth for pipeline data access
//
//  admin / recruitment_manager / team_manager → see ALL applications
//  employer   → ONLY applications where employer_id === user.email
//  recruiter  → ONLY applications where assigned_to === user.email
//                  OR recruiter_id === user.email (legacy field)
//              + unassigned (recruiter_id is null/empty) ONLY if
//                  user.can_view_unassigned === true
//              NO fallback-to-all under any circumstance.
//
// To grant a recruiter access to unassigned records:
//   set user.can_view_unassigned = true on the User entity.
// ─────────────────────────────────────────────────────────────────────────────
function canViewUnassigned(user) {
  return (
    user?.can_view_unassigned === true ||
    ['admin', 'recruitment_manager', 'team_manager'].includes(user?.role)
  );
}

function applyFilters(apps, filters, user) {
  let result = [...apps];

  if (user?.role === 'employer') {
    result = result.filter(a => a.employer_id === user.email);

  } else if (user?.role === 'recruiter') {
    const assigned = result.filter(
      a => a.assigned_to === user.email || a.recruiter_id === user.email
    );
    const unassigned = canViewUnassigned(user)
      ? result.filter(a => !a.assigned_to && !a.recruiter_id)
      : [];
    result = [...assigned, ...unassigned];
  }

  if (filters.role) result = result.filter(a => a.job_title?.toLowerCase().includes(filters.role.toLowerCase()));
  if (filters.recruiter) result = result.filter(a => a.recruiter?.includes(filters.recruiter));
  if (filters.source) result = result.filter(a => a.source === filters.source);
  if (filters.aiMin) result = result.filter(a => (a.match_score || 0) >= filters.aiMin);

  if (filters.expMin != null && filters.expMin !== '') {
    result = result.filter(a => (a.experience_years || 0) >= Number(filters.expMin));
  }
  if (filters.expMax != null && filters.expMax !== '') {
    result = result.filter(a => (a.experience_years || 0) <= Number(filters.expMax));
  }

  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom).getTime();
    result = result.filter(a => new Date(a.created_date).getTime() >= from);
  }
  if (filters.dateTo) {
    const to = new Date(filters.dateTo);
    to.setHours(23, 59, 59, 999);
    result = result.filter(a => new Date(a.created_date).getTime() <= to.getTime());
  }

  return result;
}
