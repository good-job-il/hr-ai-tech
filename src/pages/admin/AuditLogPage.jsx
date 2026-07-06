/**
 * AuditLogPage — View and manage audit log
 * Filters: date, user, action, entity
 * CSV export
 */
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldCheck, Filter, Download, Eye, FileText,
  Activity, ChevronDown, ChevronUp, XCircle, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { he, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

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
});

const ENTITY_TYPES = [
  'Candidate', 'Application', 'Job', 'Company', 'CandidateDocument',
  'CompensationPlan', 'User', 'Organization', 'Interview', 'CommunicationLog'
];

const ACTIONS = [
  'view', 'create', 'update', 'delete', 'cv_download', 'cv_view',
  'status_change', 'send_to_employer', 'export', 'compensation_change',
  'login', 'impersonate', 'restore'
];

const PAGE_SIZE = 50;

export default function AuditLogPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'he';
  const dateLocale = i18n.language === 'he' ? he : enUS;
  const ACTION_CONFIG = getActionConfig(t);

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

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs', filters.entity_type, filters.action, filters.actor_email, filters.date_from, filters.date_to, page],
    queryFn: async () => {
      const serverFilter = {};
      if (filters.entity_type) serverFilter.entity_type = filters.entity_type;
      if (filters.action) serverFilter.action = filters.action;

      const fetched = Object.keys(serverFilter).length > 0
        ? await base44.entities.AuditLog.filter(serverFilter, '-created_date', PAGE_SIZE, page * PAGE_SIZE)
        : await base44.entities.AuditLog.list('-created_date', PAGE_SIZE, page * PAGE_SIZE);

      // Client-side filter only for non-indexed fields
      return fetched.filter(log => {
        if (filters.actor_email && !log.actor_email?.toLowerCase().includes(filters.actor_email.toLowerCase())) return false;
        if (filters.date_from && new Date(log.created_date) < new Date(filters.date_from)) return false;
        if (filters.date_to) {
          const toDate = new Date(filters.date_to);
          toDate.setHours(23, 59, 59);
          if (new Date(log.created_date) > toDate) return false;
        }
        return true;
      });
    },
    staleTime: 2 * 60 * 1000,
    keepPreviousData: true,
  });

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

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black text-[#0F172A] flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-[#7C3AED]" />
              {t('auditLog.title')}
            </h1>
            <p className="text-sm text-[#64748B] mt-0.5">{t('auditLog.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={exportToCSV} variant="outline" className="gap-1.5 text-sm">
              <Download className="w-4 h-4" /> {t('auditLog.exportCSV')}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-[#E4ECFF] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-[#7C3AED]" />
            <span className="text-sm font-bold text-[#0F172A]">{t('auditLog.filters')}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#64748B] mb-1 block">{t('auditLog.entity')}</label>
              <select value={filters.entity_type} onChange={e => updateFilter('entity_type', e.target.value)}
                className="w-full h-9 px-3 bg-[#F7FBFF] border border-[#E4ECFF] rounded-xl text-sm focus:outline-none focus:border-[#7C3AED]">
                <option value="">{t('auditLog.allEntities')}</option>
                {ENTITY_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#64748B] mb-1 block">{t('auditLog.action')}</label>
              <select value={filters.action} onChange={e => updateFilter('action', e.target.value)}
                className="w-full h-9 px-3 bg-[#F7FBFF] border border-[#E4ECFF] rounded-xl text-sm focus:outline-none focus:border-[#7C3AED]">
                <option value="">{t('auditLog.allActions')}</option>
                {ACTIONS.map(action => <option key={action} value={action}>{ACTION_CONFIG[action]?.label || action}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#64748B] mb-1 block">{t('auditLog.userEmail')}</label>
              <input type="text" value={filters.actor_email} onChange={e => updateFilter('actor_email', e.target.value)}
                placeholder={t('auditLog.searchPlaceholder')} className="w-full h-9 px-3 bg-[#F7FBFF] border border-[#E4ECFF] rounded-xl text-sm focus:outline-none focus:border-[#7C3AED]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#64748B] mb-1 block">{t('auditLog.fromDate')}</label>
              <input type="date" value={filters.date_from} onChange={e => updateFilter('date_from', e.target.value)}
                className="w-full h-9 px-3 bg-[#F7FBFF] border border-[#E4ECFF] rounded-xl text-sm focus:outline-none focus:border-[#7C3AED]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#64748B] mb-1 block">{t('auditLog.toDate')}</label>
              <input type="date" value={filters.date_to} onChange={e => updateFilter('date_to', e.target.value)}
                className="w-full h-9 px-3 bg-[#F7FBFF] border border-[#E4ECFF] rounded-xl text-sm focus:outline-none focus:border-[#7C3AED]" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={clearFilters} variant="outline" className="text-xs gap-1">
                <XCircle className="w-3.5 h-3.5" /> {t('auditLog.clearFilters')}
              </Button>
              <span className="text-xs text-[#94A3B8]">{logs.length} {t('auditLog.recordsInPage')} {page + 1}</span>
            </div>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" className="text-xs" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                {isRTL ? '←' : '→'} {t('auditLog.previous')}
              </Button>
              <span className="text-xs px-2 text-[#64748B] font-bold">{page + 1}</span>
              <Button size="sm" variant="outline" className="text-xs" disabled={logs.length < PAGE_SIZE} onClick={() => setPage(p => p + 1)}>
                {t('auditLog.next')} {isRTL ? '→' : '←'}
              </Button>
            </div>
          </div>
        </div>

        {/* Logs List */}
        <div className="bg-white rounded-2xl border border-[#E4ECFF] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F7FBFF] border-b border-[#E4ECFF]">
                <tr>
                  <th className={`${isRTL ? 'text-right' : 'text-left'} text-xs font-bold text-[#64748B] p-3`}>{t('auditLog.tableHeaders.date')}</th>
                  <th className={`${isRTL ? 'text-right' : 'text-left'} text-xs font-bold text-[#64748B] p-3`}>{t('auditLog.tableHeaders.user')}</th>
                  <th className={`${isRTL ? 'text-right' : 'text-left'} text-xs font-bold text-[#64748B] p-3`}>{t('auditLog.tableHeaders.action')}</th>
                  <th className={`${isRTL ? 'text-right' : 'text-left'} text-xs font-bold text-[#64748B] p-3`}>{t('auditLog.tableHeaders.entity')}</th>
                  <th className={`${isRTL ? 'text-right' : 'text-left'} text-xs font-bold text-[#64748B] p-3`}>{t('auditLog.tableHeaders.description')}</th>
                  <th className={`${isRTL ? 'text-left' : 'text-right'} text-xs font-bold text-[#64748B] p-3`}></th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10">
                      <div className="w-6 h-6 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-[#94A3B8] text-sm font-semibold">
                      {t('auditLog.noRecords')}
                    </td>
                  </tr>
                ) : (
                  logs.map(log => {
                    const cfg = ACTION_CONFIG[log.action] || ACTION_CONFIG.view;
                    const Icon = cfg.icon;
                    const isExpanded = expandedLog === log.id;

                    return (
                      <tr key={log.id} className="border-b border-[#F0F1F5] last:border-0 hover:bg-[#F7FBFF]">
                        <td className="p-3 text-sm text-[#374151]">
                          {log.created_date ? format(new Date(log.created_date), 'dd/MM/yyyy HH:mm', { locale: dateLocale }) : ''}
                        </td>
                        <td className="p-3 text-sm text-[#374151]">{log.actor_email || '—'}</td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold"
                            style={{ backgroundColor: `${cfg.color}15`, color: cfg.color }}>
                            <Icon className="w-3.5 h-3.5" />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-[#374151]">{log.entity_type}</td>
                        <td className="p-3 text-sm text-[#374151] truncate max-w-xs">{log.entity_label || '—'}</td>
                        <td className={`p-3 ${isRTL ? 'text-left' : 'text-right'}`}>
                          <button
                            onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                            className="text-[#7C3AED] hover:underline text-xs font-bold flex items-center gap-1"
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            {t('auditLog.details')}
                          </button>
                        </td>
                        {isExpanded && (
                          <tr>
                            <td colSpan={6} className="bg-[#F7FBFF] p-4 border-t border-[#E4ECFF]">
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                  <span className="font-semibold text-[#64748B]">{t('auditLog.entityId')}:</span>
                                  <span className={`text-[#374151] ${isRTL ? 'mr-2' : 'ml-2'} font-mono`}>{log.entity_id}</span>
                                </div>
                                <div>
                                  <span className="font-semibold text-[#64748B]">{t('auditLog.actorRole')}:</span>
                                  <span className={`text-[#374151] ${isRTL ? 'mr-2' : 'ml-2'}`}>{log.actor_role || '—'}</span>
                                </div>
                                {log.ip_address && (
                                  <div>
                                    <span className="font-semibold text-[#64748B]">IP:</span>
                                    <span className={`text-[#374151] ${isRTL ? 'mr-2' : 'ml-2'} font-mono`}>{log.ip_address}</span>
                                  </div>
                                )}
                                {log.user_agent && (
                                  <div className="col-span-2">
                                    <span className="font-semibold text-[#64748B]">User-Agent:</span>
                                    <span className={`text-[#374151] ${isRTL ? 'mr-2' : 'ml-2'} block mt-1 font-mono text-[10px]`}>{log.user_agent}</span>
                                  </div>
                                )}
                                {log.metadata && (
                                  <div className="col-span-2">
                                    <span className="font-semibold text-[#64748B]">Metadata:</span>
                                    <pre className="bg-white rounded-lg p-2 mt-1 text-[10px] text-[#374151] overflow-x-auto border border-[#E4ECFF]">
                                      {JSON.stringify(log.metadata, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
