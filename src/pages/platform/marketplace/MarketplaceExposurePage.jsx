/**
 * Marketplace Exposure — Super Admin only.
 * Shows which organizations expose their candidate pools to the marketplace,
 * how many candidates they share/sell, and lets admins manage participation.
 *
 * "Exposure" = the org has granted at least one shared/purchased CandidateAccess
 * from their pool to another org.
 */
import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Building2, Share2, CreditCard, Users, TrendingUp,
  Eye, EyeOff, Search, RefreshCw, Info, BarChart2, SlidersHorizontal,
} from 'lucide-react';
import {
  PlatformCard,
  PlatformEmptyState,
  PlatformPageHeader,
  PlatformPageShell,
  PlatformStatCard,
  PlatformWidgetHeader,
} from '@/components/platform/PlatformUI';

function OrgTypeTag({ type }) {
  return type === 'staffing_agency' ? (
    <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-blue-600">Staffing</span>
  ) : (
    <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-amber-600">Internal HR</span>
  );
}

function ExposureLevelBar({ shared, purchased, total }) {
  const maxBar = 100;
  const sharedPct = total ? Math.round((shared / total) * maxBar) : 0;
  const purchasedPct = total ? Math.round((purchased / total) * maxBar) : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="w-16 text-[10px] font-semibold text-slate-400">Shared</span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" style={{ width: `${sharedPct}%` }} />
        </div>
        <span className="w-7 text-right text-[10px] font-extrabold text-slate-700">{shared}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-16 text-[10px] font-semibold text-slate-400">Purchased</span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: `${purchasedPct}%` }} />
        </div>
        <span className="w-7 text-right text-[10px] font-extrabold text-slate-700">{purchased}</span>
      </div>
    </div>
  );
}

