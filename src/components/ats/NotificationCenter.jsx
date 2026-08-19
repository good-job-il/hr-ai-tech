/**
 * NotificationCenter
 * Bell icon with unread counter + dropdown list of pipeline notifications.
 */
import { useState, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { notificationService } from "@/api/services/notificationService"

function timeAgo(dateStr, t) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000

  if (diff < 60) {
    return t("pipeline.time.now")
  }

  if (diff < 3600) {
    return t("pipeline.time.minutesAgo", { count: Math.floor(diff / 60) })
  }

  if (diff < 86400) {
    return t("pipeline.time.hoursAgo", { count: Math.floor(diff / 3600) })
  }

  return t("pipeline.time.daysAgo", { count: Math.floor(diff / 86400) })
}

export default function NotificationCenter() {
  const { t, i18n } = useTranslation()

  const [open, setOpen] = useState(false)

  const [notifications, setNotifications] = useState([])

  const [loading, setLoading] = useState(false)

  const [loadError, setLoadError] = useState(null)

  const isRTL = !i18n.language?.startsWith("en")

  const loadNotifications = useCallback(async () => {
    setLoading(true)

    try {
      const data = await notificationService.list({ limit: 30 })

      setNotifications(data || [])
      setLoadError(null)
    } catch (error) {
      setLoadError(t("common.refreshFailed", { defaultValue: "Unable to refresh notifications" }))
      console.error("Unable to load notifications", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNotifications()

    const interval = setInterval(loadNotifications, 30000)

    return () => clearInterval(interval)
  }, [loadNotifications])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const markAllRead = async () => {
    await notificationService.markAllRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  const markOneRead = async (id) => {
    await notificationService.markRead(id)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen((o) => !o)

          if (!open) {
            loadNotifications()
          }
        }}
        className="relative w-10 h-10 rounded-xl border border-[#E4ECFF] bg-white flex items-center justify-center hover:border-[#C4B5FD] transition-all"
      >
        <Bell className="w-4 h-4 text-[#64748B]" />

        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-[#EF4444] text-white text-[10px] font-black flex items-center justify-center px-1">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div
            dir={isRTL ? "rtl" : "ltr"}
            className={`absolute ${isRTL ? "left-0" : "right-0"} top-12 w-[380px] max-w-[95vw] bg-white rounded-2xl border border-[#E4ECFF] shadow-2xl z-50 flex flex-col`}
            style={{ maxHeight: 480 }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E4ECFF]">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#7C3AED]" />

                <span className="font-black text-[#0F172A]">
                  {t("pipeline.notifications.title")}
                </span>

                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#EF4444] text-white text-xs font-black">
                    {t("pipeline.notifications.newCount", { count: unreadCount })}
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

                    {t("pipeline.notifications.markAllRead")}
                  </button>
                )}

                <button onClick={() => setOpen(false)}>
                  <X className="w-4 h-4 text-[#94A3B8] hover:text-[#64748B]" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {loadError && (
                <div
                  role="status"
                  className="mx-4 mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800"
                >
                  {loadError}
                </div>
              )}

              {loading && (
                <div className="flex items-center justify-center py-10">
                  <div className="w-6 h-6 border-2 border-[#E4ECFF] border-t-[#7C3AED] rounded-full animate-spin" />
                </div>
              )}

              {!loading && notifications.length === 0 && (
                <div className="py-10 text-center text-[#94A3B8] font-semibold text-sm">
                  {t("pipeline.notifications.empty")}
                </div>
              )}

              {!loading &&
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markOneRead(n.id)}
                    className={`px-5 py-4 border-b border-[#F1F5F9] cursor-pointer hover:bg-[#F7FBFF] transition-all ${
                      !n.is_read ? "bg-[#FEFBFF]" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {!n.is_read && (
                        <span className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full bg-[#7C3AED]" />
                      )}

                      {n.is_read && <span className="mt-1.5 flex-shrink-0 w-2 h-2" />}

                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm leading-tight mb-1 ${!n.is_read ? "font-black text-[#0F172A]" : "font-semibold text-[#374151]"}`}
                        >
                          {n.title}
                        </p>

                        <p className="text-xs text-[#64748B] leading-relaxed">{n.content}</p>

                        <div className="flex items-center gap-1 mt-1.5">
                          <Clock className="w-3 h-3 text-[#94A3B8]" />

                          <span className="text-[11px] text-[#94A3B8]">
                            {timeAgo(n.created_date, t)}
                          </span>
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
  )
}
