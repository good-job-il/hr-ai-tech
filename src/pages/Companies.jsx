import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react"
import { companyService } from "@/api/services/companyService"
import Navbar from "@/components/home/Navbar"
import LandingFooter from "@/components/home/LandingFooter"
import SEOHead from "@/components/SEOHead"
import "./Home.css"
import "./Companies.css"

const pageContent = {
  en: {
    seoTitle: "Leading companies hiring in Israel | HeadHunter",
    seoDescription: "Explore trusted companies and their latest open roles on HeadHunter.",
    eyebrow: "Companies hiring now",
    title: "Find the company",
    accent: "where you belong",
    description:
      "Explore trusted employers, learn what they do and discover their latest open opportunities.",
    back: "Back to home",
    companies: "Hiring companies",
    openRoles: "Open positions",
    trusted: "Trusted employers",
    sectionEyebrow: "Explore employers",
    sectionTitle: "Companies building their next great teams",
    sectionText: "Browse active employers and open each profile to see available opportunities.",
    role: "open role",
    roles: "open roles",
    noRoles: "No open roles right now",
    viewCompany: "View company",
    emptyTitle: "No companies found",
    emptyText: "New employer profiles will appear here as soon as they become available.",
  },
  he: {
    seoTitle: "חברות מובילות שמגייסות בישראל | HeadHunter",
    seoDescription: "גלו חברות אמינות ואת המשרות הפתוחות העדכניות שלהן ב־HeadHunter.",
    eyebrow: "חברות שמגייסות עכשיו",
    title: "מצאו את החברה",
    accent: "שמתאימה לכם",
    description: "גלו מעסיקים מובילים, הכירו את הפעילות שלהם ומצאו הזדמנויות פתוחות ועדכניות.",
    back: "חזרה לעמוד הבית",
    companies: "חברות מגייסות",
    openRoles: "משרות פתוחות",
    trusted: "מעסיקים אמינים",
    sectionEyebrow: "הכירו מעסיקים",
    sectionTitle: "חברות שבונות את הצוותים המובילים של המחר",
    sectionText: "עברו בין החברות הפעילות ופתחו כל פרופיל כדי לראות את ההזדמנויות הזמינות.",
    role: "משרה פתוחה",
    roles: "משרות פתוחות",
    noRoles: "אין משרות פתוחות כרגע",
    viewCompany: "לפרופיל החברה",
    emptyTitle: "לא נמצאו חברות",
    emptyText: "פרופילים חדשים של מעסיקים יופיעו כאן ברגע שיהיו זמינים.",
  },
}

function CompanyCard({ company, copy, isEnglish }) {
  const Arrow = isEnglish ? ArrowRight : ArrowLeft

  const jobCount = company.job_count || 0

  return (
    <Link to={`/companies/${company.id}`} className="company-card">
      <div className="company-card__top">
        <div
          className="company-card__logo"
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
        <span className={`company-card__status ${jobCount > 0 ? "is-active" : ""}`}>
          <span />
          {jobCount > 0 ? `${jobCount} ${jobCount === 1 ? copy.role : copy.roles}` : copy.noRoles}
        </span>
      </div>

      <div className="company-card__content">
        <h3>{company.name}</h3>
        <p>{company.industry || (isEnglish ? "Growing company" : "חברה בצמיחה")}</p>
      </div>

      <div className="company-card__footer">
        <span>{copy.viewCompany}</span>
        <Arrow />
      </div>
    </Link>
  )
}

export default function Companies() {
  const { i18n } = useTranslation()

  const isEnglish = i18n.language?.startsWith("en")

  const copy = pageContent[isEnglish ? "en" : "he"]

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["companies-all"],
    queryFn: () => companyService.list({ sort: "job_count", order: "DESC", limit: 50 }),
    initialData: [],
  })

  const openRoles = companies.reduce((total, company) => total + (company.job_count || 0), 0)

  const BackArrow = isEnglish ? ArrowLeft : ArrowRight

  return (
    <div className="headhunter-home companies-page" dir={isEnglish ? "ltr" : "rtl"}>
      <SEOHead title={copy.seoTitle} description={copy.seoDescription} />
      <Navbar />

      <main>
        <section className="companies-hero">
          <div className="companies-shell">
            <Link to="/" className="companies-back-link">
              <BackArrow />
              {copy.back}
            </Link>

            <div className="companies-hero__copy">
              <span className="companies-eyebrow">
                <Sparkles />
                {copy.eyebrow}
              </span>
              <h1>
                {copy.title}
                <span>{copy.accent}</span>
              </h1>
              <p>{copy.description}</p>
            </div>

            <div
              className="companies-metrics"
              aria-label={isEnglish ? "Company overview" : "סקירת חברות"}
            >
              <div>
                <Building2 />
                <strong>{companies.length}</strong>
                <span>{copy.companies}</span>
              </div>
              <div>
                <BriefcaseBusiness />
                <strong>{openRoles}</strong>
                <span>{copy.openRoles}</span>
              </div>
              <div>
                <ShieldCheck />
                <strong>100%</strong>
                <span>{copy.trusted}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="companies-list-section">
          <div className="companies-shell">
            <div className="companies-section-heading">
              <div>
                <span>{copy.sectionEyebrow}</span>
                <h2>{copy.sectionTitle}</h2>
                <p>{copy.sectionText}</p>
              </div>
              <Users />
            </div>

            {isLoading ? (
              <div
                className="companies-grid"
                aria-label={isEnglish ? "Loading companies" : "טוען חברות"}
              >
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div key={item} className="company-card company-card--loading">
                    <span />
                    <span />
                    <span />
                  </div>
                ))}
              </div>
            ) : companies.length > 0 ? (
              <div className="companies-grid">
                {companies.map((company) => (
                  <CompanyCard
                    key={company.id}
                    company={company}
                    copy={copy}
                    isEnglish={isEnglish}
                  />
                ))}
              </div>
            ) : (
              <div className="companies-empty">
                <Building2 />
                <h2>{copy.emptyTitle}</h2>
                <p>{copy.emptyText}</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  )
}
