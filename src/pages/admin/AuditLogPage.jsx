/**
 * AuditLogPage — View and manage audit log
 * Filters: date, user, action, entity
 * CSV export
 */
import { Fragment, useState } from 'react';
import { auditService } from '@/api/services/auditService';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldCheck, Filter, Download, Eye, FileText,
  Activity, ChevronDown, ChevronUp, XCircle, CheckCircle2, AlertTriangle, Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { he, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { usePermissionMatrix } from '@/hooks/usePermissionMatrix';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  PlatformCard,
  PlatformEmptyState,
  PlatformPageHeader,
  PlatformPageShell,
  PlatformStatCard,
  PlatformWidgetHeader,
  platformFieldClassName,
} from '@/components/platform/PlatformUI';

const getActionConfig = (t) => ({
  view: { label: t('auditLog.actions.view'), icon: Eye, color: '#64748B' },
  create: { label: t('auditLog.actions.create'), icon: CheckCircle2, color: '#10B981' },
  update: { label: t('auditLog.actions.update'), icon: Activity, color: '#3B82F6' },
  delete: { label: t('auditLog.actions.delete'), icon: XCircle, color: '#EF4444' },
  cv_download: { label: t('auditLog.actions.cv_download'), icon: Download, color: '#8B5CF6' },
  cv_view: { label: t('auditLog.actions.cv_view'), icon: Eye, color: '#6366F1' },
  status_change: { label: t('auditLog.actions.status_change'), icon: Activity, color: '#F59E0B' },
  send_to_employer: { label: t('auditLog.actions.send_to_employer'), icon: FileText, color: '#06B6D4' },
  export: { label: t('auditLog.actions.export'), icon: Download, color: '#14B8A6' },
  compensation_change: { label: t('auditLog.actions.compensation_change'), icon: Activity, color: '#EC4899' },
  login: { label: t('auditLog.actions.login'), icon: CheckCircle2, color: '#10B981' },
  impersonate: { label: t('auditLog.actions.impersonate'), icon: AlertTriangle, color: '#F97316' },
  restore: { label: t('auditLog.actions.restore'), icon: CheckCircle2, color: '#10B981' },
  role_display_name_update: { label: 'Role label', icon: Users, color: '#6366F1' },
  permission_update: { label: 'Permissions', icon: ShieldCheck, color: '#7C3AED' },
  deactivate: { label: 'Deactivate', icon: XCircle, color: '#EF4444' },
  resend: { label: 'Resend', icon: Activity, color: '#3B82F6' },
  cancel: { label: 'Cancel', icon: XCircle, color: '#F97316' },
});

const ENTITY_TYPES = [
  'Candidate', 'Application', 'Job', 'Company', 'CandidateDocument',
  'CompensationPlan', 'User', 'Organization', 'Interview', 'CommunicationLog',
  'AgencyTeam', 'AgencyInvitation', 'PermissionMatrix', 'RoleTemplate', 'Billing', 'Integration'
];

const ACTIONS = [
  'view', 'create', 'update', 'delete', 'cv_download', 'cv_view',
  'status_change', 'send_to_employer', 'export', 'compensation_change',
  'login', 'impersonate', 'restore', 'role_display_name_update',
  'permission_update', 'deactivate', 'resend', 'cancel'
];

const PAGE_SIZE = 50;

