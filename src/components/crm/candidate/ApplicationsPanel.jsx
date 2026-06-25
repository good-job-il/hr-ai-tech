import { Briefcase, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const STATUS_CFG = {
  new:                { label: 'חדש',           color: 'bg-blue-100 text-blue-700' },
  reviewed:           { label: 'נסקר',          color: 'bg-yellow-100 text-yellow-700' },
  phone_interview:    { label: 'שיחת טלפון',    color: 'bg-purple-100 text-purple-700' },
  recommended:        { label: 'מומלץ',          color: 'bg-indigo-100 text-indigo-700' },
  employer_interview: { label: 'ראיון מעסיק',   color: 'bg-orange-100 text-orange-700' },
  offer:              { label: 'הצעה',           color: 'bg-green-100 text-green-700' },
  hired:              { label: 'גויס',           color: 'bg-green-200 text-green-800' },
  probation:          { label: 'מבחן',           color: 'bg-teal-100 text-teal-700' },
  completed:          { label: 'הושלם',          color: 'bg-gray-100 text-gray-600' },
  rejected:           { label: 'נדחה',           color: 'bg-red-100 text-red-700' },
};

export default function ApplicationsPanel({ applications }) {
  if (!applications?.length) return (
    <div className="text-center py-10 text-[#94A3B8]">
      <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-40" />
      <p className="text-sm font-semibold">אין מועמדויות</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {applications.map(app => {
        const statusCfg = STATUS_CFG[app.status] || { label: app.status, color: 'bg-gray-100 text-gray-600' };
        return (
          <div key={app.id} className="bg-white rounded-xl border border-[#E4ECFF] p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EEF4FF] flex items-center justify-center flex-shrink-0 text-sm font-black text-[#7C3AED]">
                  {app.company?.slice(0, 2).toUpperCase() || 'JB'}
                </div>
                <div>
                  <div className="font-black text-sm text-[#0F172A]">{app.job_title || 'ללא שם'}</div>
                  <div className="text-xs text-[#64748B] font-semibold">{app.company}</div>
                  {app.created_date && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-[#CBD5E1]">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(app.created_date), 'dd MMM yyyy', { locale: he })}
                    </div>
                  )}
                </div>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusCfg.color}`}>
                {statusCfg.label}
              </span>
            </div>
            {app.match_score && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#F0F1F5]">
                <div className={`text-xs font-black px-2.5 py-1 rounded-full ${app.match_score >= 70 ? 'bg-green-100 text-green-700' : app.match_score >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                  AI: {app.match_score}%
                </div>
                {app.match_reason && (
                  <span className="text-xs text-[#94A3B8] truncate">{app.match_reason}</span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}