import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { base44 } from '@/api/base44Client';
import { Receipt, Download, Search, CheckCircle, Clock, XCircle, TrendingUp, DollarSign } from 'lucide-react';

const PLAN_PRICES = { trial: 0, starter: 499, pro: 1499, enterprise: 2999 };

// Generate mock invoices from real orgs
function generateInvoices(orgs, locale = 'he-IL') {
  const result = [];
  let num = 1;
  const now = new Date();
  orgs.filter(o => o.status === 'active' && (o.plan || 'trial') !== 'trial').forEach(org => {
    for (let i = 0; i < 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const isPast = i > 0;
      result.push({
        id: `INV-${String(num++).padStart(4, '0')}`,
        org_name: org.name,
        org_id: org.id,
        plan: org.plan,
        amount: PLAN_PRICES[org.plan] || 0,
        date: d.toLocaleDateString(locale, { month: 'long', year: 'numeric' }),
        date_raw: d,
        status: isPast ? 'paid' : (i === 0 ? 'pending' : 'paid'),
      });
    }
  });
  return result.sort((a, b) => b.date_raw - a.date_raw);
}

const STATUS = {
  paid:    { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle },
  pending: { bg: 'bg-amber-50',   text: 'text-amber-700',   icon: Clock },
  overdue: { bg: 'bg-red-50',     text: 'text-red-700',     icon: XCircle },
};

export default function InvoicesPage() {
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'he';
  const dir = currentLang === 'he' ? 'rtl' : 'ltr';

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ['platform-orgs'],
    queryFn: () => base44.entities.Organization.list('-created_date', 500),
    staleTime: 2 * 60 * 1000,
  });

  const locale = currentLang === 'he' ? 'he-IL' : 'en-US';
  const invoices = useMemo(() => generateInvoices(orgs, locale), [orgs, locale]);

  const filtered = invoices.filter(inv => {
    const matchSearch = !search || inv.org_name?.toLowerCase().includes(search.toLowerCase()) || inv.id.includes(search);
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: invoices.length,
    paid: invoices.filter(i => i.status === 'paid').length,
    pending: invoices.filter(i => i.status === 'pending').length,
    revenue: invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0),
  };

  return (
    <div dir={dir} className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900">{t('platform.invoices.title')}</h1>
        <p className="text-slate-500 mt-1 font-semibold">{t('platform.invoices.subtitle')}</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('platform.invoices.stats.totalInvoices'), value: stats.total, color: 'bg-purple-50 text-purple-700', icon: Receipt },
          { label: t('platform.invoices.stats.paid'), value: stats.paid, color: 'bg-emerald-50 text-emerald-700', icon: CheckCircle },
          { label: t('platform.invoices.stats.pending'), value: stats.pending, color: 'bg-amber-50 text-amber-700', icon: Clock },
          { label: t('platform.invoices.stats.revenue'), value: `₪${stats.revenue.toLocaleString()}`, color: 'bg-blue-50 text-blue-700', icon: DollarSign },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`rounded-2xl p-5 flex items-center gap-4 ${s.color}`}>
              <Icon className="w-6 h-6 opacity-60" />
              <div>
                <p className="text-2xl font-black">{isLoading ? '...' : s.value}</p>
                <p className="text-sm font-semibold mt-0.5 opacity-80">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 flex-1 min-w-48 border border-gray-200 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('platform.invoices.filters.searchPlaceholder')}
            className="outline-none text-sm w-full bg-transparent" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none">
          <option value="all">{t('platform.invoices.filters.allStatuses')}</option>
          <option value="paid">{t('platform.invoices.status.paid')}</option>
          <option value="pending">{t('platform.invoices.status.pending')}</option>
          <option value="overdue">{t('platform.invoices.status.overdue')}</option>
        </select>
        <span className="text-sm text-gray-400 font-semibold">{filtered.length} {t('platform.invoices.filters.invoicesCount')}</span>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className={`${dir === 'rtl' ? 'text-right' : 'text-left'} font-black text-gray-600 px-5 py-3`}>{t('platform.invoices.table.invoiceNumber')}</th>
              <th className={`${dir === 'rtl' ? 'text-right' : 'text-left'} font-black text-gray-600 px-5 py-3`}>{t('platform.invoices.table.organization')}</th>
              <th className={`${dir === 'rtl' ? 'text-right' : 'text-left'} font-black text-gray-600 px-5 py-3`}>{t('platform.invoices.table.plan')}</th>
              <th className={`${dir === 'rtl' ? 'text-right' : 'text-left'} font-black text-gray-600 px-5 py-3`}>{t('platform.invoices.table.period')}</th>
              <th className={`${dir === 'rtl' ? 'text-right' : 'text-left'} font-black text-gray-600 px-5 py-3`}>{t('platform.invoices.table.amount')}</th>
              <th className={`${dir === 'rtl' ? 'text-right' : 'text-left'} font-black text-gray-600 px-5 py-3`}>{t('platform.invoices.table.status')}</th>
              <th className={`${dir === 'rtl' ? 'text-right' : 'text-left'} font-black text-gray-600 px-5 py-3`}>{t('platform.invoices.table.download')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array(6).fill(0).map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {Array(7).fill(0).map((_, j) => (
                    <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-400">{t('platform.invoices.noInvoices')}</td></tr>
            ) : filtered.map(inv => {
              const st = STATUS[inv.status] || STATUS.pending;
              const StIcon = st.icon;
              const statusLabel = t(`platform.invoices.status.${inv.status}`);
              return (
                <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 font-mono font-bold text-gray-700">{inv.id}</td>
                  <td className="px-5 py-4 font-bold text-gray-900">{inv.org_name}</td>
                  <td className="px-5 py-4">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700">
                      {inv.plan}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{inv.date}</td>
                  <td className="px-5 py-4 font-black text-gray-900">₪{inv.amount.toLocaleString()}</td>
                  <td className="px-5 py-4">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${st.bg} ${st.text}`}>
                      <StIcon className="w-3 h-3" />
                      {statusLabel}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}