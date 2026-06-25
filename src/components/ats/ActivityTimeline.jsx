import React, { useState, useEffect } from 'react';
import { UserPlus, ArrowRight, MessageSquare, Sparkles, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const STAGE_LABELS = {
  new: 'חדש', screening: 'סינון ראשוני', phone_interview: 'ראיון טלפוני',
  professional_interview: 'ראיון מקצועי', client_stage: 'שלב לקוח',
  hired: 'התקבל', rejected: 'נדחה',
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  // Parse the date — DB timestamps are UTC ISO strings
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'עכשיו';
  if (diffMin < 60) return `לפני ${diffMin} דקות`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `לפני ${diffH} שעות`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `לפני ${diffD} ימים`;
  // Format as local Israel date for older events
  return date.toLocaleDateString('he-IL', { timeZone: 'Asia/Jerusalem', day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('he-IL', {
    timeZone: 'Asia/Jerusalem',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export default function ActivityTimeline({ application }) {
  const [dbEvents, setDbEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch timeline from DB. Uses application.id as the stable key.
  // Polls every 4s while the drawer is open so new status_changed events
  // appear without requiring a manual reload — and always reads server timestamps.
  useEffect(() => {
    if (!application?.id) return;
    let cancelled = false;

    const fetchEvents = () => {
      base44.entities.ApplicationTimeline
        .filter({ application_id: application.id }, '-created_date', 50)
        .then(rows => { if (!cancelled) setDbEvents(rows || []); })
        .catch(() => {});
    };

    // Initial load with a short delay to let the DB commit any in-flight write
    setLoading(true);
    const initialTimer = setTimeout(() => {
      if (cancelled) return;
      base44.entities.ApplicationTimeline
        .filter({ application_id: application.id }, '-created_date', 50)
        .then(rows => { if (!cancelled) { setDbEvents(rows || []); setLoading(false); } })
        .catch(() => { if (!cancelled) setLoading(false); });
    }, 600);

    // Poll every 4s for new events (status changes written by moveApplication)
    const pollInterval = setInterval(fetchEvents, 4000);

    return () => {
      cancelled = true;
      clearTimeout(initialTimer);
      clearInterval(pollInterval);
    };
  }, [application?.id]); // only re-mount when switching to a different application

  // Build base events from the application object itself
  const baseEvents = [
    {
      icon: UserPlus,
      color: '#8B5CF6',
      title: 'מועמדות נוצרה',
      desc: `נוצרה מועמדות עבור ${application?.job_title || ''}`,
      time: application?.created_date,
    },
  ];

  if (application?.match_score) {
    baseEvents.push({
      icon: Sparkles,
      color: '#10B981',
      title: 'ניתוח AI הושלם',
      desc: `ציון התאמה: ${application.match_score}%`,
      time: application.created_date,
    });
  }

  // Map DB events to display format
  const dbMapped = dbEvents.map(ev => ({
    icon: ArrowRight,
    color: '#2F80FF',
    title: ev.event_type === 'status_changed'
      ? `שינוי שלב: ${STAGE_LABELS[ev.old_value] || ev.old_value || '?'} → ${STAGE_LABELS[ev.new_value] || ev.new_value || '?'}`
      : (ev.title || ev.event_type),
    desc: ev.description || ev.performed_by || '',
    time: ev.created_date,
  }));

  // Merge: DB events first (newest), then base events
  const allEvents = [...dbMapped, ...baseEvents].sort(
    (a, b) => new Date(b.time || 0) - new Date(a.time || 0)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-[#E4ECFF] border-t-[#7C3AED] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {allEvents.length === 0 && (
        <div className="text-center py-8 text-[#94A3B8]">
          <Clock className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm font-semibold">אין פעילות עדיין</p>
        </div>
      )}
      {allEvents.map((ev, i) => {
        const Icon = ev.icon;
        return (
          <div key={i} className="flex gap-4 pb-4">
            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: `${ev.color}18`, border: `2px solid ${ev.color}` }}
              >
                <Icon className="w-4 h-4" style={{ color: ev.color }} />
              </div>
              {i < allEvents.length - 1 && <div className="w-0.5 flex-1 bg-[#E4ECFF] mt-1" />}
            </div>
            <div className="pb-2">
              <div className="font-bold text-sm text-[#0F172A]">{ev.title}</div>
              {ev.desc && <div className="text-xs text-[#64748B] mt-0.5">{ev.desc}</div>}
              <div className="text-xs text-[#94A3B8] mt-1 flex items-center gap-1.5">
                <span>{timeAgo(ev.time)}</span>
                {ev.time && <span className="opacity-60">• {formatTime(ev.time)}</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}