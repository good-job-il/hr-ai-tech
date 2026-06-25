/**
 * Platform Dashboard — Super Admin only.
 * Shows ONLY platform-level metrics: organizations, users, audit.
 * Does NOT expose candidate CRM, CVs, compensation, or recruiter tools.
 * Access to org data requires Impersonation/Support Mode (Phase D).
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Building2, Users, Activity, Globe, ShieldCheck, Clock } from 'lucide-react';

function StatCard({ icon: Icon, label, value, sub, color = 'purple', loading, to }) {
  const colors = {
    purple: 'bg-purple-50 text-purple-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    red: 'bg-red-50 text-red-600',
    slate: 'bg-slate-50 text-slate-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  const inner = (
    <div className={`bg-white border border-gray-100 rounded-2xl p-5 shadow-sm transition-shadow ${to ? 'hover:shadow-md cursor-pointer' : ''}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm font-semibold text-gray-500">{label}</span>
      </div>
      {loading ? (
        <div className="h-8 w-20 bg-gray-100 rounded animate-pulse" />
      ) : (
        <>
          <p className="text-3xl font-black text-gray-900">{value ?? '—'}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </>
      )}
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

export default function PlatformDashboard() {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgType, setNewOrgType] = useState('staffing_agency');
  const [creatingOrg, setCreatingOrg] = useState(false);

  const loadStats = async () => {
    setLoading(true);
    const [orgs, users, auditLogs] = await Promise.all([
      base44.entities.Organization.list('', 500),
      base44.entities.User.list('', 500).catch(() => []),
      base44.entities.AuditLog.list('-created_date', 100),
    ]);
    const agencies = orgs.filter(o => o.org_type === 'staffing_agency');
    const companies = orgs.filter(o => o.org_type === 'organization');
    const activeOrgs = orgs.filter(o => o.status === 'active');
    const suspended = orgs.filter(o => o.status === 'suspended');
    const recentAudit = auditLogs.slice(0, 8);
    setStats({ orgs, agencies, companies, activeOrgs, suspended, users, recentAudit });
    setLoading(false);
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleCreateOrg = async () => {
    if (!newOrgName.trim()) return;
    setCreatingOrg(true);
    try {
      await base44.entities.Organization.create({
        name: newOrgName,
        org_type: newOrgType,
        status: 'active',
      });
      setNewOrgName('');
      setNewOrgType('staffing_agency');
      setShowOrgModal(false);
      await loadStats();
    } catch (err) {
      console.error('Failed to create org:', err);
    } finally {
      setCreatingOrg(false);
    }
  };

  return (
    <div dir="rtl" className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900">לוח בקרה — פלטפורמה</h1>
        <p className="text-slate-500 mt-1 font-semibold">סקירה כוללת של כל הפלטפורמה</p>
      </div>

      {/* KPI Grid — Platform metrics only */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard icon={Building2} label="ארגונים פעילים" value={stats.activeOrgs?.length} color="purple" loading={loading} to="/platform/organizations" />
        <StatCard icon={Users} label="סה״כ משתמשים" value={stats.users?.length} color="blue" loading={loading} to="/platform/analytics/users" />
        <StatCard icon={Globe} label="חברות השמה" value={stats.agencies?.length} color="green" loading={loading} to="/platform/organizations/staffing" />
        <StatCard icon={Activity} label="חברות / HR" value={stats.companies?.length} color="slate" loading={loading} to="/platform/organizations/companies" />
        <StatCard icon={ShieldCheck} label="מושהים" value={stats.suspended?.length ?? 0} color="red" loading={loading} to="/platform/organizations" />
      </div>

      {/* Organizations breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-gray-900">ארגונים לפי סוג</h2>
            <button
              onClick={() => setShowOrgModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700"
            >
              + ארגון חדש
            </button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-xl">
                <span className="font-bold text-purple-800">חברות השמה</span>
                <span className="font-black text-purple-900">{stats.agencies?.length ?? 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl">
                <span className="font-bold text-emerald-800">חברות / HR פנימי</span>
                <span className="font-black text-emerald-900">{stats.companies?.length ?? 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl">
                <span className="font-bold text-blue-800">סה״כ ארגונים</span>
                <span className="font-black text-blue-900">{stats.orgs?.length ?? 0}</span>
              </div>
            </div>
          )}
        </div>

        {/* Recent Audit */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-black text-gray-900 mb-4">פעילות אחרונה (Audit)</h2>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4,5].map(i => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {(stats.recentAudit || []).map(log => (
                <div key={log.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-50">
                  <span className="text-gray-600 font-semibold">{log.action}</span>
                  <span className="text-xs text-gray-400 font-mono">{log.actor_email?.split('@')[0]}</span>
                </div>
              ))}
              {!stats.recentAudit?.length && (
                <p className="text-gray-400 text-center py-4">אין פעילות אחרונה</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* System Health placeholder */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-black text-gray-900 mb-2">System Health</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {[
            { label: 'Email Queue', status: 'ok', color: 'green' },
            { label: 'AI Parsing', status: 'ok', color: 'green' },
            { label: 'Integrations', status: 'ok', color: 'green' },
            { label: 'Import Queue', status: 'ok', color: 'green' },
          ].map(item => (
            <div key={item.label} className={`p-3 rounded-xl border text-center ${item.color === 'green' ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
              <div className={`text-xs font-black uppercase ${item.color === 'green' ? 'text-emerald-600' : 'text-red-600'}`}>{item.status.toUpperCase()}</div>
              <div className="text-sm font-bold text-gray-700 mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Organization Modal */}
      {showOrgModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-lg">
            <h3 className="text-xl font-black text-gray-900 mb-4">ארגון חדש</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">שם הארגון</label>
                <input
                  type="text"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:border-purple-400"
                  placeholder="לדוגמה: TechStaff Ltd"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">סוג ארגון</label>
                <select
                  value={newOrgType}
                  onChange={(e) => setNewOrgType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:border-purple-400"
                >
                  <option value="staffing_agency">חברת השמה</option>
                  <option value="organization">חברה / HR פנימי</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowOrgModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50"
                  disabled={creatingOrg}
                >
                  ביטול
                </button>
                <button
                  onClick={handleCreateOrg}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50"
                  disabled={creatingOrg || !newOrgName.trim()}
                >
                  {creatingOrg ? 'יוצר...' : 'צור'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}