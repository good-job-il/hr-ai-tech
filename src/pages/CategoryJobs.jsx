import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { httpClient } from "@/api/client/httpClient"

const CATEGORIES = [
  "פיתוח תוכנה",
  "עיצוב",
  "שיווק",
  "מכירות",
  "כספים",
  "HR",
  "הנדסה",
  "רפואה",
  "חינוך",
  "לוגיסטיקה",
  "ניהול",
  "משפטים",
  "אדמיניסטרציה",
]

const CITIES = [
  "תל אביב",
  "ירושלים",
  "חיפה",
  "ראשון לציון",
  "פתח תקווה",
  "נתניה",
  "באר שבע",
  "הרצליה",
  "כפר סבא",
  "רעננה",
]

export default function CategoryJobs() {
  const { category } = useParams()

  const decodedCategory = decodeURIComponent(category)

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["category-jobs", decodedCategory],
    queryFn: async () => {
      const allJobs = await httpClient.get("/jobs?sort=created_date&order=DESC&limit=500", {
        cache: false,
      })

      const arr = Array.isArray(allJobs) ? allJobs : allJobs?.data || []

      return arr.filter((j) => !j.is_closed && j.category === decodedCategory)
    },
  })

  const seoTitle = `דרושים ${decodedCategory} | משרות ${decodedCategory} בישראל | HeadHunter`

  const seoDesc = `${jobs.length} משרות ${decodedCategory} פתוחות בישראל. חפשו עבודה ב${decodedCategory} - HeadHunter פלטפורמת הדרושים המובילה. משרות מלאות, חלקיות ומרחוק.`

  const canonical = `https://headhunter.co.il/jobs/category/${encodeURIComponent(decodedCategory)}`

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-background via-[#1a1f35] to-background"
      dir="rtl"
    >
      <SEOHead
        title={seoTitle}
        description={seoDesc}
        canonical={canonical}
        keywords={`דרושים ${decodedCategory}, משרות ${decodedCategory}, עבודה ${decodedCategory}, ${decodedCategory} ישראל`}
        schemaData={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "בית", item: "https://headhunter.co.il/" },
            {
              "@type": "ListItem",
              position: 2,
              name: "משרות",
              item: "https://headhunter.co.il/jobs",
            },
            {
              "@type": "ListItem",
              position: 3,
              name: `דרושים ${decodedCategory}`,
              item: canonical,
            },
          ],
        }}
      />

      <Navbar />

      <div className="max-w-[1200px] mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-400 mb-6 flex items-center gap-2">
          <Link to="/" className="hover:text-cyan-300 transition-colors">
            בית
          </Link>

          <span>/</span>

          <Link to="/jobs" className="hover:text-cyan-300 transition-colors">
            משרות
          </Link>

          <span>/</span>

          <span className="text-cyan-300">{decodedCategory}</span>
        </nav>

        <div className="mb-10">
          <h1
            className="text-4xl md:text-5xl font-bold mb-3"
            style={{
              background: "linear-gradient(to right, #67e8f9, #d8b4fe)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            דרושים {decodedCategory}
          </h1>

          <p className="text-gray-400 text-lg">
            {isLoading ? "טוען..." : `${jobs.length} משרות פתוחות בתחום ${decodedCategory}`}
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-600" />

            <p className="text-lg">לא נמצאו משרות בתחום {decodedCategory} כרגע</p>

            <Link to="/jobs" className="mt-4 inline-block text-cyan-300 hover:text-purple-300">
              חפש בכל התחומים →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <Link
                key={job.id}
                to={`/jobs/${job.id}`}
                className="group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/15 hover:border-purple-500/60 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300 flex flex-col"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
                    style={{ backgroundColor: job.company_color || "#6d28d9" }}
                  >
                    {job.company_initials || job.company?.slice(0, 2)}
                  </div>

                  <div>
                    <h2 className="font-bold text-white group-hover:text-cyan-300 transition-colors text-lg leading-tight">
                      {job.title}
                    </h2>

                    <p className="text-cyan-300 text-sm mt-0.5">{job.company}</p>
                  </div>
                </div>

                {job.salary_min && job.salary_max && (
                  <div className="text-xl font-bold text-cyan-300 mb-3">
                    ₪{job.salary_min.toLocaleString("he-IL")} – ₪
                    {job.salary_max.toLocaleString("he-IL")}
                  </div>
                )}

                {job.location && (
                  <div className="text-sm text-gray-400 mt-auto">📍 {job.location}</div>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Internal linking - by city for this category */}
        <div className="mt-16 border-t border-white/10 pt-10">
          <h2 className="text-xl font-bold text-white mb-6">{decodedCategory} לפי עיר</h2>

          <div className="flex flex-wrap gap-3 mb-10">
            {CITIES.map((c) => (
              <Link
                key={c}
                to={`/jobs/city/${encodeURIComponent(c)}`}
                className="px-4 py-2 bg-white/5 border border-white/15 rounded-lg text-gray-300 hover:text-cyan-300 hover:border-cyan-500/30 transition-all text-sm"
              >
                {decodedCategory} ב{c}
              </Link>
            ))}
          </div>

          <h2 className="text-xl font-bold text-white mb-6">תחומים נוספים</h2>

          <div className="flex flex-wrap gap-3">
            {CATEGORIES.filter((c) => c !== decodedCategory).map((c) => (
              <Link
                key={c}
                to={`/jobs/category/${encodeURIComponent(c)}`}
                className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-300 hover:text-white hover:border-purple-500/50 transition-all text-sm"
              >
                דרושים {c}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
import { Link } from "react-router-dom"
import { Briefcase } from "lucide-react"
import Navbar from "@/components/home/Navbar"
import SEOHead from "@/components/SEOHead"
