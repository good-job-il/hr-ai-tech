import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Search, RefreshCw, User, ChevronLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const STATUS_COLORS = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  interview: 'bg-purple-100 text-purple-700',
  offer: 'bg-orange-100 text-orange-700',
  hired: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  inactive: 'bg-gray-100 text-gray-500',
};

const PAGE_SIZE = 50; // Performance: Load only 50 candidates at a time

export default function CandidateListCRMPage({ candidateRoute = '/crm/candidate' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [hasMore, setHasMore] = useState(false);
  const [lastCandidateId, setLastCandidateId] = useState(null);
  const [appendLoading, setAppendLoading] = useState(false);
  
  const isRTL = i18n.language === 'he';

  const loadCandidates = async (append = false) => {
    if (!user) return;
    
    if (append) {
      setAppendLoading(true);
    } else {
      setLoading(true);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // VISIBILITY POLICY — CandidateListCRMPage
    // PERFORMANCE: Paginated loading with 50 records per page
    // ─────────────────────────────────────────────────────────────────────────
    const filter = {};
    if (statusFilter !== 'all') filter.status = statusFilter;

    if (user?.role === 'employer') {
      filter.employer_id = user.email;
    } else if (user?.role === 'recruiter') {
      filter.recruiter_id = user.email;
    }

    // Performance: Only fetch PAGE_SIZE records
    const data = await base44.entities.Candidate.filter(filter, '-created_date', PAGE_SIZE);
    
    // Check if there are more records
    setHasMore(data.length === PAGE_SIZE);
    if (data.length > 0) {
      setLastCandidateId(data[data.length - 1].id);
    }

    let result = data;

    // Recruiter with can_view_unassigned: merge in unassigned candidates (limited)
    if (user?.role === 'recruiter' && user?.can_view_unassigned === true) {
      const unassigned = await base44.entities.Candidate.filter(
        { ...(statusFilter !== 'all' ? { status: statusFilter } : {}), recruiter_id: null },
        '-created_date', 20
      ).catch(() => []);
      const ids = new Set(result.map(c => c.id));
      result = [...result, ...unassigned.filter(c => !ids.has(c.id))];
    }

    setCandidates(append ? [...candidates, ...result] : result);
    setLoading(false);
    setAppendLoading(false);
  };

  // Performance: Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (user) loadCandidates();
    }, 300);
    return () => clearTimeout(timer);
  }, [statusFilter, user?.email, location.key]);

  // Performance: Memoized filtering
  const filtered = React.useMemo(() => {
    if (!search) return candidates;
    const searchLower = search.toLowerCase();
    return candidates.filter(c =>
      c.full_name?.toLowerCase().includes(searchLower) ||
      c.email?.toLowerCase().includes(searchLower) ||
      c.role_name?.toLowerCase().includes(searchLower) ||
      c.domain_name?.toLowerCase().includes(searchLower)
    );
  }, [candidates, search]);

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-[#0F172A]">{t('crm.candidatesCrm')}</h1>
            <p className="text-sm text-[#64748B] mt-1">{t('crm.candidatesCount', { count: filtered.length })}</p>
          </div>
          <Button size="sm" variant="outline" onClick={loadCandidates} className="gap-1.5 text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> {t('crm.refresh')}
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-[#E4ECFF] p-4 mb-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]`} />
            <Input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t('crm.searchPlaceholder')} className={`${isRTL ? 'pr-9' : 'pl-9'} text-sm`} />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {['all', 'new', 'contacted', 'interview', 'offer', 'hired', 'rejected'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${statusFilter === s ? (s === 'all' ? 'bg-[#7C3AED] text-white' : `${STATUS_COLORS[s]} border border-current`) : 'bg-[#F0F1F5] text-[#64748B] hover:bg-[#E4ECFF]'}`}>
                {s === 'all' ? t('crm.filterAll') : t(`crm.status${s.charAt(0).toUpperCase() + s.slice(1)}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-[#E4ECFF] overflow-hidden">
          {loading && !appendLoading ? (
            <div className="space-y-0">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-16 border-b border-[#F0F1F5] animate-pulse bg-gray-50/50" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-[#94A3B8]">
              <User className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-bold">{t('crm.noCandidates')}</p>
            </div>
          ) : (
            <div>
              {/* Header Row */}
              <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-[#F7F8FC] border-b border-[#E4ECFF] text-xs font-black text-[#94A3B8] uppercase tracking-wide">
                <div className="col-span-4">{t('crm.columnCandidate')}</div>
                <div className="col-span-2">{t('crm.columnRole')}</div>
                <div className="col-span-2">{t('crm.columnDomain')}</div>
                <div className="col-span-1 text-center">{t('crm.columnExperience')}</div>
                <div className="col-span-1 text-center">{t('crm.columnScore')}</div>
                <div className="col-span-2 text-center">{t('crm.columnStatus')}</div>
              </div>
              {filtered.map(candidate => (
                <CandidateRowMemo
                  key={candidate.id}
                  candidate={candidate}
                  onClick={() => navigate(`${candidateRoute}?id=${candidate.id}`)}
                  t={t}
                  isRTL={isRTL}
                />
              ))}
              {/* Infinite Scroll Loading */}
              {hasMore && (
                <div className="p-4 text-center text-gray-400 text-sm">
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      {t('crm.loadingMore')}
                    </div>
                  ) : (
                    <button onClick={() => loadCandidates(true)} className="text-purple-600 font-bold hover:underline">
                      {t('crm.loadMore')}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const CandidateRowMemo = React.memo(function CandidateRow({ candidate, onClick, t, isRTL }) {
  const initials = candidate.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';
  const score = candidate.data_quality_score || candidate.parsing_confidence || 0;

  return (
    <div onClick={onClick}
      className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-[#F0F1F5] hover:bg-[#F7F8FC] cursor-pointer transition-colors group items-center">
      {/* Name */}
      <div className="col-span-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#2563EB] flex items-center justify-center text-white text-xs font-black flex-shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-[#0F172A] truncate">{candidate.full_name}</div>
          <div className="text-xs text-[#94A3B8] truncate">{candidate.email}</div>
        </div>
      </div>
      {/* Role */}
      <div className="col-span-2 text-sm text-[#64748B] truncate">{candidate.role_name || '—'}</div>
      {/* Domain */}
      <div className="col-span-2 text-sm text-[#64748B] truncate">{candidate.domain_name || '—'}</div>
      {/* Experience */}
      <div className="col-span-1 text-center">
        <span className="text-sm font-bold text-[#0F172A]">{candidate.experience_years ?? '—'}</span>
        {candidate.experience_years && <span className="text-xs text-[#94A3B8]">{t('crm.experienceYears')}</span>}
      </div>
      {/* Score */}
      <div className="col-span-1 text-center">
        <span className={`text-sm font-black ${score >= 70 ? 'text-green-600' : score >= 40 ? 'text-yellow-600' : 'text-[#CBD5E1]'}`}>
          {score ? `${score}%` : '—'}
        </span>
      </div>
      {/* Status */}
      <div className="col-span-2 flex items-center justify-center gap-2">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[candidate.status] || 'bg-gray-100 text-gray-600'}`}>
          {t(`crm.status${candidate.status?.charAt(0).toUpperCase() + candidate.status?.slice(1)}`) || candidate.status}
        </span>
        {isRTL ? (
          <ChevronLeft className="w-4 h-4 text-[#CBD5E1] group-hover:text-[#7C3AED] transition-colors" />
        ) : (
          <svg className="w-4 h-4 text-[#CBD5E1] group-hover:text-[#7C3AED] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </div>
    </div>
  );
});
