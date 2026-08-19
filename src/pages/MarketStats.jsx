import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { jobService } from "@/api/services/jobService"
import { salaryService } from "@/api/services/salaryService"

const CATEGORIES = [
  "תוכנה",
  "הנדסה",
  "מכירות",
  "שיווק",
  "כספים",
  "HR",
  "עיצוב",
  "רפואה",
  "לוגיסטיקה",
]

export default function MarketStats() {
  const [selectedCategory, setSelectedCategory] = useState("תוכנה")

  const [aiLoading, setAiLoading] = useState(false)

  const [aiData, setAiData] = useState(null)

  const { data: jobs = [] } = useQuery({
    queryKey: ["stats-jobs"],
    queryFn: () => jobService.list({ sort: "created_date", order: "DESC", limit: 500 }),
  })

  // Jobs by category
  const categoryCounts = CATEGORIES.map((cat) => ({
    name: cat,
    count: jobs.filter((j) => j.category === cat || j.title?.includes(cat)).length,
  })).sort((a, b) => b.count - a.count)

  // Jobs by location
  const locationMap = {}

  jobs.forEach((j) => {
    if (j.location) {
      locationMap[j.location] = (locationMap[j.location] || 0) + 1
    }
  })

  const locationData = Object.entries(locationMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }))

  const loadAiInsights = async () => {
    setAiLoading(true)

    try {
      const rows = await salaryService.list({ category: selectedCategory, limit: 200 })

      const categoryJobs = jobs.filter(
        (job) => job.category === selectedCategory || job.title?.includes(selectedCategory),
      )

      const skills = categoryJobs.flatMap((job) => [
        ...(job.required_skills || []),
        ...(job.preferred_skills || []),
      ])

      const skillCounts = skills.reduce(
        (counts, skill) => ({ ...counts, [skill]: (counts[skill] || 0) + 1 }),
        {},
      )

      const average = (values) =>
        values.length
          ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
          : 0

      setAiData({
        salary_avg: average(rows.map((row) => row.salary_avg).filter(Boolean)),
        salary_min: rows.length
          ? Math.min(...rows.map((row) => row.salary_min).filter(Boolean))
          : 0,
        salary_max: rows.length
          ? Math.max(...rows.map((row) => row.salary_max).filter(Boolean))
          : 0,
        top_skills: Object.entries(skillCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([skill]) => skill),
        salary_by_experience: rows
          .slice(0, 8)
          .map((row) => ({ level: row.job_title, salary: row.salary_avg || 0 })),
        insights: rows.length
          ? `הנתונים מבוססים על ${rows.length} רשומות שכר מאומתות ועל ${categoryJobs.length} משרות פעילות.`
          : "אין עדיין מספיק נתוני שכר מאומתים עבור התחום שנבחר.",
      })
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#eaf7fb" }} dir="rtl">
      <Navbar />
      <div className="max-w-[1100px] mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-hhblue" /> סטטיסטיקת שוק העבודה
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          {/* Jobs by category */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <h2 className="font-semibold text-gray-900 mb-4">משרות לפי תחום</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={categoryCounts} layout="vertical" margin={{ right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v} משרות`]} />
                <Bar dataKey="count" fill="#3da8c8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Jobs by location */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <h2 className="font-semibold text-gray-900 mb-4">משרות לפי אזור</h2>
            {locationData.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                אין נתונים עדיין
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={locationData} layout="vertical" margin={{ right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`${v} משרות`]} />
                  <Bar dataKey="count" fill="#e74c3c" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* AI salary insights */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">נתוני שכר לפי תחום</h2>
          <div className="flex gap-2 mb-4 flex-wrap">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setSelectedCategory(c)
                  setAiData(null)
                }}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${selectedCategory === c ? "bg-hhblue text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                {c}
              </button>
            ))}
          </div>

          {!aiData && (
            <button
              onClick={loadAiInsights}
              disabled={aiLoading}
              className="bg-hhblue text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-hhblue/90 disabled:opacity-50 flex items-center gap-2"
            >
              {aiLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {aiLoading ? "טוען נתונים..." : `טען נתוני שכר – ${selectedCategory}`}
            </button>
          )}

          {aiData && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  ["שכר ממוצע", aiData.salary_avg],
                  ["שכר מינימום", aiData.salary_min],
                  ["שכר מקסימום", aiData.salary_max],
                ].map(([label, val]) => (
                  <div key={label} className="bg-hhblue/5 rounded-xl p-3 text-center">
                    <div className="text-lg font-bold text-hhblue">
                      ₪{Number(val).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">{label}</div>
                  </div>
                ))}
              </div>

              {aiData.salary_by_experience?.length > 0 && (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={aiData.salary_by_experience}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="level" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => [`₪${v.toLocaleString()}`]} />
                    <Bar dataKey="salary" fill="#3da8c8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}

              {aiData.top_skills?.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">כישורים מבוקשים:</div>
                  <div className="flex flex-wrap gap-2">
                    {aiData.top_skills.map((s, i) => (
                      <span
                        key={i}
                        className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {aiData.insights && (
                <div className="bg-blue-50 rounded-xl p-4 text-sm text-gray-700">
                  {aiData.insights}
                </div>
              )}

              <div className="text-xs text-gray-400">
                * הנתונים מבוססים על רשומות השכר והמשרות במערכת
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
