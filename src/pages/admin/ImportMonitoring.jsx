import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { importSourceService } from '@/api/services/importSourceService';
import AdminLayout from '@/components/admin/AdminLayout';
import { AlertCircle, CheckCircle, Clock, Loader2, RefreshCw } from 'lucide-react';

export default function ImportMonitoring() {
  const [sortBy, setSortBy] = useState('last_sync');

  const { data: sources = [], isLoading, refetch } = useQuery({
    queryKey: ['import-sources-monitoring'],
    queryFn: () => importSourceService.list({ sort: 'last_sync', order: 'DESC', limit: 100 }),
    refetchInterval: 30000, // Auto-refresh every 30s
  });

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date();
    const oneHourAgo = new Date(now - 60 * 60 * 1000);
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);

    return {
      total: sources.length,
      active: sources.filter(s => s.is_active).length,
      recent: sources.filter(s => s.last_sync && new Date(s.last_sync) > oneHourAgo).length,
      errors: sources.filter(s => s.last_sync_status === 'error').length,
      success: sources.filter(s => s.last_sync_status === 'success').length,
      totalJobsAdded: sources.reduce((sum, s) => sum + (s.jobs_added || 0), 0),
      totalJobsClosed: sources.reduce((sum, s) => sum + (s.jobs_closed || 0), 0),
    };
  }, [sources]);

  const sortedSources = useMemo(() => {
    const sorted = [...sources];
    if (sortBy === 'last_sync') {
      sorted.sort((a, b) => new Date(b.last_sync || 0) - new Date(a.last_sync || 0));
    } else if (sortBy === 'status') {
      sorted.sort((a, b) => (a.last_sync_status || '').localeCompare(b.last_sync_status || ''));
    } else if (sortBy === 'jobs') {
      sorted.sort((a, b) => (b.jobs_added || 0) - (a.jobs_added || 0));
    }
    return sorted;
  }, [sources, sortBy]);

  const StatusBadge = ({ status }) => {
    if (status === 'success') {
      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold"><CheckCircle className="w-3 h-3" /> הצלחה</span>;
    } else if (status === 'error') {
      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold"><AlertCircle className="w-3 h-3" /> שגיאה</span>;
    } else if (status === 'pending') {
      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold"><Clock className="w-3 h-3" /> ממתין</span>;
    }
    return null;
  };

  const formatTime = (date) => {
    if (!date) return '—';
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m`;
    return 'עכשיו';
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6" dir="rtl">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ניטור ייבוא משרות</h1>
            <p className="text-sm text-gray-500 mt-1">ניטור real-time של כל המקורות</p>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700"
          >
            <RefreshCw className="w-4 h-4" /> רענן
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {[
            { label: 'מקורות', value: stats.total, icon: '📊' },
            { label: 'פעילים', value: stats.active, icon: '✅' },
            { label: 'סינכרון אחרון', value: stats.recent, icon: '⏱️' },
            { label: 'הצלחות', value: stats.success, icon: '✓' },
            { label: 'שגיאות', value: stats.errors, icon: '❌' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm hover:shadow-md transition">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-4">
            <div className="text-sm text-green-700 font-semibold">משרות שנוספו</div>
            <div className="text-3xl font-bold text-green-600 mt-1">{stats.totalJobsAdded.toLocaleString('he-IL')}</div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl border border-red-200 p-4">
            <div className="text-sm text-red-700 font-semibold">משרות שנסגרו</div>
            <div className="text-3xl font-bold text-red-600 mt-1">{stats.totalJobsClosed.toLocaleString('he-IL')}</div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">מקורות ייבוא</h2>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
            >
              <option value="last_sync">סדר לפי סינכרון אחרון</option>
              <option value="status">סדר לפי סטטוס</option>
              <option value="jobs">סדר לפי משרות שנוספו</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">שם מקור</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">סטטוס</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">סינכרון אחרון</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">משרות</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">תוכן</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedSources.map((source) => (
                  <tr key={source.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">{source.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{source.provider}</div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={source.last_sync_status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-600">{formatTime(source.last_sync)}</div>
                      {source.last_error && (
                        <div className="text-xs text-red-600 mt-0.5">⚠️ {source.last_error}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <span className="text-green-700 font-semibold">+{source.jobs_added || 0}</span>
                        <span className="text-gray-500 mx-1">/</span>
                        <span className="text-red-700 font-semibold">-{source.jobs_closed || 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {source.logs ? (
                        <details className="cursor-pointer">
                          <summary className="text-xs text-purple-600 hover:text-purple-700">צפה בלוג</summary>
                          <pre className="text-xs bg-gray-50 p-2 rounded mt-1 max-h-20 overflow-auto text-gray-700">{source.logs}</pre>
                        </details>
                      ) : (
                        <span className="text-xs text-gray-400">אין לוג</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {sortedSources.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              אין מקורות ייבוא מוגדרים
            </div>
          )}
        </div>

        {/* Error Sources Alert */}
        {stats.errors > 0 && (
          <div className="mt-8 bg-red-50 border border-red-200 rounded-2xl p-6">
            <h3 className="font-semibold text-red-900 mb-3">⚠️ מקורות עם שגיאות</h3>
            <div className="space-y-2">
              {sortedSources
                .filter(s => s.last_sync_status === 'error')
                .map(source => (
                  <div key={source.id} className="text-sm text-red-800">
                    <strong>{source.name}</strong>: {source.last_error || 'שגיאה לא מוגדרת'}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
