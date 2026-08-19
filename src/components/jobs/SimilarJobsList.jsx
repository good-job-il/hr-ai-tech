import { useQuery } from "@tanstack/react-query"
import { publicWorkflowService } from "@/api/services/publicWorkflowService"

export default function SimilarJobsList({ jobId, title }) {
  const { data: recommendations = [], isLoading } = useQuery({
    queryKey: ["similar-jobs", jobId],
    queryFn: async () => {
      const res = await publicWorkflowService.similarJobs(Number(jobId), 4)

      return res.recommendations
    },
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
      </div>
    )
  }

  if (recommendations.length === 0) {
    return null
  }

  return (
    <div className="mt-12" dir="rtl">
      <h2 className="text-xl font-bold text-gray-900 mb-4">משרות דומות</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.map((job) => (
          <Link
            key={job.id}
            to={`/jobs/${job.id}`}
            className="group border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all hover:border-purple-300"
          >
            {/* Company Header */}
            <div className="flex items-start gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-white font-semibold text-sm"
                style={{ backgroundColor: job.company_color }}
              >
                {job.company_initials || "ח"}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition">
                  {job.title}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">{job.company}</p>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <span>📍</span>
                <span>{job.location}</span>
              </div>

              {job.salary_min && job.salary_max && (
                <div className="flex items-center gap-2 text-green-700 font-semibold">
                  <span>💰</span>
                  <span>
                    ₪{(job.salary_min / 1000).toFixed(0)}k - ₪{(job.salary_max / 1000).toFixed(0)}k
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 text-gray-600">
                <span>🏢</span>
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                  {job.category || "כללי"}
                </span>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-3 flex items-center gap-2 text-purple-600 font-semibold group-hover:translate-x-1 transition">
              <span>צפה בפרטים</span>
              <ArrowLeft className="w-4 h-4" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
