import { useState, useEffect } from 'react';
import { interviewService } from '@/api/services/interviewService';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';
import { Calendar, RefreshCw, Clock, Video, Phone, MapPin } from 'lucide-react';

const STATUS_COLORS = {
  scheduled: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-700',
  no_show: 'bg-orange-100 text-orange-700',
  rescheduled: 'bg-yellow-100 text-yellow-700',
};
const STATUS_LABELS = {
  scheduled: 'מתוזמן', confirmed: 'אושר', completed: 'הושלם',
  cancelled: 'בוטל', no_show: 'לא הגיע', rescheduled: 'נדחה',
};
const TYPE_ICONS = { phone: Phone, video: Video, in_person: MapPin };

export default function RecruiterInterviewsPage() {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');
  const [error, setError] = useState('');

  const load = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const data = await interviewService.list({ organization_id: user.organization_id, recruiter_id: user.id, sort: 'date', order: 'DESC', limit: 100 });
      setInterviews(data);
    } catch (requestError) { setInterviews([]); setError(requestError?.message || 'Unable to load interviews'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user?.id]);

  const today = new Date().toISOString().split('T')[0];
  const filtered = interviews.filter(i => {
    if (filter === 'upcoming') return i.date >= today && i.status !== 'cancelled';
    if (filter === 'past') return i.date < today || i.status === 'completed';
    if (filter === 'cancelled') return i.status === 'cancelled';
    return true;
  });

  return (
    <div dir="rtl" className="space-y-5">
      <button onClick={() => window.history.back()} className="flex items-center gap-1.5 text-sm font-bold text-[#7C3AED] hover:underline">
        <span>←</span> חזרה לדשבורד
      </button>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#0F172A]">ראיונות</h1>
          <p className="text-[#64748B] font-semibold mt-1">{filtered.length} ראיונות</p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-2 text-sm font-bold text-[#7C3AED] hover:underline disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> רענן
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[['upcoming','קרובים'], ['past','שעברו'], ['all','הכל']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filter === val ? 'bg-[#7C3AED] text-white' : 'bg-white border border-[#E4ECFF] text-[#64748B] hover:border-[#7C3AED]'}`}>
            {label}
          </button>
        ))}
      </div>
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}

      {loading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-20 bg-white rounded-2xl border border-[#E4ECFF] animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#E4ECFF]">
          <Calendar className="w-12 h-12 text-[#CBD5E1] mx-auto mb-3" />
          <p className="font-bold text-[#94A3B8]">אין ראיונות להצגה</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(interview => {
            const TypeIcon = TYPE_ICONS[interview.type] || Clock;
            return (
              <div key={interview.id} className="bg-white rounded-2xl border border-[#E4ECFF] p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#F3EFFF] flex items-center justify-center flex-shrink-0">
                  <TypeIcon className="w-5 h-5 text-[#7C3AED]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-black text-[#0F172A]">{interview.candidate_name}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[interview.status] || 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABELS[interview.status] || interview.status}
                    </span>
                  </div>
                  <div className="text-xs text-[#64748B]">{interview.job_title}</div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-[#94A3B8]">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{interview.date} {interview.time}</span>
                    {interview.location_or_link && <span className="truncate max-w-xs">{interview.location_or_link}</span>}
                  </div>
                </div>
                {interview.candidate_id && (
                  <Link to={`/recruiter/crm/candidate?id=${interview.candidate_id}`}
                    className="text-xs font-bold text-[#7C3AED] hover:underline whitespace-nowrap">
                    פרופיל מועמד
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
