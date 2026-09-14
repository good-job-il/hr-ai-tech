import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ExternalLink,
  Gift,
  Globe2,
  MapPin,
  Plus,
  Sparkles,
  Star,
  Users,
} from "lucide-react"
import { companyService } from "@/api/services/companyService"
import { publicJobService } from "@/api/services/publicJobService"
import { useAuth } from "@/lib/AuthContext"
import Navbar from "@/components/home/Navbar"
import LandingFooter from "@/components/home/LandingFooter"
import SEOHead from "@/components/SEOHead"
import "./Home.css"
import "./CompanyProfile.css"

const content = {
  en: {
    back: "Back to companies",
    hiring: "Actively hiring",
    reviews: "reviews",
    openRoles: "Open positions",
    rating: "Employee rating",
    verified: "Trusted employer",
    about: "About the company",
    culture: "Company culture",
    cultureText: "A collaborative environment focused on employee growth and innovation.",
    benefits: "Benefits",
    benefitsText: "Flexible work, professional development and employee wellbeing.",
    jobsTitle: "Open opportunities",
    jobsText: "Explore the latest roles available at this company.",
    noJobs: "There are no open roles at this company right now.",
    viewRole: "View role",
    reviewsTitle: "Employee reviews",
    writeReview: "Write a review",
    noReviews: "No reviews yet. Be the first to share your experience.",
    overall: "Overall rating",
    salary: "Salary and benefits",
    management: "Management",
    worklife: "Work-life balance",
    reviewTitle: "Review title",
    pros: "What worked well?",
    cons: "What could be improved?",
    anonymous: "Publish anonymously",
    cancel: "Cancel",
    submit: "Publish review",
    submitting: "Publishing...",
    anonymousUser: "Anonymous employee",
    visitWebsite: "Visit website",
    exploreJobs: "Explore open roles",
    loading: "Loading company profile...",
    notFound: "Company profile is unavailable",
  },
  he: {
    back: "חזרה לחברות",
    hiring: "מגייסים עכשיו",
    reviews: "ביקורות",
    openRoles: "משרות פתוחות",
    rating: "דירוג עובדים",
    verified: "מעסיק אמין",
    about: "על החברה",
    culture: "תרבות החברה",
    cultureText: "סביבה שיתופית המתמקדת בצמיחת עובדים ובחדשנות.",
    benefits: "הטבות",
    benefitsText: "עבודה גמישה, פיתוח מקצועי ודאגה לרווחת העובדים.",
    jobsTitle: "הזדמנויות פתוחות",
    jobsText: "גלו את המשרות העדכניות הזמינות בחברה.",
    noJobs: "אין כרגע משרות פתוחות בחברה זו.",
    viewRole: "לפרטי המשרה",
    reviewsTitle: "ביקורות עובדים",
    writeReview: "כתבו ביקורת",
    noReviews: "אין ביקורות עדיין. היו הראשונים לשתף מהחוויה שלכם.",
    overall: "דירוג כללי",
    salary: "שכר והטבות",
    management: "ניהול",
    worklife: "איזון עבודה וחיים",
    reviewTitle: "כותרת הביקורת",
    pros: "מה עבד טוב?",
    cons: "מה אפשר לשפר?",
    anonymous: "פרסום בעילום שם",
    cancel: "ביטול",
    submit: "פרסום ביקורת",
    submitting: "מפרסם...",
    anonymousUser: "עובד אנונימי",
    visitWebsite: "לאתר החברה",
    exploreJobs: "לכל המשרות",
    loading: "טוען את פרופיל החברה...",
    notFound: "פרופיל החברה אינו זמין",
  },
}

function StarRating({ value, onChange, label }) {
  return (
    <div className="company-profile-stars" aria-label={label}>
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          key={rating}
          type="button"
          onClick={() => onChange?.(rating)}
          disabled={!onChange}
          aria-label={onChange ? `${rating} of 5` : undefined}
        >
          <Star className={rating <= value ? "is-active" : ""} />
        </button>
      ))}
    </div>
  )
}

