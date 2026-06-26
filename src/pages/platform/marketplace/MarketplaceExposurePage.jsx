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
  Eye, EyeOff, Search, RefreshCw, Info, BarChart2,
} from 'lucide-react';

function OrgTypeTag({ type }) {
  return type === 'staffing_agency' ? (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">Staffing</span>
  ) : (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">Internal HR</span>
  );
}

function ExposureLevelBar({ shared, purchased, total }) {
  const maxBar = 100;
  const sharedPct = total ? Math.round((shared / total) * maxBar) : 0;
  const purchasedPct = total ? Math.round((purchased / total) * maxBar) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 w-16">Shared</span>
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-400 rounded-full" style={{ width: `${sharedPct}%` }} />
        </div>
        <span className="text-xs font-bold text-gray-700 w-6 text-right">{shared}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 w-16">Purchased</span>
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${purchasedPct}%` }} />
        </div>
        <span className="text-xs font-bold text-gray-700 w-6 text-right">{purchased}</span>
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
    <div dir="ltr" className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">Pool Exposure Settings</h1>
        <p className="text-slate-500 mt-1 font-semibold">
          Monitor which organizations expose their candidate pools and how they are accessed
        </p>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-blue-800">How Marketplace Exposure Works</p>
          <p className="text-sm text-blue-600 mt-0.5">
            An organization is <strong>"exposing"</strong> when it has granted <strong>shared</strong> or <strong>purchased</strong> access to
            candidates in its pool to at least one other organization. This enables cross-org talent sharing and
            commercial marketplace transactions via <code className="bg-blue-100 px-1 rounded text-xs">CandidateAccess</code> records.
          </p>
        </div>
      </div>

      {/* Platform KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Exposing Orgs',  value: platformStats.exposingOrgs,  color: 'bg-purple-50 text-purple-700', icon: Eye },
          { label: 'Receiving Orgs', value: platformStats.receivingOrgs,  color: 'bg-blue-50 text-blue-700',    icon: Users },
          { label: 'Shared Grants',  value: platformStats.totalShared,    color: 'bg-blue-50 text-blue-700',    icon: Share2 },
          { label: 'Purchased Grants', value: platformStats.totalPurchased, color: 'bg-emerald-50 text-emerald-700', icon: CreditCard },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`rounded-2xl p-5 ${s.color}`}>
              <div className="flex items-center justify-between mb-2">
                <Icon className="w-5 h-5 opacity-60" />
              </div>
              <p className="text-3xl font-black">{loading ? '...' : s.value}</p>
              <p className="text-sm font-semibold mt-1 opacity-80">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Filters + View Toggle */}
      <div className="flex flex-wrap gap-3 items-center bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 flex-1 min-w-48 border border-gray-200 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search organization…"
            className="outline-none text-sm w-full bg-transparent"
          />
        </div>
        <div className="flex rounded-xl overflow-hidden border border-gray-200">
          <button
            onClick={() => setView('exposing')}
            className={`px-4 py-2 text-sm font-bold transition-colors ${view === 'exposing' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
            Exposing Only
          </button>
          <button
            onClick={() => setView('all')}
            className={`px-4 py-2 text-sm font-bold transition-colors ${view === 'all' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
            All Orgs
          </button>
        </div>
        <button onClick={() => { qc.invalidateQueries(['marketplace-accesses']); qc.invalidateQueries(['platform-orgs']); }}
          className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
        <span className="text-sm text-gray-400 font-semibold">{displayed.length} organizations</span>
      </div>

      {/* Organization Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-16 flex flex-col items-center text-center shadow-sm">
          <EyeOff className="w-12 h-12 text-gray-200 mb-4" />
          <p className="text-gray-500 font-bold text-lg">No organizations exposing pools yet</p>
          <p className="text-gray-300 text-sm mt-2">
            {view === 'exposing'
              ? 'Grant cross-org access from the Candidate Pool page to start seeing exposure data.'
              : 'No organizations match your search.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayed.map(org => (
            <div key={org.id}
              className={`bg-white border rounded-2xl p-5 shadow-sm transition-all ${
                org.isExposing ? 'border-purple-100 hover:border-purple-200' : 'border-gray-100 hover:border-gray-200 opacity-70'
              }`}>
              {/* Org Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    org.isExposing ? 'bg-purple-100' : 'bg-gray-100'
                  }`}>
                    <Building2 className={`w-5 h-5 ${org.isExposing ? 'text-purple-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <p className="font-black text-gray-900 text-sm leading-tight">{org.name}</p>
                    <OrgTypeTag type={org.org_type} />
                  </div>
                </div>
                <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                  org.isExposing
                    ? 'bg-purple-50 text-purple-700'
                    : 'bg-gray-50 text-gray-400'
                }`}>
                  {org.isExposing ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  {org.isExposing ? 'Exposing' : 'Private'}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-2 bg-gray-50 rounded-xl">
                  <p className="text-xl font-black text-gray-800">{org.totalExposed}</p>
                  <p className="text-xs text-gray-400 font-semibold">Exposed</p>
                </div>
                <div className="text-center p-2 bg-blue-50 rounded-xl">
                  <p className="text-xl font-black text-blue-800">{org.sharedOut}</p>
                  <p className="text-xs text-blue-400 font-semibold">Shared</p>
                </div>
                <div className="text-center p-2 bg-emerald-50 rounded-xl">
                  <p className="text-xl font-black text-emerald-800">{org.purchasedOut}</p>
                  <p className="text-xs text-emerald-400 font-semibold">Sold</p>
                </div>
              </div>

              {/* Exposure bars */}
              {org.isExposing && (
                <div className="mb-4">
                  <ExposureLevelBar
                    shared={org.sharedOut}
                    purchased={org.purchasedOut}
                    total={Math.max(org.totalExposed, 1)}
                  />
                </div>
              )}

              {/* Buyer count + received */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-50 text-xs text-gray-400">
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>
                    <strong className="text-gray-600">{org.uniqueBuyers}</strong> unique buyer{org.uniqueBuyers !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>
                    <strong className="text-gray-600">{org.totalReceived}</strong> received
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Platform-wide Chart Summary */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <BarChart2 className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-black text-gray-900">Platform Exposure Summary</h2>
        </div>
        <div className="space-y-4">
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
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-600">{item.label}</span>
                  <span className="text-sm font-black text-gray-900">
                    {item.sublabel || `${item.value} / ${item.total}`}
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{pct}%</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