export default function AuditLogPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'he';
  const dateLocale = i18n.language === 'he' ? he : enUS;
  const ACTION_CONFIG = getActionConfig(t);
  const { can } = usePermissionMatrix();
  const navigate = useNavigate();
  const location = useLocation();

  const [filters, setFilters] = useState({
    entity_type: '',
    action: '',
    actor_email: '',
    date_from: '',
    date_to: '',
  });
  const [expandedLog, setExpandedLog] = useState(null);
  const [page, setPage] = useState(0);

  // Reset to page 0 on filter change
  const updateFilter = (key, value) => {
    setFilters(f => ({ ...f, [key]: value }));
    setPage(0);
  };

  const { data: result, isLoading } = useQuery({
    queryKey: ['audit-logs', filters.entity_type, filters.action, filters.actor_email, filters.date_from, filters.date_to, page],
    queryFn: async () => {
      const serverFilter = {};
      if (filters.entity_type) serverFilter.entity_type = filters.entity_type;
      if (filters.action) serverFilter.action = filters.action;
      if (filters.actor_email) serverFilter.actor_email = filters.actor_email;
      if (filters.date_from) serverFilter.date_from = `${filters.date_from}T00:00:00.000Z`;
      if (filters.date_to) serverFilter.date_to = `${filters.date_to}T23:59:59.999Z`;

      return auditService.listPage({
        ...serverFilter,
        sort: 'created_date',
        order: 'DESC',
        limit: PAGE_SIZE,
        page: page + 1,
      });
    },
    staleTime: 2 * 60 * 1000,
    keepPreviousData: true,
  });
  const logs = result?.data || [];
  const pagination = result?.pagination;

  const exportToCSV = () => {
    const headers = [
      t('auditLog.tableHeaders.date'),
      t('auditLog.tableHeaders.user'),
      t('auditLog.tableHeaders.action'),
      t('auditLog.tableHeaders.entity'),
      t('auditLog.entityId'),
      t('auditLog.tableHeaders.description'),
      'IP'
    ];
    const rows = logs.map(log => [
      log.created_date ? format(new Date(log.created_date), 'dd/MM/yyyy HH:mm', { locale: dateLocale }) : '',
      log.actor_email || '',
      log.action,
      log.entity_type,
      log.entity_id,
      log.entity_label || '',
      log.ip_address || '',
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit_log_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const clearFilters = () => {
    setFilters({ entity_type: '', action: '', actor_email: '', date_from: '', date_to: '' });
    setPage(0);
  };

  const uniqueActors = new Set(logs.map(log => log.actor_email).filter(Boolean)).size;
  const securityEvents = logs.filter(log => ['delete', 'impersonate', 'login'].includes(log.action)).length;
  const relatedPath = log => {
    if (!location.pathname.startsWith('/agency/')) return null;
    const routes = {
      Candidate: `/agency/crm/candidate?id=${log.entity_id}`,
      Application: '/agency/pipeline',
      Job: '/agency/jobs',
      User: '/agency/teams',
      AgencyTeam: '/agency/teams',
      AgencyInvitation: '/agency/teams',
      CompensationPlan: '/agency/compensation',
      Billing: '/agency/settings/billing',
      Integration: '/agency/settings/integrations',
    };
    return routes[log.entity_type] || null;
  };

  return (
    <PlatformPageShell dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="space-y-5">

        {/* Header */}
        <PlatformPageHeader
          title={t('auditLog.title')}
          subtitle={t('auditLog.subtitle')}
          icon={ShieldCheck}
          actions={(
            <Button onClick={exportToCSV} variant="outline" className="gap-1.5 text-sm" disabled={!can('export') || logs.length === 0}>
              <Download className="h-4 w-4" />
              {t('auditLog.exportCSV')}
            </Button>
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <PlatformStatCard icon={Activity} label={t('auditLog.recordsInPage')} value={logs.length} tone="violet" loading={isLoading} meta={`${t('auditLog.tableHeaders.date')} ${page + 1}`} />
          <PlatformStatCard icon={Users} label={t('auditLog.tableHeaders.user')} value={uniqueActors} tone="blue" loading={isLoading} meta={t('auditLog.userEmail')} />
          <PlatformStatCard icon={ShieldCheck} label={t('auditLog.tableHeaders.action')} value={securityEvents} tone="rose" loading={isLoading} meta={t('auditLog.details')} />
        </div>

        {/* Filters */}
        <PlatformCard className="p-5">
          <PlatformWidgetHeader
            title={t('auditLog.filters')}
            subtitle={`${logs.length} ${t('auditLog.recordsInPage')} ${page + 1}`}
            action={<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><Filter className="h-4 w-4" /></div>}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-500">{t('auditLog.entity')}</label>
              <select value={filters.entity_type} onChange={e => updateFilter('entity_type', e.target.value)}
                className={platformFieldClassName}>
                <option value="">{t('auditLog.allEntities')}</option>
                {ENTITY_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-500">{t('auditLog.action')}</label>
              <select value={filters.action} onChange={e => updateFilter('action', e.target.value)}
                className={platformFieldClassName}>
                <option value="">{t('auditLog.allActions')}</option>
                {ACTIONS.map(action => <option key={action} value={action}>{ACTION_CONFIG[action]?.label || action}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-500">{t('auditLog.userEmail')}</label>
              <input type="text" value={filters.actor_email} onChange={e => updateFilter('actor_email', e.target.value)}
                placeholder={t('auditLog.searchPlaceholder')} className={platformFieldClassName} />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-500">{t('auditLog.fromDate')}</label>
              <input type="date" value={filters.date_from} onChange={e => updateFilter('date_from', e.target.value)}
                className={platformFieldClassName} />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-500">{t('auditLog.toDate')}</label>
              <input type="date" value={filters.date_to} onChange={e => updateFilter('date_to', e.target.value)}
                className={platformFieldClassName} />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={clearFilters} variant="outline" className="text-xs gap-1">
                <XCircle className="w-3.5 h-3.5" /> {t('auditLog.clearFilters')}
              </Button>
              <span className="text-xs text-slate-400">{logs.length} {t('auditLog.recordsInPage')} {page + 1}</span>
            </div>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" className="text-xs" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                {isRTL ? '←' : '→'} {t('auditLog.previous')}
              </Button>
              <span className="px-2 text-xs font-bold text-slate-500">{page + 1}</span>
              <Button size="sm" variant="outline" className="text-xs" disabled={!pagination?.hasNextPage} onClick={() => setPage(p => p + 1)}>
                {t('auditLog.next')} {isRTL ? '→' : '←'}
              </Button>
            </div>
          </div>
        </PlatformCard>

        {/* Logs List */}
        <PlatformCard className="overflow-hidden">
          <div className="border-b border-slate-100 p-5">
            <PlatformWidgetHeader title={t('auditLog.title')} subtitle={t('auditLog.subtitle')} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead className="border-b border-slate-100 bg-slate-50/60">
                <tr>
                  {[t('auditLog.tableHeaders.date'), t('auditLog.tableHeaders.user'), t('auditLog.tableHeaders.action'), t('auditLog.tableHeaders.entity'), t('auditLog.tableHeaders.description'), ''].map((label, index) => (
                    <th key={`${label}-${index}`} className="p-3.5 text-start text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10">
                      <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-5">
                      <PlatformEmptyState icon={ShieldCheck}>{t('auditLog.noRecords')}</PlatformEmptyState>
                    </td>
                  </tr>
                ) : (
                  logs.map(log => {
                    const cfg = ACTION_CONFIG[log.action] || ACTION_CONFIG.view;
                    const Icon = cfg.icon;
                    const isExpanded = expandedLog === log.id;

                    return (
                      <Fragment key={log.id}>
                      <tr className="border-b border-slate-100 transition-colors hover:bg-violet-50/35">
                        <td className="p-3.5 text-xs font-medium text-slate-500">
                          {log.created_date ? format(new Date(log.created_date), 'dd/MM/yyyy HH:mm', { locale: dateLocale }) : ''}
                        </td>
                        <td className="p-3.5 text-xs font-semibold text-slate-700">{log.actor_email || '—'}</td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold"
                            style={{ backgroundColor: `${cfg.color}15`, color: cfg.color }}>
                            <Icon className="h-3.5 w-3.5" />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="p-3.5 text-xs font-semibold text-slate-600">{relatedPath(log) ? <button onClick={() => navigate(relatedPath(log))} className="font-bold text-violet-600 hover:underline">{log.entity_type} #{log.entity_id}</button> : log.entity_type}</td>
                        <td className="max-w-xs truncate p-3.5 text-xs text-slate-500">{log.entity_label || '—'}</td>
                        <td className="p-3.5">
                          <button
                            onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-violet-600 transition hover:bg-violet-50"
                          >
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                            {t('auditLog.details')}
                          </button>
                        </td>
                      </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={6} className="border-b border-slate-100 bg-slate-50/70 p-5">
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                  <span className="font-semibold text-slate-500">{t('auditLog.entityId')}:</span>
                                  <span className={`text-slate-700 ${isRTL ? 'mr-2' : 'ml-2'} font-mono`}>{log.entity_id}</span>
                                </div>
                                <div>
                                  <span className="font-semibold text-slate-500">{t('auditLog.actorRole')}:</span>
                                  <span className={`text-slate-700 ${isRTL ? 'mr-2' : 'ml-2'}`}>{log.actor_role || '—'}</span>
                                </div>
                                {log.ip_address && (
                                  <div>
                                    <span className="font-semibold text-slate-500">IP:</span>
                                    <span className={`text-slate-700 ${isRTL ? 'mr-2' : 'ml-2'} font-mono`}>{log.ip_address}</span>
                                  </div>
                                )}
                                {log.user_agent && (
                                  <div className="col-span-2">
                                    <span className="font-semibold text-slate-500">User-Agent:</span>
                                    <span className={`text-slate-700 ${isRTL ? 'mr-2' : 'ml-2'} mt-1 block font-mono text-[10px]`}>{log.user_agent}</span>
                                  </div>
                                )}
                                {log.metadata && (
                                  <div className="col-span-2">
                                    <span className="font-semibold text-slate-500">Metadata:</span>
                                    {('before' in log.metadata || 'after' in log.metadata) ? <div className="mt-2 grid gap-3 md:grid-cols-2"><MetadataBlock title="Before" value={log.metadata.before} /><MetadataBlock title="After" value={log.metadata.after} /></div> : <MetadataBlock value={log.metadata} />}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </PlatformCard>
      </div>
    </PlatformPageShell>
  );
}

function MetadataBlock({ title, value }) {
  return <div>{title && <p className="mb-1 text-[10px] font-black uppercase text-slate-400">{title}</p>}<pre className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-3 text-[10px] text-slate-700">{JSON.stringify(value ?? null, null, 2)}</pre></div>;
}
