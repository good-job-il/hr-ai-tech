/**
 * NotificationCenter
 * Bell icon with unread counter + dropdown list of pipeline notifications.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCheck, X, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'עכשיו';
  if (diff < 3600) return `לפני ${Math.floor(diff / 60)} דק'`;
  if (diff < 86400) return `לפני ${Math.floor(diff / 3600)} שע'`;
  return `לפני ${Math.floor(diff / 86400)} ימים`;
}

export default function NotificationCenter() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const data = await base44.entities.Notification.filter(
        { recipient_email: user.email },
        '-created_date',
        30
      );
      setNotifications(data || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    loadNotifications();
    // Poll every 30s when center is mounted
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    await Promise.allSettled(
      unread.map(n => base44.entities.Notification.update(n.id, { is_read: true }))
    );
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const markOneRead = async (id) => {
    await base44.entities.Notification.update(id, { is_read: true });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => { setOpen(o => !o); if (!open) loadNotifications(); }}
        className="relative w-10 h-10 rounded-xl border border-[#E4ECFF] bg-white flex items-center justify-center hover:border-[#C4B5FD] transition-all"
      >
        <Bell className="w-4 h-4 text-[#64748B]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-[#EF4444] text-white text-[10px] font-black flex items-center justify-center px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div
            dir="rtl"
            className="absolute left-0 top-12 w-[380px] max-w-[95vw] bg-white rounded-2xl border border-[#E4ECFF] shadow-2xl z-50 flex flex-col"
            style={{ maxHeight: 480 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E4ECFF]">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#7C3AED]" />
                <span className="font-black text-[#0F172A]">התראות Pipeline</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#EF4444] text-white text-xs font-black">
                    {unreadCount} חדש
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs font-bold text-[#7C3AED] hover:underline flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    סמן הכל כנקרא
                  </button>
                )}
                <button onClick={() => setOpen(false)}>
                  <X className="w-4 h-4 text-[#94A3B8] hover:text-[#64748B]" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1">
              {loading && (
                <div className="flex items-center justify-center py-10">
                  <div className="w-6 h-6 border-2 border-[#E4ECFF] border-t-[#7C3AED] rounded-full animate-spin" />
                </div>
              )}
              {!loading && notifications.length === 0 && (
                <div className="py-10 text-center text-[#94A3B8] font-semibold text-sm">
                  אין התראות עדיין
                </div>
              )}
              {!loading && notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => markOneRead(n.id)}
                  className={`px-5 py-4 border-b border-[#F1F5F9] cursor-pointer hover:bg-[#F7FBFF] transition-all ${
                    !n.is_read ? 'bg-[#FEFBFF]' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {!n.is_read && (
                      <span className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full bg-[#7C3AED]" />
                    )}
                    {n.is_read && <span className="mt-1.5 flex-shrink-0 w-2 h-2" />}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-tight mb-1 ${!n.is_read ? 'font-black text-[#0F172A]' : 'font-semibold text-[#374151]'}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-[#64748B] leading-relaxed">{n.content}</p>
                      <div className="flex items-center gap-1 mt-1.5">
                        <Clock className="w-3 h-3 text-[#94A3B8]" />
                        <span className="text-[11px] text-[#94A3B8]">{timeAgo(n.created_date)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}