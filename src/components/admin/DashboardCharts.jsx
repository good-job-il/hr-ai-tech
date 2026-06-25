import React from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function ApplicationsChart({ data }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="font-bold text-gray-800 mb-4 text-sm">מועמדויות ומשרות לפי יום</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="apps" stroke="#7c3aed" strokeWidth={2} dot={false} name="מועמדויות" />
          <Line type="monotone" dataKey="jobs" stroke="#06b6d4" strokeWidth={2} dot={false} name="משרות" />
          <Line type="monotone" dataKey="candidates" stroke="#10b981" strokeWidth={2} dot={false} name="מועמדים חדשים" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SourcesChart({ sourceCount }) {
  const data = [
    { name: 'אפליקציה', value: sourceCount.app || 0 },
    { name: 'LinkedIn', value: sourceCount.linkedin || 0 },
    { name: 'Facebook', value: sourceCount.facebook || 0 },
    { name: 'אתר דרושים', value: sourceCount.jobsite || 0 },
    { name: 'אחר', value: sourceCount.other || 0 },
  ].filter(d => d.value > 0);

  if (data.length === 0) return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-center h-48">
      <p className="text-gray-400 text-sm">אין נתוני מקורות</p>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="font-bold text-gray-800 mb-4 text-sm">מקורות מועמדויות</h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TopJobsTable({ jobs }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="font-bold text-gray-800 mb-4 text-sm">משרות מובילות</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" dir="rtl">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-right text-xs text-gray-500 font-medium pb-2">משרה</th>
              <th className="text-center text-xs text-gray-500 font-medium pb-2">צפיות</th>
              <th className="text-center text-xs text-gray-500 font-medium pb-2">הגשות</th>
              <th className="text-center text-xs text-gray-500 font-medium pb-2">המרה</th>
            </tr>
          </thead>
          <tbody>
            {jobs.slice(0, 8).map(job => (
              <tr key={job.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                <td className="py-2.5 pr-1">
                  <div className="font-medium text-gray-800 truncate max-w-[160px]">{job.title}</div>
                  <div className="text-xs text-gray-400 truncate">{job.company}</div>
                </td>
                <td className="text-center text-gray-600">{(job.views || 0).toLocaleString()}</td>
                <td className="text-center font-semibold text-purple-600">{job.appCount}</td>
                <td className="text-center">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    parseFloat(job.convRate) >= 5 ? 'bg-green-50 text-green-600' :
                    parseFloat(job.convRate) >= 2 ? 'bg-yellow-50 text-yellow-600' :
                    'bg-gray-50 text-gray-500'
                  }`}>{job.convRate}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function TopEmployersTable({ employers }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="font-bold text-gray-800 mb-4 text-sm">מעסיקים מובילים</h3>
      <div className="space-y-3">
        {employers.map((emp, i) => (
          <div key={emp.id} className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-400 w-4 text-center">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-700 truncate">{emp.id}</div>
              <div className="flex gap-3 mt-0.5">
                <span className="text-xs text-gray-400">{emp.jobs} משרות</span>
                <span className="text-xs text-purple-600 font-medium">{emp.apps} מועמדויות</span>
                <span className="text-xs text-cyan-600">{emp.views.toLocaleString()} צפיות</span>
              </div>
            </div>
            <div className="w-16 bg-gray-100 rounded-full h-1.5">
              <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${Math.min((emp.apps / (employers[0]?.apps || 1)) * 100, 100)}%` }} />
            </div>
          </div>
        ))}
        {employers.length === 0 && <p className="text-gray-400 text-sm text-center py-4">אין נתונים</p>}
      </div>
    </div>
  );
}