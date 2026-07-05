import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { httpClient } from '@/api/client/httpClient';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/Button';
import {
  Calendar, RefreshCw, Clock, Video, Phone, MapPin,
  X, Briefcase, User, CheckCircle2, XCircle, AlertCircle,
  RotateCcw, UserX, Plus, Edit, FileText, ThumbsUp, ThumbsDown,
  Mail, Star, Filter
} from 'lucide-react';

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_STYLE = {
  scheduled:   { color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  confirmed:   { color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
  completed:   { color: '#65A30D', bg: '#F7FEE7', border: '#D9F99D' },
  cancelled:   { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  no_show:     { color: '#EA580C', bg: '#FFF7ED', border: '#FDBA74' },
  rescheduled: { color: '#CA8A04', bg: '#FEFCE8', border: '#FDE047' },
};

const STATUS_ICON = {
  scheduled:   Calendar,
  confirmed:   CheckCircle2,
  completed:   CheckCircle2,
  cancelled:   XCircle,
  no_show:     UserX,
  rescheduled: RotateCcw,
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function TypeIcon({ type, className = 'w-5 h-5' }) {
  if (type === 'video')     return <Video className={className} />;
  if (type === 'phone')     return <Phone className={className} />;
  if (type === 'in_person') return <MapPin className={className} />;
  if (type === 'technical') return <Briefcase className={className} />;
  if (type === 'hr')        return <User className={className} />;
  if (type === 'final')     return <Star className={className} />;
  return <Calendar className={className} />;
}

function StatusBadge({ status }) {
  const { t } = useTranslation();
  const style = STATUS_STYLE[status] || { color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' };
  const label = t(`company.interviews.status.${status}`, { defaultValue: status });
  const Icon = STATUS_ICON[status] || Calendar;

  return (
    <span
      className="text-xs px-2.5 py-1 rounded-lg font-bold whitespace-nowrap flex items-center gap-1"
      style={{ color: style.color, backgroundColor: style.bg, border: `1px solid ${style.border}` }}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, color = '#7C3AED', loading }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + '18' }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <div className="text-2xl font-black text-gray-900">
          {loading ? <span className="inline-block w-10 h-5 bg-gray-100 rounded animate-pulse" /> : value}
        </div>
        <div className="text-xs font-semibold text-gray-500">{label}</div>
      </div>
    </div>
  );
}

// ─── Interview Card ────────────────────────────────────────────────────────────

function InterviewCard({ interview, isSelected, onSelect }) {
  const { t } = useTranslation();
  const isUpcoming = interview.date >= new Date().toISOString().split('T')[0]
    && interview.status !== 'cancelled'
    && interview.status !== 'completed';

  return (
    <button
      type="button"
      onClick={() => onSelect(isSelected ? null : interview)}
      className={`w-full text-right p-5 rounded-2xl border transition-all text-start ${
        isSelected
          ? 'border-purple-500 bg-purple-50 shadow-md shadow-purple-500/10'
          : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        {/* Type icon */}
        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0 mt-0.5">
          <TypeIcon type={interview.type} className="w-5 h-5 text-purple-600" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-black text-gray-900 text-sm leading-tight truncate">
            {interview.candidate_name || t('company.interviews.noCandidate')}
          </h3>
          <p className="text-xs font-semibold text-purple-600 mt-0.5 truncate">
            {interview.job_title || t('company.interviews.noJobTitle')}
          </p>
        </div>

        <StatusBadge status={interview.status || 'scheduled'} />
      </div>

      {/* Date / time row */}
      <div className="flex items-center gap-3 text-xs text-gray-500 mt-2 flex-wrap">
        <span className="flex items-center gap-1 font-semibold">
          <Calendar className="w-3 h-3" />
          {new Date(interview.date).toLocaleDateString()}
        </span>
        {interview.time && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {interview.time}
          </span>
        )}
        {interview.stage && (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-md">
            {t(`company.interviews.stages.${interview.stage}`, { defaultValue: interview.stage })}
          </span>
        )}
      </div>

      {/* Interviewer info */}
      {interview.interviewer_name && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-600">
          <User className="w-3 h-3" />
          <span className="font-medium">{interview.interviewer_name}</span>
        </div>
      )}

      {/* Upcoming highlight */}
      {isUpcoming && (
        <div className="mt-3 flex items-center gap-2 text-xs font-bold text-purple-600 bg-purple-50 border border-purple-200 rounded-lg px-3 py-1.5">
          <AlertCircle className="w-3.5 h-3.5" />
          {t('company.interviews.upcomingBanner')}
        </div>
      )}

      {/* Feedback indicator */}
      {interview.status === 'completed' && interview.feedback && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md w-fit">
          <FileText className="w-3 h-3" />
          {t('company.interviews.hasFeedback')}
        </div>
      )}
    </button>
  );
}

// ─── Detail Panel ──────────────────────────────────────────────────────────────

function DetailPanel({ interview, onClose, onUpdate }) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [feedback, setFeedback] = useState(interview.feedback || '');
  const [rating, setRating] = useState(interview.rating || 0);

  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (updates) => httpClient.patch(`/interviews/${interview.id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-interviews'] });
      setIsEditing(false);
      if (onUpdate) onUpdate();
    },
  });

  const handleStatusChange = (newStatus) => {
    if (window.confirm(t('company.interviews.confirmStatusChange'))) {
      updateMutation.mutate({ status: newStatus });
    }
  };

  const handleSaveFeedback = () => {
    updateMutation.mutate({ feedback, rating });
  };

  const canEdit = interview.status !== 'cancelled' && interview.status !== 'completed';

  return (
    <div className="bg-white rounded-2xl border border-gray-200 h-full flex flex-col overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-100">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
            <TypeIcon type={interview.type} className="w-5 h-5 text-purple-600" />
          </div>
          <div className="min-w-0">
            <h2 className="font-black text-gray-900 text-base leading-tight truncate">
              {interview.candidate_name || t('company.interviews.noCandidate')}
            </h2>
            <p className="text-sm font-semibold text-purple-600 mt-0.5">
              {interview.job_title || t('company.interviews.noJobTitle')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={interview.status || 'scheduled'} />
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:border-purple-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Quick Actions */}
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            {interview.status === 'scheduled' && (
              <button
                onClick={() => handleStatusChange('confirmed')}
                className="text-xs font-bold px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-1"
              >
                <CheckCircle2 className="w-3 h-3" />
                {t('company.interviews.actions.confirm')}
              </button>
            )}
            {(interview.status === 'scheduled' || interview.status === 'confirmed') && (
              <>
                <button
                  onClick={() => handleStatusChange('completed')}
                  className="text-xs font-bold px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  {t('company.interviews.actions.complete')}
                </button>
                <button
                  onClick={() => handleStatusChange('cancelled')}
                  className="text-xs font-bold px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1"
                >
                  <XCircle className="w-3 h-3" />
                  {t('company.interviews.actions.cancel')}
                </button>
              </>
            )}
          </div>
        )}

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs font-medium text-gray-400 mb-0.5">{t('company.interviews.detail.date')}</div>
            <div className="font-semibold text-gray-900">{new Date(interview.date).toLocaleDateString()}</div>
          </div>
          {interview.time && (
            <div>
              <div className="text-xs font-medium text-gray-400 mb-0.5">{t('company.interviews.detail.time')}</div>
              <div className="font-semibold text-gray-900">{interview.time}</div>
            </div>
          )}
          <div>
            <div className="text-xs font-medium text-gray-400 mb-0.5">{t('company.interviews.detail.type')}</div>
            <div className="font-semibold text-gray-900">
              {t(`company.interviews.types.${interview.type}`, { defaultValue: interview.type || '—' })}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-400 mb-0.5">{t('company.interviews.detail.stage')}</div>
            <div className="font-semibold text-gray-900">
              {t(`company.interviews.stages.${interview.stage}`, { defaultValue: interview.stage || '—' })}
            </div>
          </div>
          {interview.duration_minutes && (
            <div>
              <div className="text-xs font-medium text-gray-400 mb-0.5">{t('company.interviews.detail.duration')}</div>
              <div className="font-semibold text-gray-900">{interview.duration_minutes} {t('company.interviews.minutes')}</div>
            </div>
          )}
          {interview.interviewer_name && (
            <div>
              <div className="text-xs font-medium text-gray-400 mb-0.5">{t('company.interviews.detail.interviewer')}</div>
              <div className="font-semibold text-gray-900">{interview.interviewer_name}</div>
            </div>
          )}
        </div>

        {/* Contact info */}
        {interview.candidate_email && (
          <div className="bg-gray-50 rounded-xl p-3 space-y-2">
            <div className="text-xs font-medium text-gray-500 mb-1">{t('company.interviews.detail.contact')}</div>
            <a
              href={`mailto:${interview.candidate_email}`}
              className="flex items-center gap-2 text-sm font-semibold text-purple-600 hover:underline"
            >
              <Mail className="w-4 h-4" />
              {interview.candidate_email}
            </a>
          </div>
        )}

        {/* Location / link */}
        {interview.location_or_link && (
          <div>
            <div className="text-xs font-medium text-gray-400 mb-1.5">
              {interview.type === 'in_person'
                ? t('company.interviews.detail.location')
                : t('company.interviews.detail.joinLink')}
            </div>
            {interview.type === 'in_person' ? (
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 bg-gray-50 rounded-lg p-3">
                <MapPin className="w-4 h-4 text-purple-600 flex-shrink-0" />
                {interview.location_or_link}
              </div>
            ) : (
              <a
                href={interview.location_or_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-semibold text-purple-600 hover:underline break-all bg-purple-50 rounded-lg p-3"
              >
                <Video className="w-4 h-4 flex-shrink-0" />
                {interview.location_or_link}
              </a>
            )}
          </div>
        )}

        {/* Notes */}
        {interview.notes && (
          <div>
            <div className="text-xs font-medium text-gray-400 mb-1.5">{t('company.interviews.detail.notes')}</div>
            <div className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 leading-relaxed">
              {interview.notes}
            </div>
          </div>
        )}

        {/* Feedback section */}
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {t('company.interviews.detail.feedback')}
            </h3>
            {interview.status === 'completed' && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs font-bold text-purple-600 hover:underline flex items-center gap-1"
              >
                <Edit className="w-3 h-3" />
                {t('common.edit')}
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-3">
              {/* Rating */}
              <div>
                <div className="text-xs font-medium text-gray-400 mb-1.5">{t('company.interviews.detail.rating')}</div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(r => (
                    <button
                      key={r}
                      onClick={() => setRating(r)}
                      className={`w-8 h-8 rounded-lg border ${
                        r <= rating
                          ? 'bg-yellow-50 border-yellow-400 text-yellow-600'
                          : 'border-gray-200 text-gray-300 hover:border-yellow-200'
                      } flex items-center justify-center transition-colors`}
                    >
                      <Star className={`w-4 h-4 ${r <= rating ? 'fill-yellow-400' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback textarea */}
              <div>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder={t('company.interviews.detail.feedbackPlaceholder')}
                  className="w-full min-h-[120px] p-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  dir="rtl"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1"
                  onClick={handleSaveFeedback}
                  disabled={updateMutation.isPending}
                >
                  {t('common.save')}
                </Button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFeedback(interview.feedback || '');
                    setRating(interview.rating || 0);
                  }}
                  className="px-4 h-9 border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:border-gray-300 transition-colors"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          ) : (
            <>
              {interview.rating && (
                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map(r => (
                    <Star
                      key={r}
                      className={`w-4 h-4 ${
                        r <= interview.rating ? 'text-yellow-500 fill-yellow-400' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              )}
              {interview.feedback ? (
                <div className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 leading-relaxed">
                  {interview.feedback}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">{t('company.interviews.detail.noFeedback')}</p>
              )}
            </>
          )}
        </div>

        {/* Recommendation */}
        {interview.recommendation && (
          <div className="border-t border-gray-100 pt-4">
            <div className="text-xs font-medium text-gray-400 mb-1.5">{t('company.interviews.detail.recommendation')}</div>
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-sm ${
              interview.recommendation.includes('yes') 
                ? 'bg-green-50 text-green-700 border border-green-200'
                : interview.recommendation.includes('no')
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {interview.recommendation.includes('yes') ? <ThumbsUp className="w-4 h-4" /> : <ThumbsDown className="w-4 h-4" />}
              {t(`company.interviews.recommendations.${interview.recommendation}`, { defaultValue: interview.recommendation })}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 flex gap-2">
        {interview.candidate_id && (
          <Link
            to={`/company/candidates/${interview.candidate_id}`}
            className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:border-purple-300 hover:text-purple-600 transition-colors"
          >
            <User className="w-4 h-4" />
            {t('company.interviews.viewCandidate')}
          </Link>
        )}
        {interview.job_id && (
          <Link
            to={`/company/jobs/${interview.job_id}`}
            className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:border-purple-300 hover:text-purple-600 transition-colors"
          >
            <Briefcase className="w-4 h-4" />
            {t('company.interviews.viewJob')}
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function CompanyInterviews() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [filterTab, setFilterTab] = useState('upcoming');
  const [selected, setSelected] = useState(null);

  const orgId = user?.organization_id;

  const { data: interviews = [], isLoading, refetch } = useQuery({
    queryKey: ['company-interviews', orgId],
    queryFn: () => base44.entities.Interview.filter({ organization_id: orgId }, '-date', 500),
    enabled: !!orgId,
    staleTime: 2 * 60 * 1000,
  });

  const today = new Date().toISOString().split('T')[0];

  const stats = useMemo(() => ({
    total: interviews.length,
    upcoming: interviews.filter(i => i.date >= today && i.status !== 'cancelled' && i.status !== 'completed').length,
    completed: interviews.filter(i => i.status === 'completed').length,
    cancelled: interviews.filter(i => i.status === 'cancelled').length,
    noShow: interviews.filter(i => i.status === 'no_show').length,
  }), [interviews, today]);

  const FILTER_TABS = [
    { key: 'upcoming', label: t('company.interviews.filters.upcoming') },
    { key: 'today', label: t('company.interviews.filters.today') },
    { key: 'completed', label: t('company.interviews.filters.completed') },
    { key: 'cancelled', label: t('company.interviews.filters.cancelled') },
    { key: 'all', label: t('company.interviews.filters.all') },
  ];

  const filtered = useMemo(() => {
    const todayDate = new Date().toISOString().split('T')[0];

    return interviews.filter(i => {
      if (filterTab === 'upcoming') {
        return i.date >= todayDate && i.status !== 'cancelled' && i.status !== 'completed';
      }
      if (filterTab === 'today') {
        return i.date === todayDate && i.status !== 'cancelled' && i.status !== 'completed';
      }
      if (filterTab === 'completed') {
        return i.status === 'completed';
      }
      if (filterTab === 'cancelled') {
        return i.status === 'cancelled';
      }
      return true;
    });
  }, [interviews, filterTab]);

  return (
    <div dir="rtl" className="space-y-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">{t('company.interviews.title')}</h1>
          <p className="text-gray-500 font-semibold mt-1">{t('company.interviews.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="h-9 w-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:border-purple-300 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/company/candidates"
            className="flex items-center gap-2 h-9 px-4 text-white rounded-xl text-sm font-bold transition-all hover:opacity-90 hover:-translate-y-px"
            style={{ background: 'linear-gradient(90deg, #9136f0 0%, #575de8 50%, #5a8eee 100%)' }}
          >
            <Plus className="w-4 h-4" />
            {t('company.interviews.scheduleNew')}
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard icon={Calendar}      label={t('company.interviews.stats.total')}     value={stats.total}     color="#2563EB" loading={isLoading} />
        <StatCard icon={AlertCircle}   label={t('company.interviews.stats.upcoming')}  value={stats.upcoming}  color="#7C3AED" loading={isLoading} />
        <StatCard icon={CheckCircle2}  label={t('company.interviews.stats.completed')} value={stats.completed} color="#059669" loading={isLoading} />
        <StatCard icon={XCircle}       label={t('company.interviews.stats.cancelled')} value={stats.cancelled} color="#DC2626" loading={isLoading} />
        <StatCard icon={UserX}         label={t('company.interviews.stats.noShow')}    value={stats.noShow}    color="#EA580C" loading={isLoading} />
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-gray-400" />
        <div className="flex gap-1 bg-gray-50 border border-gray-200 rounded-xl p-1 flex-wrap">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setFilterTab(tab.key); setSelected(null); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                filterTab === tab.key
                  ? 'bg-white text-purple-600 shadow-sm border border-gray-200'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main layout: cards + detail */}
      <div className={`grid gap-6 ${selected ? 'grid-cols-1 lg:grid-cols-[1fr_400px]' : 'grid-cols-1'}`}>
        {/* Interview cards */}
        <div>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-32 bg-white rounded-2xl border border-gray-200 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mb-4">
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>
              {interviews.length === 0 ? (
                <>
                  <p className="text-gray-900 font-black text-lg">{t('company.interviews.noInterviews')}</p>
                  <p className="text-gray-500 font-semibold text-sm mt-1 mb-4">{t('company.interviews.noInterviewsHint')}</p>
                  <Link
                    to="/company/candidates"
                    className="flex items-center gap-2 px-4 py-2 text-white rounded-xl text-sm font-bold transition-all hover:opacity-90 hover:-translate-y-px"
                    style={{ background: 'linear-gradient(90deg, #9136f0 0%, #575de8 50%, #5a8eee 100%)' }}
                  >
                    <Plus className="w-4 h-4" />
                    {t('company.interviews.scheduleFirst')}
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-gray-900 font-black text-lg">{t('company.interviews.noResults')}</p>
                  <p className="text-gray-500 font-semibold text-sm mt-1">{t('company.interviews.noResultsHint')}</p>
                  <button
                    onClick={() => setFilterTab('all')}
                    className="mt-4 text-sm font-bold text-purple-600 hover:underline"
                  >
                    {t('company.interviews.clearFilter')}
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className={`grid gap-4 ${selected ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'}`}>
              {filtered.map(iv => (
                <InterviewCard
                  key={iv.id}
                  interview={iv}
                  isSelected={selected?.id === iv.id}
                  onSelect={setSelected}
                />
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-7rem)]">
            <DetailPanel
              interview={selected}
              onClose={() => setSelected(null)}
              onUpdate={() => {
                // Update the selected interview with fresh data
                const updated = interviews.find(i => i.id === selected.id);
                if (updated) setSelected(updated);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
