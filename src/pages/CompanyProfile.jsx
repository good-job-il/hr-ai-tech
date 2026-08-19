import { useState } from "react"
import { useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { companyService } from "@/api/services/companyService"
import { publicJobService } from "@/api/services/publicJobService"
import { useAuth } from "@/lib/AuthContext"

function StarRating({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" onClick={() => onChange && onChange(i)}>
          <Star
            className={`w-5 h-5 ${i <= value ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`}
          />
        </button>
      ))}
    </div>
  )
}

export default function CompanyProfile() {
  const { id } = useParams()

  const { user } = useAuth()

  const queryClient = useQueryClient()

  const [showReviewForm, setShowReviewForm] = useState(false)

  const [reviewForm, setReviewForm] = useState({
    rating_overall: 0,
    rating_salary: 0,
    rating_management: 0,
    rating_worklife: 0,
    title: "",
    pros: "",
    cons: "",
    is_anonymous: false,
  })

  const { data: company } = useQuery({
    queryKey: ["company", id],
    queryFn: () => companyService.get(Number(id)),
  })

  const { data: jobs = [] } = useQuery({
    queryKey: ["company-jobs", id],
    queryFn: async () =>
      (await publicJobService.list({ search: company?.name, is_closed: false, limit: 100 })).filter(
        (job) => job.company === company?.name,
      ),
    enabled: !!company,
  })

  const { data: reviews = [] } = useQuery({
    queryKey: ["company-reviews", id],
    queryFn: () => companyService.reviews(Number(id)),
  })

  const submitReview = useMutation({
    mutationFn: (data) =>
      companyService.createReview(Number(id), {
        ...data,
        company_name: company?.name,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-reviews"] })
      setShowReviewForm(false)
    },
  })

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating_overall, 0) / reviews.length).toFixed(1)
    : null

  if (!company) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#eaf7fb" }} dir="rtl">
        <Navbar />

        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-hhblue rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#eaf7fb" }} dir="rtl">
      <SEOHead
        title={`${company?.name || "חברה"} - דרושים ופרטים`}
        description={`${company?.name} - ${company?.industry || "חברה"} בישראל. ${company?.job_count || 0} משרות פתוחות. ללא ודא עם HeadHunter.`}
        keywords={`${company?.name}, ${company?.industry || ""}, משרות, דרושים, חברה`}
        canonical={`https://headhunter.co.il/companies/${company?.id}`}
      />

      <Navbar />

      <div className="max-w-[900px] mx-auto px-4 py-6">
        <Link
          to="/companies"
          className="text-hhblue hover:underline text-sm flex items-center gap-1 mb-5"
        >
          <ArrowRight className="w-4 h-4" /> חזרה לחברות
        </Link>

        {/* Company header */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-4">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: company.color || "#3da8c8" }}
            >
              {company.initials || company.name?.slice(0, 2)}
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>

              <div className="text-gray-500 text-sm mt-0.5">{company.industry}</div>

              {avgRating && (
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />

                  <span className="font-semibold text-sm">{avgRating}</span>

                  <span className="text-gray-400 text-xs">({reviews.length} ביקורות)</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Company profile enriched with culture and benefits */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-4">
          <h2 className="font-semibold text-gray-900 mb-3">🌟 על החברה</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">תרבות החברה</h3>

              <p className="text-sm text-gray-600">סביבה יצירתית ותומכת, הערכת עובדים וחדשנות</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">הטבות</h3>

              <p className="text-sm text-gray-600">ביטוח בריאות, ימי עבודה גמישים, פיתוח מקצועי</p>
            </div>
          </div>
        </div>

        {/* Jobs */}
        {jobs.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-4">
            <h2 className="font-semibold text-gray-900 mb-3">{jobs.length} משרות פתוחות</h2>

            <div className="space-y-2">
              {jobs.map((j) => (
                <Link
                  key={j.id}
                  to={`/jobs/${j.id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900 group-hover:text-hhblue">
                      {j.title}
                    </div>

                    <div className="text-xs text-gray-400 mt-0.5">{j.location}</div>
                  </div>

                  {j.salary_min && (
                    <div className="text-xs text-green-600 font-medium">
                      ₪{j.salary_min.toLocaleString()}+
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-900">ביקורות עובדים</h2>

            {user && !showReviewForm && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="flex items-center gap-1 text-hhblue text-sm hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> כתוב ביקורת
              </button>
            )}
          </div>

          {showReviewForm && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                submitReview.mutate(reviewForm)
              }}
              className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3"
            >
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">דירוג כללי</label>

                <StarRating
                  value={reviewForm.rating_overall}
                  onChange={(v) => setReviewForm((f) => ({ ...f, rating_overall: v }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  ["rating_salary", "שכר ותגמולים"],
                  ["rating_management", "ניהול"],
                  ["rating_worklife", "איזון עבודה-חיים"],
                ].map(([key, label]) => (
                  <div key={key}>
                    <label className="text-xs text-gray-500 block mb-1">{label}</label>

                    <StarRating
                      value={reviewForm[key]}
                      onChange={(v) => setReviewForm((f) => ({ ...f, [key]: v }))}
                    />
                  </div>
                ))}
              </div>

              <input
                value={reviewForm.title}
                onChange={(e) => setReviewForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="כותרת הביקורת"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30"
              />

              <textarea
                value={reviewForm.pros}
                onChange={(e) => setReviewForm((f) => ({ ...f, pros: e.target.value }))}
                placeholder="יתרונות"
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none resize-none"
              />

              <textarea
                value={reviewForm.cons}
                onChange={(e) => setReviewForm((f) => ({ ...f, cons: e.target.value }))}
                placeholder="חסרונות"
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none resize-none"
              />

              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reviewForm.is_anonymous}
                  onChange={(e) => setReviewForm((f) => ({ ...f, is_anonymous: e.target.checked }))}
                />
                פרסם בעילום שם
              </label>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="flex-1 border border-gray-200 py-2 rounded-lg text-sm"
                >
                  ביטול
                </button>

                <button
                  type="submit"
                  disabled={!reviewForm.rating_overall || submitReview.isPending}
                  className="flex-1 bg-hhblue text-white py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  {submitReview.isPending ? "שולח..." : "פרסם"}
                </button>
              </div>
            </form>
          )}

          {reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              אין ביקורות עדיין. היה הראשון לכתוב!
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="border-b border-gray-50 pb-3 last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-medium text-sm text-gray-900">{r.reviewer_name}</div>

                    <StarRating value={r.rating_overall} />
                  </div>

                  {r.title && (
                    <div className="text-sm font-medium text-gray-700 mb-1">{r.title}</div>
                  )}

                  {r.pros && <div className="text-xs text-green-700 mb-0.5">✓ {r.pros}</div>}

                  {r.cons && <div className="text-xs text-red-600">✗ {r.cons}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
