import { useState } from "react"
import { authService } from "@/api/services/authService"

export default function EditNameModal({ user, onUpdated }) {
  const [open, setOpen] = useState(false)

  const [name, setName] = useState(user?.full_name || "")

  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) {
      return
    }

    setSaving(true)
    await authService.updateMe({ full_name: name.trim() })
    setSaving(false)
    setOpen(false)

    if (onUpdated) {
      onUpdated()
    }

    window.location.reload() // reload so auth context picks up new name
  }

  if (!open) {
    return (
      <button
        onClick={() => {
          setName(user?.full_name || "")
          setOpen(true)
        }}
        className="w-5 h-5 rounded-md flex items-center justify-center hover:bg-[#F3EFFF] transition-all opacity-50 hover:opacity-100"
        title="עריכת שם"
      >
        <Pencil className="w-3 h-3 text-[#7C3AED]" />
      </button>
    )
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-50" onClick={() => setOpen(false)} />

      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl border border-[#E4ECFF] p-6 w-80"
        dir="rtl"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-[#0F172A]">עדכון שם מלא</h3>

          <button
            onClick={() => setOpen(false)}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#F0F1F5]"
          >
            <X className="w-4 h-4 text-[#94A3B8]" />
          </button>
        </div>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          placeholder="שם מלא"
          autoFocus
          className="w-full h-10 px-3 rounded-xl border border-[#E4ECFF] text-sm font-semibold text-[#0F172A] focus:outline-none focus:border-[#7C3AED] mb-4"
        />

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="flex-1 h-9 rounded-xl bg-[#7C3AED] text-white text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />

            {saving ? "שומר..." : "שמור"}
          </button>

          <button
            onClick={() => setOpen(false)}
            className="flex-1 h-9 rounded-xl border border-[#E4ECFF] text-[#64748B] text-sm font-bold"
          >
            ביטול
          </button>
        </div>
      </div>
    </>
  )
}
import { Pencil, X, Check } from "lucide-react"
