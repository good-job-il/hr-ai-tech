import React, { useState, useEffect } from 'react';
import { notificationService } from '@/api/services/notificationService';
import { useAuth } from '@/lib/AuthContext';
import { Bell, CheckCheck, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/home/Navbar';
import { getNotifIcon, getNotifColor, NOTIF_TYPE_LABELS } from '@/components/notifications/notifHelpers';

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [filter, setFilter] = useState('all'); // all | unread | read

  const fetchNotifications = async () => {
    if (!user?.email) return;
    try {
      const result = await notificationService.list({ limit: 100 });
      setNotifications(result || []);
      setLoadError(null);
    } catch {
      setLoadError('Unable to refresh notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = window.setInterval(fetchNotifications, 15000);
    return () => window.clearInterval(interval);
  }, [user?.email]);

  const markAsRead = async (id) => {
    await notificationService.markRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    await notificationService.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const deleteNotif = async (id) => {
    await notificationService.remove(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const deleteAll = async () => {
    await Promise.all(notifications.map(n => notificationService.remove(n.id)));
    setNotifications([]);
  };

  const handleClick = async (notif) => {
    if (!notif.is_read) await markAsRead(notif.id);
    if (notif.metadata?.link) navigate(notif.metadata.link);
  };

  const timeStr = (dateStr) => {
    return new Date(dateStr).toLocaleString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const filtered = filter === 'unread' ? notifications.filter(n => !n.is_read)
    : filter === 'read' ? notifications.filter(n => n.is_read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        {loadError && <div role="status" className="mb-4 rounded-lg border border-amber-400/30 bg-amber-500/10 p-3 text-sm text-amber-300">{loadError}</div>}
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Bell className="w-6 h-6 text-purple-400" />
              ההתראות שלי
            </h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-400 mt-1">{unreadCount} התראות לא נקראו</p>
            )}
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
               <button
                 onClick={markAllRead}
                 className="flex items-center gap-2 text-sm bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-4 h-10 rounded-xl shadow-md hover:shadow-lg transition-all font-medium active:scale-95 inline-flex"
               >
                 <CheckCheck className="w-4 h-4" />
                 סמן הכל כנקרא
               </button>
             )}
             {notifications.length > 0 && (
               <button
                 onClick={deleteAll}
                 className="flex items-center gap-2 text-sm border border-white/20 text-gray-400 hover:text-red-400 hover:border-red-400/40 px-4 h-10 rounded-xl transition-all active:scale-95 inline-flex font-medium"
               >
                 <Trash2 className="w-4 h-4" />
                 מחק הכל
               </button>
             )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4">
          {[{ key: 'all', label: `הכל (${notifications.length})` }, { key: 'unread', label: `לא נקרא (${unreadCount})` }, { key: 'read', label: 'נקרא' }].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${
                filter === f.key ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-md' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
              } active:scale-95`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Notifications list */}
        <div className="space-y-2">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-white/10 border-t-purple-500 rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Bell className="w-14 h-14 text-white/10 mx-auto mb-4" />
              <p className="text-gray-400 font-medium">אין התראות להצגה</p>
            </div>
          ) : (
            filtered.map(notif => (
              <div
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={`relative flex items-start gap-4 p-4 rounded-2xl border cursor-pointer group transition-all ${
                  notif.is_read
                    ? 'bg-white/3 border-white/8 hover:bg-white/6'
                    : 'bg-purple-500/8 border-purple-500/20 hover:bg-purple-500/12'
                }`}
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getNotifColor(notif.type)}`}>
                  {getNotifIcon(notif.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-semibold ${notif.is_read ? 'text-gray-300' : 'text-white'}`}>{notif.title}</span>
                        <span className="text-[10px] bg-white/10 text-gray-400 px-2 py-0.5 rounded-full">{NOTIF_TYPE_LABELS[notif.type] || notif.type}</span>
                        {!notif.is_read && <span className="w-2 h-2 bg-purple-400 rounded-full" />}
                      </div>
                      {notif.content && (
                        <p className="text-sm text-gray-400 mt-1">{notif.content}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1.5">{timeStr(notif.created_date)}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      {!notif.is_read && (
                        <button
                            onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                            className="p-2 bg-white/5 hover:bg-purple-500/20 text-gray-400 hover:text-purple-300 rounded-lg transition-all active:scale-90 font-medium"
                            title="סמן כנקרא"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteNotif(notif.id); }}
                          className="p-2 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-all active:scale-90 font-medium"
                          title="מחק"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