export default function CompanyProfile() {
  const { id } = useParams()

  const { user } = useAuth()

  const { i18n } = useTranslation()

  const queryClient = useQueryClient()

  const isEnglish = i18n.language?.startsWith("en")

  const copy = content[isEnglish ? "en" : "he"]

  const BackArrow = isEnglish ? ArrowLeft : ArrowRight

  const ForwardArrow = isEnglish ? ArrowRight : ArrowLeft

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

  const { data: company, isLoading, isError } = useQuery({
    queryKey: ["company", id],
    queryFn: () => companyService.get(Number(id)),
  })

  const { data: jobs = [] } = useQuery({
    queryKey: ["company-jobs", id],
    queryFn: async () =>
      publicJobService.list({
        employer_company_id: Number(id),
        is_closed: false,
        sort: "created_date",
        order: "DESC",
        limit: 100,
      }),
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
      queryClient.invalidateQueries({ queryKey: ["company-reviews", id] })
      setShowReviewForm(false)
    },
  })

  const avgRating = reviews.length
    ? (reviews.reduce((sum, review) => sum + review.rating_overall, 0) / reviews.length).toFixed(1)
    : null

  if (isLoading || !company) {
    return (
      <div className="headhunter-home company-profile-page" dir={isEnglish ? "ltr" : "rtl"}>
        <Navbar />
        <main className="company-profile-state">
          {isError ? (
            <>
              <Building2 />
              <h1>{copy.notFound}</h1>
              <Link to="/companies">{copy.back}</Link>
            </>
          ) : (
            <>
              <span className="company-profile-loader" />
              <p>{copy.loading}</p>
            </>
          )}
        </main>
        <LandingFooter />
      </div>
    )
  }

  const jobCount = jobs.length || company.job_count || 0

  return (
    <div className="headhunter-home company-profile-page" dir={isEnglish ? "ltr" : "rtl"}>
      <SEOHead
        title={`${company.name} | HeadHunter`}
        description={`${company.name} — ${company.industry || "company"} in Israel. ${jobCount} open positions.`}
        keywords={`${company.name}, ${company.industry || ""}, jobs, careers, company`}
        canonical={`https://headhunter.co.il/companies/${company.id}`}
      />
      <Navbar />

      <main>
        <section className="company-profile-hero">
          <div className="company-profile-shell">
            <Link to="/companies" className="company-profile-back">
              <BackArrow />
              {copy.back}
            </Link>

            <div className="company-profile-identity">
              <div
                className="company-profile-logo"
                style={{
                  background: company.logo_url
                    ? "#fff"
                    : `linear-gradient(145deg, ${company.color || "#8a31f3"}, #2f9cf4)`,
                }}
              >
                {company.logo_url ? (
                  <img src={company.logo_url} alt="" />
                ) : (
                  company.initials || company.name?.slice(0, 2)
                )}
              </div>

              <div className="company-profile-heading">
                <span className="company-profile-hiring">
                  <Sparkles />
                  {copy.hiring}
                </span>
                <h1>{company.name}</h1>
                <p>{company.industry || (isEnglish ? "Growing company" : "חברה בצמיחה")}</p>
                {avgRating && (
                  <div className="company-profile-rating">
                    <Star />
                    <strong>{avgRating}</strong>
                    <span>({reviews.length} {copy.reviews})</span>
                  </div>
                )}
              </div>

              <div className="company-profile-actions">
                {jobCount > 0 && (
                  <a href="#open-roles" className="company-profile-primary-action">
                    <BriefcaseBusiness />
                    {copy.exploreJobs}
                  </a>
                )}
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="company-profile-secondary-action"
                  >
                    <Globe2 />
                    {copy.visitWebsite}
                    <ExternalLink />
                  </a>
                )}
              </div>
            </div>

            <div className="company-profile-metrics">
              <div>
                <BriefcaseBusiness />
                <strong>{jobCount}</strong>
                <span>{copy.openRoles}</span>
              </div>
              <div>
                <Star />
                <strong>{avgRating || "—"}</strong>
                <span>{copy.rating}</span>
              </div>
              <div>
                <CheckCircle2 />
                <strong>100%</strong>
                <span>{copy.verified}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="company-profile-content">
          <div className="company-profile-shell company-profile-layout">
            <div className="company-profile-main">
              <article className="company-profile-card company-profile-about">
                <span className="company-profile-kicker">{copy.about}</span>
                <h2>{company.name}</h2>
                <div className="company-profile-about-grid">
                  <div>
                    <Users />
                    <h3>{copy.culture}</h3>
                    <p>{copy.cultureText}</p>
                  </div>
                  <div>
                    <Gift />
                    <h3>{copy.benefits}</h3>
                    <p>{copy.benefitsText}</p>
                  </div>
                </div>
              </article>

              <section id="open-roles" className="company-profile-card company-profile-jobs">
                <div className="company-profile-section-heading">
                  <div>
                    <span>{copy.openRoles}</span>
                    <h2>{copy.jobsTitle}</h2>
                    <p>{copy.jobsText}</p>
                  </div>
                  <BriefcaseBusiness />
                </div>

                {jobs.length > 0 ? (
                  <div className="company-profile-job-list">
                    {jobs.map((job) => (
                      <Link key={job.id} to={`/jobs/${job.id}`} className="company-profile-job">
                        <div>
                          <h3>{job.title}</h3>
                          <p>
                            <MapPin />
                            {job.location || (isEnglish ? "Israel" : "ישראל")}
                          </p>
                        </div>
                        {job.salary_min && (
                          <strong>₪{job.salary_min.toLocaleString()}+</strong>
                        )}
                        <span>
                          {copy.viewRole}
                          <ForwardArrow />
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="company-profile-no-jobs">{copy.noJobs}</div>
                )}
              </section>

              <section className="company-profile-card company-profile-reviews">
                <div className="company-profile-section-heading">
                  <div>
                    <span>{copy.reviewsTitle}</span>
                    <h2>{copy.reviewsTitle}</h2>
                  </div>
                  {user && !showReviewForm && (
                    <button type="button" onClick={() => setShowReviewForm(true)}>
                      <Plus />
                      {copy.writeReview}
                    </button>
                  )}
                </div>

                {showReviewForm && (
                  <form
                    className="company-profile-review-form"
                    onSubmit={(event) => {
                      event.preventDefault()
                      submitReview.mutate(reviewForm)
                    }}
                  >
                    <div>
                      <label>{copy.overall}</label>
                      <StarRating
                        value={reviewForm.rating_overall}
                        label={copy.overall}
                        onChange={(value) =>
                          setReviewForm((form) => ({ ...form, rating_overall: value }))
                        }
                      />
                    </div>

                    <div className="company-profile-rating-grid">
                      {[
                        ["rating_salary", copy.salary],
                        ["rating_management", copy.management],
                        ["rating_worklife", copy.worklife],
                      ].map(([key, label]) => (
                        <div key={key}>
                          <label>{label}</label>
                          <StarRating
                            value={reviewForm[key]}
                            label={label}
                            onChange={(value) =>
                              setReviewForm((form) => ({ ...form, [key]: value }))
                            }
                          />
                        </div>
                      ))}
                    </div>

                    <input
                      value={reviewForm.title}
                      onChange={(event) =>
                        setReviewForm((form) => ({ ...form, title: event.target.value }))
                      }
                      placeholder={copy.reviewTitle}
                    />
                    <textarea
                      value={reviewForm.pros}
                      onChange={(event) =>
                        setReviewForm((form) => ({ ...form, pros: event.target.value }))
                      }
                      placeholder={copy.pros}
                      rows={3}
                    />
                    <textarea
                      value={reviewForm.cons}
                      onChange={(event) =>
                        setReviewForm((form) => ({ ...form, cons: event.target.value }))
                      }
                      placeholder={copy.cons}
                      rows={3}
                    />
                    <label className="company-profile-checkbox">
                      <input
                        type="checkbox"
                        checked={reviewForm.is_anonymous}
                        onChange={(event) =>
                          setReviewForm((form) => ({
                            ...form,
                            is_anonymous: event.target.checked,
                          }))
                        }
                      />
                      <span />
                      {copy.anonymous}
                    </label>
                    <div className="company-profile-form-actions">
                      <button type="button" onClick={() => setShowReviewForm(false)}>
                        {copy.cancel}
                      </button>
                      <button
                        type="submit"
                        disabled={!reviewForm.rating_overall || submitReview.isPending}
                      >
                        {submitReview.isPending ? copy.submitting : copy.submit}
                      </button>
                    </div>
                  </form>
                )}

                {reviews.length === 0 ? (
                  <div className="company-profile-empty-reviews">{copy.noReviews}</div>
                ) : (
                  <div className="company-profile-review-list">
                    {reviews.map((review) => (
                      <article key={review.id}>
                        <div>
                          <strong>{review.reviewer_name || copy.anonymousUser}</strong>
                          <StarRating value={review.rating_overall} label={copy.overall} />
                        </div>
                        {review.title && <h3>{review.title}</h3>}
                        {review.pros && <p className="is-positive">✓ {review.pros}</p>}
                        {review.cons && <p className="is-negative">✗ {review.cons}</p>}
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  )
}
