import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, Users, Calendar, TrendingUp, Clock, CheckCircle,
  AlertTriangle, ChevronLeft, BarChart2, RefreshCw
} from 'lucide-react';

function StatCard({ icon: Icon, label, value, color, sub }) { // Icon is a component prop
  return (
    <div className="bg-white rounded-2xl border border-[#E4ECFF] p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center`} style={{ backgroundColor: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
      <div className="text-3xl font-black text-[#0F172A]">{value ?? '—'}</div>
      <div className="text-sm font-bold text-[#64748B] mt-1">{label}</div>
      {sub && <div className="text-xs text-[#94A3B8] mt-0.5">{sub}</div>}
    </div>
  );
}

export default function EmployerCRMDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    const employerId = user?.email;
    const [jobsData, appsData, interviewsData] = await Promise.all([
      base44.entities.Job.filter({ employer_id: employerId, is_closed: false }, '-created_date', 50),
      base44.entities.Application.filter({ employer_id: employerId }, '-created_date', 100),
      base44.entities.Interview.filter({ employer_id: employerId }, '-date', 50),
    ]);
    setJobs(jobsData);
    setApplications(appsData);
    setInterviews(interviewsData);
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (user) loadData(); }, [user?.email]);

  // SLA: applications pending > 7 days
  const today = new Date();
  const slaWarnings = applications.filter(a => {
    if (a.status !== 'new' && a.status !== 'reviewed') return false;
    const created = new Date(a.created_date);
    const days = (today - created) / (1000 * 60 * 60 * 24);
    return days > 7;
  });

  const upcomingInterviews = interviews.filter(i => ['scheduled', 'confirmed'].includes(i.status));
  const hiredCount = applications.filter(a => a.status === 'hired').length;
  const convRate = applications.length ? Math.round((hiredCount / applications.length) * 100) : 0;

  // Pipeline breakdown
  const pipelineStages = ['new', 'reviewed', 'phone_interview', 'recommended', 'employer_interview', 'offer', 'hired'];
  const pipelineBreakdown = pipelineStages.map(s => ({
    label: { new: 'חדש', reviewed: 'נסקר', phone_interview: 'שיחה', recommended: 'מומלץ', employer_interview: 'ראיון', offer: 'הצעה', hired: 'גויס' }[s],
    count: applications.filter(a => a.status === s).length,
    color: { new: '#2563EB', reviewed: '#F59E0B', phone_interview: '#8B5CF6', recommended: '#4F46E5', employer_interview: '#F97316', offer: '#10B981', hired: '#059669' }[s],
  }));

  if (loading) return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-10 bg-[#F0F1F5] rounded-xl w-64" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-[#F0F1F5] rounded-2xl" />)}
      </div>
    </div>
  );

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0F172A]">לוח בקרה — מעסיק</h1>
          <p className="text-sm text-[#64748B] mt-1">שלום, {user?.full_name}</p>
        </div>
        <button onClick={loadData} className="flex items-center gap-1.5 text-sm font-bold text-[#64748B] hover:text-[#7C3AED] transition-colors">
          <RefreshCw className="w-4 h-4" /> רענן
        </button>
      </div>

      {/* SLA Warning */}
      {slaWarnings.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-5 py-3 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />
          <div>
            <span className="text-sm font-black text-orange-800">{slaWarnings.length} מועמדויות</span>
            <span className="text-sm text-orange-700"> ממתינות יותר מ-7 ימים — נדרשת תגובה</span>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Briefcase} label="משרות פעילות" value={jobs.length} color="#7C3AED" />
        <StatCard icon={Users} label="סה״כ מועמדויות" value={applications.length} color="#2563EB" />
        <StatCard icon={Calendar} label="ראיונות קרובים" value={upcomingInterviews.length} color="#8B5CF6" sub={`מתוך ${interviews.length} סה״כ`} />
        <StatCard icon={TrendingUp} label="גיוסים מוצלחים" value={hiredCount} color="#10B981" sub={`${convRate}% המרה`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E4ECFF] p-5">
          <h2 className="font-black text-[#0F172A] mb-4 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-[#7C3AED]" /> Pipeline
          </h2>
          <div className="space-y-2">
            {pipelineBreakdown.map(stage => (
              <div key={stage.label} className="flex items-center gap-3">
                <span className="text-xs font-bold text-[#64748B] w-20 flex-shrink-0 text-left">{stage.label}</span>
                <div className="flex-1 bg-[#F0F1F5] rounded-full h-3 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: applications.length ? `${(stage.count / applications.length) * 100}%` : '0%', backgroundColor: stage.color }} />
                </div>
                <span className="text-xs font-black text-[#0F172A] w-6 text-left">{stage.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Open Jobs */}
        <div className="bg-white rounded-2xl border border-[#E4ECFF] p-5">
          <h2 className="font-black text-[#0F172A] mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[#7C3AED]" /> משרות פעילות
          </h2>
          {jobs.length === 0 ? (
            <div className="text-center py-6 text-[#94A3B8] text-sm">אין משרות פעילות</div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {jobs.map(job => {
                const appCount = applications.filter(a => a.job_id === job.id).length;
                return (
                  <div key={job.id} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-[#F7F8FC] transition-colors cursor-pointer">
                    <div>
                      <div className="text-sm font-bold text-[#0F172A]">{job.title}</div>
                      <div className="text-xs text-[#94A3B8]">{job.location}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-[#7C3AED] bg-[#EEF4FF] px-2.5 py-1 rounded-full">{appCount}</span>
                      <ChevronLeft className="w-4 h-4 text-[#CBD5E1]" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Interviews */}
      {upcomingInterviews.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E4ECFF] p-5">
          <h2 className="font-black text-[#0F172A] mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#7C3AED]" /> ראיונות קרובים
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcomingInterviews.slice(0, 6).map(interview => (
              <div key={interview.id} className="bg-[#F7F8FC] rounded-xl p-4 border border-[#E4ECFF]">
                <div className="font-bold text-sm text-[#0F172A]">{interview.candidate_name}</div>
                <div className="text-xs text-[#7C3AED] font-semibold">{interview.job_title}</div>
                <div className="flex items-center gap-2 mt-2 text-xs text-[#64748B]">
                  <Clock className="w-3 h-3" />
                  <span>{interview.date} — {interview.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Applications */}
      <div className="bg-white rounded-2xl border border-[#E4ECFF] p-5">
        <h2 className="font-black text-[#0F172A] mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-[#7C3AED]" /> מועמדויות אחרונות
        </h2>
        {applications.length === 0 ? (
          <div className="text-center py-6 text-[#94A3B8] text-sm">אין מועמדויות</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F0F1F5]">
                  <th className="text-right text-xs font-black text-[#94A3B8] pb-2 pr-2">מועמד</th>
                  <th className="text-right text-xs font-black text-[#94A3B8] pb-2">משרה</th>
                  <th className="text-right text-xs font-black text-[#94A3B8] pb-2">סטטוס</th>
                  <th className="text-right text-xs font-black text-[#94A3B8] pb-2">AI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F1F5]">
                {applications.slice(0, 10).map(app => (
                  <tr key={app.id} className="hover:bg-[#F7F8FC] cursor-pointer group">
                    <td className="py-3 pr-2">
                      <div className="font-bold text-[#0F172A]">{app.candidate_name}</div>
                      <div className="text-xs text-[#94A3B8]">{app.candidate_email}</div>
                    </td>
                    <td className="py-3 text-[#64748B]">{app.job_title}</td>
                    <td className="py-3">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{app.status}</span>
                    </td>
                    <td className="py-3">
                      {app.match_score ? (
                        <span className={`text-xs font-black ${app.match_score >= 70 ? 'text-green-600' : 'text-yellow-600'}`}>{app.match_score}%</span>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}