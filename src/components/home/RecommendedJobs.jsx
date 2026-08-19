import React from "react"
import { publicJobService } from "@/api/services/publicJobService"
import { useQuery } from "@tanstack/react-query"

function JobCard({ job }) {
  return (
    <Link
      to={`/jobs/${job.id}`}
      className="bg-white border border-blue-100 rounded-lg p-6 hover:border-blue-300 hover:shadow-md hover:bg-blue-50 transition-all group flex flex-col h-full"
    >
      <div className="flex items-start gap-4 mb-4">
        <div
          className="w-14 h-14 rounded-lg flex items-center justify-center text-white text-base font-bold flex-shrink-0 shadow-sm"
          style={{ backgroundColor: job.company_color || "#6d28d9" }}
        >
          {job.company_initials || job.company?.slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors text-base leading-tight line-clamp-2">
            {job.title}
          </h3>
          <p className="text-base text-blue-600 mt-1 font-semibold">{job.company}</p>
        </div>
      </div>

      {job.salary_min && job.salary_max && (
        <div className="mb-4 pb-4 border-b border-blue-100">
          <p className="text-xs text-gray-500 mb-1">טווח שכר</p>
          <div className="text-xl font-bold text-blue-700">
            ₪{job.salary_min.toLocaleString("he-IL")} – ₪{job.salary_max.toLocaleString("he-IL")}
          </div>
        </div>
      )}

      {job.location && (
        <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
          <span>📍</span>
          <span className="font-semibold">{job.location}</span>
        </div>
      )}

      {job.category && (
        <div className="mb-3">
          <span className="inline-block px-2.5 py-1 rounded-lg bg-blue-100 border border-blue-300 text-blue-700 text-xs font-semibold">
            {job.category}
          </span>
        </div>
      )}

      <p className="text-sm text-gray-600 line-clamp-2 flex-1 leading-relaxed">{job.description}</p>
    </Link>
  )
}

export default function RecommendedJobs() {
  const [selectedCity, setSelectedCity] = React.useState("תל אביב")

  React.useEffect(() => {
    const city = localStorage.getItem("selectedCity") || "תל אביב"

    setSelectedCity(city)
  }, [])

  const { data: jobs = [] } = useQuery({
    queryKey: ["recommended-jobs", selectedCity],
    queryFn: async () => {
      const openJobs = await publicJobService.list({
        is_closed: false,
        sort: "created_date",
        order: "DESC",
        limit: 100,
      })

      // Sort by proximity to selected city
      return openJobs
        .sort((a, b) => {
          const aMatch = a.location?.toLowerCase() === selectedCity.toLowerCase() ? 0 : 1

          const bMatch = b.location?.toLowerCase() === selectedCity.toLowerCase() ? 0 : 1

          return aMatch - bMatch
        })
        .slice(0, 6)
    },
    initialData: [],
  })

  return (
    <div className="bg-white border-t border-blue-100">
      <div className="max-w-[1200px] mx-auto px-4 py-12" dir="rtl">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">משרות שיכולות להתאים לך</h2>
          <Link
            to="/jobs"
            className="text-blue-600 text-sm hover:text-blue-700 transition-colors font-medium inline-flex items-center gap-1"
          >
            לכל המשרות
            <span>←</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </div>
    </div>
  )
}
