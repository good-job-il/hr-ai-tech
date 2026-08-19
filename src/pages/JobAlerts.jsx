import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { httpClient } from "@/api/client/httpClient"
import { useAuth } from "@/lib/AuthContext"
import Navbar from "@/components/home/Navbar"
import { Bell, Plus, Trash2, BellOff } from "lucide-react"

const CATEGORIES = [
  "",
  "פיתוח תוכנה",
  "עיצוב",
  "שיווק",
  "מכירות",
  "כספים",
  "HR",
  "הנדסה",
  "רפואה",
  "חינוך",
]
const typeLabels = {
  any: "כל הסוגים",
  full: "משרה מלאה",
  part: "חלקית",
  remote: "מרחוק",
  daily: "יומי",
}

export default function JobAlerts() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    keywords: "",
    location: "",
    category: "",
    job_type: "any",
    salary_min: "",
    frequency: "daily",
  })

  const { data: alerts = [] } = useQuery({
    queryKey: ["job-alerts", user?.email],
    queryFn: () =>
      httpClient.get(`/jobs/alerts?user_email=${encodeURIComponent(user.email)}`, { cache: false }),
    enabled: !!user,
  })

  const createMutation = useMutation({
    mutationFn: (data) =>
      httpClient.post("/jobs/alerts", { ...data, user_email: user.email, is_active: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-alerts"] })
      setShowForm(false)
      setForm({
        keywords: "",
        location: "",
        category: "",
        job_type: "any",
        salary_min: "",
        frequency: "daily",
      })
    },
  })

  const toggleMutation = useMutation({
    mutationFn: (a) => httpClient.patch(`/jobs/alerts/${a.id}`, { is_active: !a.is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["job-alerts"] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => httpClient.delete(`/jobs/alerts/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["job-alerts"] }),
  })

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#eaf7fb" }} dir="rtl">
      <Navbar />
      <div className="max-w-[700px] mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-hhblue" /> התראות משרות
          </h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-hhblue text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-hhblue/90 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> הוסף התראה
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-4 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4">התראה חדשה</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                value={form.keywords}
                onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                placeholder="מילות מפתח (תפקיד, חברה...)"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30 sm:col-span-2"
              />
              <input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="מיקום (רשות)"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30"
              />
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30"
              >
                <option value="">כל הקטגוריות</option>
                {CATEGORIES.filter(Boolean).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                value={form.job_type}
                onChange={(e) => setForm({ ...form, job_type: e.target.value })}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30"
              >
                {Object.entries(typeLabels).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={form.salary_min}
                onChange={(e) => setForm({ ...form, salary_min: e.target.value })}
                placeholder="שכר מינימום (₪)"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30"
              />
              <select
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30"
              >
                <option value="daily">יומי</option>
                <option value="weekly">שבועי</option>
              </select>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                ביטול
              </button>
              <button
                onClick={() => createMutation.mutate(form)}
                disabled={createMutation.isPending}
                className="flex-1 bg-hhblue text-white py-2 rounded-lg text-sm font-semibold hover:bg-hhblue/90 disabled:opacity-50"
              >
                {createMutation.isPending ? "שומר..." : "צור התראה"}
              </button>
            </div>
          </div>
        )}

        {alerts.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
            <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">אין לך התראות עדיין</p>
            <p className="text-gray-400 text-xs mt-1">צור התראה כדי לקבל משרות מתאימות למייל</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`bg-white rounded-xl border p-4 flex items-center justify-between ${!alert.is_active ? "opacity-60" : "border-gray-100"}`}
              >
                <div>
                  <div className="font-medium text-gray-900 text-sm">
                    {alert.keywords || "כל המשרות"}
                    {alert.location && <span className="text-gray-500"> | {alert.location}</span>}
                    {alert.category && <span className="text-gray-500"> | {alert.category}</span>}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {typeLabels[alert.job_type]} · {alert.frequency === "daily" ? "יומי" : "שבועי"}
                    {alert.salary_min && ` · שכר ₪${Number(alert.salary_min).toLocaleString()}+`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleMutation.mutate(alert)}
                    className="text-gray-400 hover:text-hhblue p-1"
                  >
                    {alert.is_active ? (
                      <Bell className="w-4 h-4" />
                    ) : (
                      <BellOff className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(alert.id)}
                    className="text-gray-400 hover:text-red-500 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
