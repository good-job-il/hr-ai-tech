import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { savedJobService } from '@/api/services/savedJobService';
import { useAuth } from '@/lib/AuthContext';
import {
  Bookmark, Search, X, Briefcase, Building2,
  RefreshCw, Trash2, ExternalLink, BookmarkX,
} from 'lucide-react';

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color = '#7C3AED', loading }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E4ECFF] p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + '18' }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <div className="text-2xl font-black text-[#0F172A]">
          {loading ? <span className="inline-block w-10 h-5 bg-gray-100 rounded animate-pulse" /> : value}
        </div>
        <div className="text-xs font-semibold text-[#64748B]">{label}</div>
      </div>
    </div>
  );
}

// ─── Job Card ─────────────────────────────────────────────────────────────────

function SavedJobCard({ item, onRemove, isRemoving }) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-2xl border border-[#E4ECFF] p-5 flex flex-col gap-4 hover:border-[#C4B5FD] hover:shadow-sm transition-all">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-[#0F172A] text-sm leading-tight line-clamp-2">
            {item.job_title || t('candidate.savedJobs.unknownTitle')}
          </h3>
          <div className="flex items-center gap-1.5 mt-1">
            <Building2 className="w-3.5 h-3.5 text-[#7C3AED] flex-shrink-0" />
            <p className="text-xs font-semibold text-[#7C3AED] truncate">
              {item.company || t('candidate.savedJobs.unknownCompany')}
            </p>
          </div>
        </div>
        <button
          onClick={() => onRemove(item.id)}
          disabled={isRemoving}
          title={t('candidate.savedJobs.remove')}
          className="w-8 h-8 rounded-lg border border-[#E4ECFF] flex items-center justify-center text-[#94A3B8] hover:text-red-500 hover:border-red-200 disabled:opacity-40 transition-colors flex-shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Date */}
      {item.created_date && (
        <p className="text-xs text-[#94A3B8] font-medium">
          {t('candidate.savedJobs.savedOn')} {new Date(item.created_date).toLocaleDateString()}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-auto pt-2 border-t border-[#F0F1F5]">
        {item.job_id && (
          <Link
            to={`/jobs/${item.job_id}`}
            className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-[#7C3AED] text-white text-xs font-bold hover:bg-[#6D28D9] transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {t('candidate.savedJobs.apply')}
          </Link>
        )}
        {item.job_id && (
          <Link
            to={`/jobs/${item.job_id}`}
            className="h-9 px-3 rounded-xl border border-[#E4ECFF] flex items-center justify-center text-xs font-bold text-[#374151] hover:border-[#C4B5FD] hover:text-[#7C3AED] transition-colors"
          >
            <Briefcase className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function CandidateSavedJobs() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: saved = [], isLoading, refetch } = useQuery({
    queryKey: ['saved-jobs', user?.email],
    queryFn: () => savedJobService.list(),
    enabled: !!user?.email,
  });

  const { mutate: removeJob, variables: removingId } = useMutation({
    mutationFn: (id) => savedJobService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-jobs', user?.email] });
    },
  });

  const filtered = saved.filter(item =>
    !search ||
    item.job_title?.toLowerCase().includes(search.toLowerCase()) ||
    item.company?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div dir="rtl" className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#0F172A]">{t('candidate.savedJobs.title')}</h1>
          <p className="text-[#64748B] font-semibold mt-1">{t('candidate.savedJobs.subtitle')}</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="h-9 w-9 rounded-xl border border-[#E4ECFF] flex items-center justify-center text-[#64748B] hover:border-[#C4B5FD] disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          icon={Bookmark}
          label={t('candidate.savedJobs.stats.total')}
          value={saved.length}
          color="#7C3AED"
          loading={isLoading}
        />
        <StatCard
          icon={Building2}
          label={t('candidate.savedJobs.stats.companies')}
          value={new Set(saved.map(s => s.company).filter(Boolean)).size}
          color="#2563EB"
          loading={isLoading}
        />
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
        <input
          type="text"
          placeholder={t('candidate.savedJobs.search')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full h-10 pr-9 pl-3 rounded-xl border border-[#E4ECFF] text-sm font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10 transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#374151]"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-40 bg-white rounded-2xl border border-[#E4ECFF] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#F3EFFF] flex items-center justify-center mb-4">
            {saved.length === 0
              ? <Bookmark className="w-8 h-8 text-[#7C3AED]" />
              : <BookmarkX className="w-8 h-8 text-[#7C3AED]" />
            }
          </div>
          {saved.length === 0 ? (
            <>
              <p className="text-[#0F172A] font-black text-lg">{t('candidate.savedJobs.noSaved')}</p>
              <p className="text-[#64748B] font-semibold text-sm mt-1">{t('candidate.savedJobs.noSavedHint')}</p>
              <Link
                to="/candidate/jobs/all"
                className="mt-4 px-5 py-2 rounded-xl bg-[#7C3AED] text-white text-sm font-bold hover:bg-[#6D28D9] transition-colors"
              >
                {t('candidate.savedJobs.browseJobs')}
              </Link>
            </>
          ) : (
            <>
              <p className="text-[#0F172A] font-black text-lg">{t('candidate.savedJobs.noResults')}</p>
              <p className="text-[#64748B] font-semibold text-sm mt-1">{t('candidate.savedJobs.noResultsHint')}</p>
              <button
                onClick={() => setSearch('')}
                className="mt-4 text-sm font-bold text-[#7C3AED] hover:underline"
              >
                {t('candidate.savedJobs.clearFilter')}
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => (
            <SavedJobCard
              key={item.id}
              item={item}
              onRemove={removeJob}
              isRemoving={removingId === item.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
