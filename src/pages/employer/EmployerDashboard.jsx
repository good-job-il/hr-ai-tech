import { Users, Briefcase, Clock, TrendingUp, Plus, RefreshCw, Users2, Target } from 'lucide-react';
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import JobFormModal from '@/components/employer/JobFormModal';
import { Link } from 'react-router-dom';

function StatCard({ icon: Icon, label, value, color = '#7C3AED', loading }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E4ECFF] p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: color + '15' }}>
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      <div>
        <div className="text-2xl font-black text-[#0F172A]">
          {loading ? <span className="inline-block w-10 h-6 bg-gray-100 rounded animate-pulse" /> : value}
        </div>
        <div className="text-sm font-semibold text-[#64748B]">{label}</div>
      </div>
    </div>
  );
}

export default function EmployerDashboard() {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [jobs, candidates, interviews, applications] = await Promise.all([
      base44.entities.Job.filter({ employer_id: user.email, is_closed: false }, '', 200).catch(() => []),
      base44.entities.Candidate.filter({ employer_id: user.email }, '', 200).catch(() => []),
      base44.entities.Interview.filter({ employer_id: user.email, status: 'scheduled' }, '', 200).catch(() => []),
      base44.entities.Application.filter({ employer_id: user.email }, '', 200).catch(() => []),
    ]);
    setStats({
      openJobs: jobs.length,
      candidates: candidates.length,
      interviews: interviews.length,
      applications: applications.length,
    });
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.email]);

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#0F172A]">מעסיק</h1>
          <p className="text-lg font-bold text-[#7C3AED] mt-0.5">{user?.full_name || user?.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} disabled={loading} className="h-10 w-10 rounded-xl border border-[#E4ECFF] flex items-center justify-center text-[#64748B] hover:border-[#C4B5FD] disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setModalOpen(true)} className="h-10 px-5 rounded-xl bg-gradient-to-l from-[#2F80FF] to-[#8B5CF6] text-white font-bold text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" />
            פרסם משרה חדשה
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Briefcase} label="משרות פתוחות" value={stats?.openJobs ?? '—'} color="#7C3AED" loading={loading} />
        <StatCard icon={Users} label="מועמדים" value={stats?.candidates ?? '—'} color="#2563EB" loading={loading} />
        <StatCard icon={Clock} label="ראיונות מתוזמנים" value={stats?.interviews ?? '—'} color="#059669" loading={loading} />
        <StatCard icon={TrendingUp} label="הגשות" value={stats?.applications ?? '—'} color="#EA580C" loading={loading} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/employer/candidates" className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 p-6 hover:shadow-lg transition-all">
          <div className="flex items-center gap-3 mb-2">
            <Users2 className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-black text-blue-900">מועמדים</h3>
          </div>
          <p className="text-blue-700 font-semibold text-2xl">{stats?.candidates ?? '—'}</p>
          <p className="text-blue-600 text-sm mt-1">מועמדים שנשלחו אליך</p>
        </Link>

        <Link to="/employer/pipeline" className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border border-purple-200 p-6 hover:shadow-lg transition-all">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-black text-purple-900">תהליך גיוס</h3>
          </div>
          <p className="text-purple-700 font-semibold text-2xl">{stats?.applications ?? '—'}</p>
          <p className="text-purple-600 text-sm mt-1">הגשות בתהליך</p>
        </Link>
      </div>

      <JobFormModal
        job={null}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={() => { setModalOpen(false); load(); }}
      />
    </div>
  );
}