export default function MarketplaceExposurePage() {
  const [search, setSearch] = useState('');
  const [view, setView] = useState('exposing'); // 'exposing' | 'all'
  const qc = useQueryClient();

  const { data: accesses = [], isLoading: loadingAccesses } = useQuery({
    queryKey: ['marketplace-accesses'],
    queryFn: () => base44.entities.CandidateAccess.list('-created_date', 2000),
    staleTime: 2 * 60 * 1000,
  });

  const { data: orgs = [], isLoading: loadingOrgs } = useQuery({
    queryKey: ['platform-orgs'],
    queryFn: () => base44.entities.Organization.list('', 500),
    staleTime: 5 * 60 * 1000,
  });

  const loading = loadingAccesses || loadingOrgs;

  // Build per-org exposure stats
  const orgStats = useMemo(() => {
    return orgs.map(org => {
      // How many candidates this org has EXPOSED to others
      const exposed = accesses.filter(a =>
        a.owner_organization_id === org.id && a.access_type !== 'owner'
      );
      const sharedOut = exposed.filter(a => a.access_type === 'shared').length;
      const purchasedOut = exposed.filter(a => a.access_type === 'purchased').length;

      // How many accesses this org RECEIVED from others
      const received = accesses.filter(a =>
        a.accessor_organization_id === org.id && a.access_type !== 'owner'
      );
      const sharedIn = received.filter(a => a.access_type === 'shared').length;
      const purchasedIn = received.filter(a => a.access_type === 'purchased').length;

      // Unique candidates with active access to this pool
      const uniqueBuyers = new Set(
        exposed.filter(a => a.accessor_organization_id).map(a => a.accessor_organization_id)
      ).size;

      return {
        ...org,
        sharedOut,
        purchasedOut,
        totalExposed: exposed.length,
        sharedIn,
        purchasedIn,
        totalReceived: received.length,
        uniqueBuyers,
        isExposing: exposed.length > 0,
      };
    });
  }, [orgs, accesses]);

  const displayed = useMemo(() => {
    let list = view === 'exposing' ? orgStats.filter(o => o.isExposing) : orgStats;
    if (search) {
      list = list.filter(o => o.name?.toLowerCase().includes(search.toLowerCase()));
    }
    return list.sort((a, b) => b.totalExposed - a.totalExposed);
  }, [orgStats, view, search]);

  const platformStats = useMemo(() => {
    const exposingOrgs = orgStats.filter(o => o.isExposing);
    const receivingOrgs = orgStats.filter(o => o.totalReceived > 0);
    const totalShared = accesses.filter(a => a.access_type === 'shared').length;
    const totalPurchased = accesses.filter(a => a.access_type === 'purchased').length;
    return { exposingOrgs: exposingOrgs.length, receivingOrgs: receivingOrgs.length, totalShared, totalPurchased };
  }, [orgStats, accesses]);

  return (
    <PlatformPageShell dir="ltr">
      <div className="space-y-5">
        <PlatformPageHeader
          title="Pool Exposure Settings"
          subtitle="Monitor which organizations expose their candidate pools and how they are accessed"
          icon={Eye}
          actions={(
            <div className="flex items-center gap-3 rounded-2xl border border-white bg-white/85 px-4 py-3 shadow-[0_8px_25px_rgba(66,81,130,0.07)]">
              <TrendingUp className="h-5 w-5 text-violet-500" />
              <div>
                <p className="text-xs font-bold text-slate-700">Marketplace visibility</p>
                <p className="mt-0.5 text-[10px] font-medium text-slate-400">Live cross-organization activity</p>
              </div>
            </div>
          )}
        />

      {/* Info Banner */}
        <PlatformCard className="border-blue-100/80 bg-gradient-to-r from-blue-50/90 to-violet-50/70 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-500 shadow-sm">
              <Info className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-blue-900">How Marketplace Exposure Works</p>
              <p className="mt-1 text-sm leading-6 text-blue-700">
                An organization is <strong>"exposing"</strong> when it has granted <strong>shared</strong> or <strong>purchased</strong> access to
                candidates in its pool to at least one other organization. This enables cross-org talent sharing and
                commercial marketplace transactions via <code className="rounded bg-blue-100 px-1 text-xs">CandidateAccess</code> records.
              </p>
            </div>
          </div>
        </PlatformCard>

        {/* Platform KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <PlatformStatCard
            icon={Eye}
            label="Exposing organizations"
            value={platformStats.exposingOrgs}
            tone="violet"
            loading={loading}
            meta="Sharing candidate pools"
          />
          <PlatformStatCard
            icon={Users}
            label="Receiving organizations"
            value={platformStats.receivingOrgs}
            tone="blue"
            loading={loading}
            meta="With external access"
          />
          <PlatformStatCard
            icon={Share2}
            label="Shared grants"
            value={platformStats.totalShared}
            tone="cyan"
            loading={loading}
            meta="Cross-org sharing"
          />
          <PlatformStatCard
            icon={CreditCard}
            label="Purchased grants"
            value={platformStats.totalPurchased}
            tone="emerald"
            loading={loading}
            meta="Marketplace transactions"
          />
        </div>

      {/* Filters + View Toggle */}
        <PlatformCard className="p-5">
          <PlatformWidgetHeader
            title="Exposure filters"
            subtitle={`${displayed.length} organizations`}
            action={(
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <SlidersHorizontal className="h-4 w-4" />
              </div>
            )}
          />
          <div className="mt-4 flex flex-col gap-3 lg:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search organization…"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-50"
              />
            </div>
            <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-slate-50/70 p-1">
              <button
                type="button"
                onClick={() => setView('exposing')}
                className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                  view === 'exposing'
                    ? 'bg-white text-violet-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Exposing Only
              </button>
              <button
                type="button"
                onClick={() => setView('all')}
                className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                  view === 'all'
                    ? 'bg-white text-violet-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                All Orgs
              </button>
            </div>
            <button
              type="button"
              onClick={() => { qc.invalidateQueries(['marketplace-accesses']); qc.invalidateQueries(['platform-orgs']); }}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-600"
              aria-label="Refresh exposure data"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </PlatformCard>

      {/* Organization Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array(6).fill(0).map((_, i) => (
            <PlatformCard key={i} className="h-56 animate-pulse bg-white/70" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <PlatformCard className="p-5">
          <PlatformEmptyState icon={EyeOff} className="min-h-64">
            <p className="text-base font-bold text-slate-500">No organizations exposing pools yet</p>
            <p className="mt-2 max-w-xl text-sm font-medium text-slate-300">
            {view === 'exposing'
              ? 'Grant cross-org access from the Candidate Pool page to start seeing exposure data.'
              : 'No organizations match your search.'}
            </p>
          </PlatformEmptyState>
        </PlatformCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {displayed.map((org, index) => (
            <PlatformCard
              key={org.id}
              className={`group relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(77,70,170,0.13)] ${
                org.isExposing ? '' : 'opacity-70'
              }`}>
              <div className={`absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-25 blur-2xl ${
                org.isExposing ? 'bg-violet-200' : 'bg-slate-200'
              }`} />
              {/* Org Header */}
              <div className="relative mb-5 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${
                    org.isExposing
                      ? index % 2 === 0
                        ? 'from-violet-100 to-fuchsia-50 text-violet-600'
                        : 'from-blue-100 to-cyan-50 text-blue-600'
                      : 'from-slate-100 to-gray-50 text-slate-400'
                  }`}>
                    <Building2 className="h-5 w-5" strokeWidth={1.8} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black leading-tight text-slate-900 transition group-hover:text-violet-700">{org.name}</p>
                    <div className="mt-1">
                    <OrgTypeTag type={org.org_type} />
                    </div>
                  </div>
                </div>
                <div className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                  org.isExposing
                    ? 'bg-violet-50 text-violet-700'
                    : 'bg-slate-50 text-slate-400'
                }`}>
                  {org.isExposing ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  {org.isExposing ? 'Exposing' : 'Private'}
                </div>
              </div>

              {/* Stats */}
              <div className="relative mb-5 grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-slate-50/80 p-2.5 text-center">
                  <p className="text-xl font-black text-slate-800">{org.totalExposed}</p>
                  <p className="text-[10px] font-semibold text-slate-400">Exposed</p>
                </div>
                <div className="rounded-xl bg-blue-50 p-2.5 text-center">
                  <p className="text-xl font-black text-blue-800">{org.sharedOut}</p>
                  <p className="text-[10px] font-semibold text-blue-400">Shared</p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-2.5 text-center">
                  <p className="text-xl font-black text-emerald-800">{org.purchasedOut}</p>
                  <p className="text-[10px] font-semibold text-emerald-400">Sold</p>
                </div>
              </div>

              {/* Exposure bars */}
              {org.isExposing && (
                <div className="relative mb-5">
                  <ExposureLevelBar
                    shared={org.sharedOut}
                    purchased={org.purchasedOut}
                    total={Math.max(org.totalExposed, 1)}
                  />
                </div>
              )}

              {/* Buyer count + received */}
              <div className="relative flex items-center justify-between border-t border-slate-100 pt-3 text-[10px] font-medium text-slate-400">
                <div className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  <span>
                    <strong className="text-slate-600">{org.uniqueBuyers}</strong> unique buyer{org.uniqueBuyers !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>
                    <strong className="text-slate-600">{org.totalReceived}</strong> received
                  </span>
                </div>
              </div>
            </PlatformCard>
          ))}
        </div>
      )}

      {/* Platform-wide Chart Summary */}
        <PlatformCard className="p-5 sm:p-6">
          <PlatformWidgetHeader
            title="Platform Exposure Summary"
            subtitle="Marketplace participation and access distribution"
            action={(
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <BarChart2 className="h-4 w-4" />
              </div>
            )}
          />
          <div className="mt-6 space-y-5">
          {[
            {
              label: 'Organizations actively exposing pool',
              value: platformStats.exposingOrgs,
              total: orgs.length,
              color: 'bg-purple-500',
            },
            {
              label: 'Organizations receiving external access',
              value: platformStats.receivingOrgs,
              total: orgs.length,
              color: 'bg-blue-500',
            },
            {
              label: 'Shared access vs purchased',
              value: platformStats.totalShared,
              total: Math.max(platformStats.totalShared + platformStats.totalPurchased, 1),
              color: 'bg-blue-400',
              sublabel: `${platformStats.totalShared} shared / ${platformStats.totalPurchased} purchased`,
            },
          ].map(item => {
            const pct = item.total ? Math.round((item.value / item.total) * 100) : 0;
            return (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <span className="text-xs font-semibold text-slate-600">{item.label}</span>
                  <span className="text-xs font-black text-slate-900">
                    {item.sublabel || `${item.value} / ${item.total}`}
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${item.color} transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-1 text-[10px] font-semibold text-slate-400">{pct}%</p>
              </div>
            );
          })}
          </div>
        </PlatformCard>
      </div>
    </PlatformPageShell>
  );
}
