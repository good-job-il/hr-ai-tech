import { useState } from "react"
import { authService } from "@/api/services/authService"

export function UserMenu({ user }) {
  const [open, setOpen] = useState(false)

  if (!user) {
    return null
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#E4ECFF] bg-white hover:bg-[#F3EFFF]"
      >
        <Avatar initials={user.full_name?.slice(0, 2).toUpperCase()} size="sm" />
        <span className="text-sm font-bold text-[#0F172A]">{user.full_name}</span>
        <ChevronDown
          className={`w-4 h-4 text-[#7C3AED] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg border border-[#E4ECFF] shadow-lg z-50">
          <Link
            to="/settings/account"
            className="flex items-center gap-3 px-4 py-3 text-sm text-[#0F172A] hover:bg-[#F3EFFF] transition-colors"
          >
            <Settings className="w-4 h-4" />
            הגדרות
          </Link>
          <button
            onClick={() => authService.logout("/")}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#EF4444] hover:bg-[#FEF2F2] transition-colors border-t border-[#E4ECFF]"
          >
            <LogOut className="w-4 h-4" />
            יציאה
          </button>
        </div>
      )}
    </div>
  )
}

export default UserMenu
