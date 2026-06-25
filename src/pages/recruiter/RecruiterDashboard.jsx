import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Users, Briefcase, Calendar, MessageSquare, TrendingUp, RefreshCw, ChevronLeft, Clock, DollarSign } from 'lucide-react';

function StatCard({ icon: Icon, label, value, color, href, loading }) {
  const content = (
    <div className="bg-white rounded-2xl border border-[#E4ECFF] p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + '18' }}>
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-2xl font-black text-[#0F172A]">
          {loading ? <span className="inline-block w-10 h-6 bg-gray-100 rounded animate-pulse" /> : value}
        </div>
        <div className="text-sm font-semibold text-[#64748B]">{label}</div>
      </div>
      {href && <ChevronLeft className="w-4 h-4 text-[#CBD5E1]" />}
    </div>
  );
  return href ? <Link to={href}>{content}</Link> : content;
}

export default function RecruiterDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentCandidates, setRecentCandidates] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);
  const [compensation, setCompensation] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);

    // ─────────────────────────────────────────────────────────────────────────
    // VISIBILITY POLICY — RecruiterDashboard
    //
    //  Recruiter sees ONLY records explicitly assigned to them.
    //  No fallback-to-all. Empty result → empty state in the UI.
    //  To grant access to unassigned records: set user.can_view_unassigned = true.
    // ─────────────────────────────────────────────────────────────────────────
    const [candidates, applications, interviews, plans] = await Promise.all([
      base44.entities.Candidate.filter({ recruiter_id: user.email }, '-created_date', 100).catch(() => []),
      base44.entities.Application.filter({ assigned_to: user.email }, '-created_date', 100).catch(() => []),
      base44.entities.Interview.filter({ recruiter_id: user.email, status: 'scheduled' }, '-date', 50).catch(() => []),
      base44.entities.CompensationPlan.list('-created_date', 100).catch(() => []),
    ]);

    // Calculate total compensation for this recruiter
    const totalComp = plans.reduce((sum, plan) => {
      if (plan.recruiter_compensation) {
        return sum + (plan.recruiter_compensation_type === 'percent' 
          ? (plan.total_fee || 0) * plan.recruiter_compensation / 100 
          : plan.recruiter_compensation);
      }
      return sum;
    }, 0);

    setStats({
      candidates: candidates.length,
      applications: applications.length,
      interviews: interviews.length,
      newApplications: applications.filter(a => a.status === 'new').length,
    });
    setCompensation({ total: totalComp, plans: plans.filter(p => p.recruiter_compensation) });
    setRecentCandidates(candidates.slice(0, 5));
    setRecentApplications(applications.slice(0, 5));
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.email]);

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#0F172A]">שלום, {user?.full_name?.split(' ')[0]} 👋</h1>
          <p className="text-[#64748B] font-semibold mt-1">דשבורד מגייס — נתונים עדכניים</p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-2 text-sm font-bold text-[#7C3AED] hover:underline disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> רענן
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="המועמדים שלי" value={stats?.candidates ?? '—'} color="#7C3AED" href="/recruiter/candidates" loading={loading} />
        <StatCard icon={Briefcase} label="הגשות פתוחות" value={stats?.applications ?? '—'} color="#2563EB" href="/recruiter/pipeline" loading={loading} />
        <StatCard icon={Calendar} label="ראיונות קרובים" value={stats?.interviews ?? '—'} color="#059669" href="/recruiter/interviews" loading={loading} />
        <StatCard icon={DollarSign} label="התגמול שלי" value={compensation ? `${compensation.total.toLocaleString()} ₪` : '—'} color="#059669" href="/recruitment/compensation" loading={loading} />
      </div>

      {/* Compensation Summary */}
      {compensation && compensation.plans.length > 0 && (
        <div className="bg-gradient-to-l from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-black text-green-800">התגמולים שלי</h3>
          </div>
          <div className="space-y-3">
            {compensation.plans.slice(0, 5).map(plan => (
              <div key={plan.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-green-200">
                <div>
                  <div className="text-sm font-bold text-green-900">{plan.client_name}</div>
                  {plan.job_id && <div className="text-xs text-green-600">משרה ספציפית</div>}
                </div>
                <div className="text-left">
                  <div className="text-sm font-black text-green-700">
                    {plan.recruiter_compensation.toLocaleString()} {plan.recruiter_compensation_type === 'percent' ? '%' : '₪'}
                  </div>
                  {plan.recruiter_compensation_type === 'percent' && plan.total_fee && (
                    <div className="text-xs text-green-600 font-bold">
                      {((plan.total_fee * plan.recruiter_compensation) / 100).toLocaleString()} ₪
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Candidates */}
        <div className="bg-white rounded-2xl border border-[#E4ECFF] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-[#0F172A]">מועמדים אחרונים שלי</h3>
            <Link to="/recruiter/candidates" className="text-sm font-bold text-[#7C3AED] hover:underline">הכל</Link>
          </div>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />)}</div>
          ) : recentCandidates.length === 0 ? (
            <p className="text-sm text-[#94A3B8] text-center py-6">אין מועמדים משויכים אליך עדיין</p>
          ) : (
            <div className="space-y-2">
              {recentCandidates.map(c => (
                <Link key={c.id} to={`/recruiter/crm/candidate?id=${c.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F7F8FC] transition-colors group">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#2563EB] flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                    {c.full_name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-[#0F172A] truncate">{c.full_name}</div>
                    <div className="text-xs text-[#94A3B8] truncate">{c.role_name || c.domain_name || '—'}</div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-[#CBD5E1] group-hover:text-[#7C3AED]" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Applications */}
        <div className="bg-white rounded-2xl border border-[#E4ECFF] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-[#0F172A]">הגשות אחרונות</h3>
            <Link to="/recruiter/pipeline" className="text-sm font-bold text-[#7C3AED] hover:underline">Pipeline</Link>
          </div>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />)}</div>
          ) : recentApplications.length === 0 ? (
            <p className="text-sm text-[#94A3B8] text-center py-6">אין הגשות משויכות אליך עדיין</p>
          ) : (
            <div className="space-y-2">
              {recentApplications.map(a => (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F7F8FC] transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-[#F0F4FF] flex items-center justify-center text-[#6C4DFF] text-xs font-black flex-shrink-0">
                    {a.company?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-[#0F172A] truncate">{a.candidate_name}</div>
                    <div className="text-xs text-[#94A3B8] truncate">{a.job_title} · {a.company}</div>
                  </div>
                  {a.match_score && (
                    <span className={`text-xs font-black px-2 py-1 rounded-full ${a.match_score >= 70 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {a.match_score}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}