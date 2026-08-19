import { useState } from "react"

export function NotificationBell({ unread = 0, notifications = [] }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative w-10 h-10 rounded-lg flex items-center justify-center border border-[#E4ECFF] bg-white hover:bg-[#F3EFFF]"
      >
        <Bell className="w-5 h-5 text-[#6C4DFF]" />
        {unread > 0 && (
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#EF4444] rounded-full border-2 border-white" />
        )}
      </button>

      {open && (
        <Card className="absolute top-full right-0 mt-2 w-80 max-h-96 overflow-y-auto z-50">
          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-[#64748B] font-medium">אין התראות</p>
              </div>
            ) : (
              notifications.map((notif, i) => (
                <div
                  key={i}
                  className="p-4 border-b border-[#E4ECFF] last:border-0 hover:bg-[#F9FBFF]"
                >
                  <p className="text-sm font-bold text-[#0F172A]">{notif.title}</p>
                  <p className="text-xs text-[#64748B] mt-1">{notif.message}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default NotificationBell
