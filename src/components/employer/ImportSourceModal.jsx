import { useState, useEffect } from "react"
import { importSourceService } from "@/api/services/importSourceService"

export default function ImportSourceModal({ source, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: source?.name || "",
    url: source?.url || "",
    interval_hours: source?.interval_hours || 6,
    is_active: source?.is_active ?? true,
  })

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setForm({
      name: source?.name || "",
      url: source?.url || "",
      interval_hours: source?.interval_hours || 6,
      is_active: source?.is_active ?? true,
    })
  }, [source])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    if (source) {
      await importSourceService.update(source.id, form)
    } else {
      await importSourceService.create(form)
    }

    setLoading(false)
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">{source ? "עריכת מקור" : "הוסף מקור ייבוא"}</h2>

          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">שם המקור *</label>

            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30 text-gray-900 bg-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">URL לפיד *</label>

            <input
              type="url"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              required
              dir="ltr"
              placeholder="https://..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30 text-gray-900 bg-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              תדירות סינכרון (שעות)
            </label>

            <input
              type="number"
              min="1"
              max="24"
              value={form.interval_hours}
              onChange={(e) => setForm({ ...form, interval_hours: Number(e.target.value) })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30 text-gray-900 bg-white"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="rounded"
            />
            מקור פעיל
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              ביטול
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-hhblue text-white py-2 rounded-lg text-sm font-semibold hover:bg-hhblue/90 disabled:opacity-50"
            >
              {loading ? "שומר..." : source ? "שמור" : "הוסף"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
import { X } from "lucide-react"
