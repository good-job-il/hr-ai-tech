import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { httpClient } from '@/api/client/httpClient';
import { createStageChangeNotifications } from '@/lib/pipelineNotifications';
import { APPLICATION_PIPELINE_STAGES } from '@/domain/agency/contracts';
import {
  filterAgencyRecordsByScope,
  getAgencyScopeFilter,
  isAgencyUser,
} from '@/domain/agency/access';

function getDefaultStages(t) {
  return APPLICATION_PIPELINE_STAGES.map(stage => ({
    ...stage,
    label: t(`pipeline.stages.${stage.id}`),
  }));
}

function stageLabel(t, id) {
  return t(`pipeline.stages.${id}`, { defaultValue: id });
}

export function usePipelineData(user, filters = {}, onNotificationCreated) {
  const { t, i18n } = useTranslation();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMockData, setIsMockData] = useState(false);
  const appsSnapshot = useRef([]);

  const stages = useMemo(() => getDefaultStages(t), [t, i18n.language]);
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({ sort: 'created_date', order: 'DESC', limit: '500' });
      const scopeFilter = getAgencyScopeFilter(user);
      Object.entries(scopeFilter || {}).forEach(([key, value]) => query.set(key, value));
      const raw = await httpClient.get(`/applications?${query.toString()}`, { cache: false });
      const apps = Array.isArray(raw) ? raw : (raw?.data || []);
      setIsMockData(false);
      const filtered = applyFilters(apps, filters, user);
      setApplications(filtered);
      appsSnapshot.current = filtered;
    } catch (requestError) {
      setIsMockData(false);
      setApplications([]);
      appsSnapshot.current = [];
      setError({
        status: requestError?.status || requestError?.response?.status || null,
        message: requestError?.message || 'Unable to load pipeline',
      });
    } finally {
      setLoading(false);
    }
  }, [filters, user]);

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

    if (String(appId).startsWith('demo-')) return;

    try {
      await httpClient.patch(`/applications/${appId}`, {
        status: newStage,
        stage_entered_at: new Date().toISOString(),
      });

      if (application && oldStage && oldStage !== newStage) {
        httpClient.post('/functions/createApplicationTimeline', {
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
    } catch (requestError) {
      setApplications(prev =>
        prev.map(a => a.id === appId ? { ...a, status: oldStage || a.status } : a)
      );
      setError({
        status: requestError?.status || requestError?.response?.status || null,
        message: requestError?.message || 'Unable to update application',
      });
    }
  }, [user, onNotificationCreated, t]);

  return {
    stages,
    applications,
    loading,
    error,
    isMockData,
    moveApplication,
    refresh: loadData,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// VISIBILITY POLICY — single source of truth for pipeline data access
//
//  org_admin / recruitment_manager → organization scope
//  team_manager → records with team_manager_id === user.id
//  employer   → ONLY applications where employer_id === user.email
//  recruiter  → assigned_to/recruiter_id === user.id
// ─────────────────────────────────────────────────────────────────────────────
function applyFilters(apps, filters, user) {
  let result = [...apps];

  if (isAgencyUser(user)) {
    result = filterAgencyRecordsByScope(user, result);
  } else if (user?.role === 'employer') {
    result = result.filter(a => a.employer_id === user.email);
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
