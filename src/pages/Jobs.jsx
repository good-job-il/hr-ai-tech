import { useEffect, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { publicJobService } from "@/api/services/publicJobService"
import { publicWorkflowService } from "@/api/services/publicWorkflowService"
import { taxonomyService } from "@/api/services/taxonomyService"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import {
  ArrowLeft,
  BarChart2,
  Bookmark,
  Brain,
  Briefcase,
  Building2,
  Calendar,
  Check,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  LayoutGrid,
  List,
  MapPin,
  RotateCcw,
  Search,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Tag,
  TrendingUp,
  Wand2,
  X,
  Zap,
} from "lucide-react"
import SEOHead from "@/components/SEOHead"
import Navbar from "@/components/home/Navbar"
import LandingFooter from "@/components/home/LandingFooter"
import "./Home.css"
import "./Jobs.css"

const glass = {
  background: "rgba(255,255,255,0.78)",
  backdropFilter: "blur(28px)",
  WebkitBackdropFilter: "blur(28px)",
  border: "1px solid rgba(221,235,255,0.86)",
  borderRadius: 20,
  boxShadow: "0 28px 80px rgba(79,124,255,0.11), 0 3px 12px rgba(15,23,42,0.04)",
}

const PAGE_SIZE_OPTIONS = [15, 30, 50, 100]

const getPageNumber = (value) => Math.max(1, Number.parseInt(value || "1", 10) || 1)

const getPageSize = (value) => {
  const parsed = Number.parseInt(value || "15", 10)

  return PAGE_SIZE_OPTIONS.includes(parsed) ? parsed : 15
}

const footerContent = {
  en: {
    footerDescription:
      "Israel's smart recruitment platform. Connecting quality candidates with leading companies through AI.",
    footerColumns: [
      ["For Candidates", [["Search Jobs", "/jobs"], ["Personal Profile", "/register?type=candidate"], ["AI Matching", "/ai-career"], ["Resume", "/register?type=candidate"]]],
      ["For Companies", [["Post a Job", "/register?type=staffing_agency"], ["Find Candidates", "/register?type=staffing_agency"], ["AI Matching", "/ai-career"], ["Analytics", "/register?type=staffing_agency"]]],
      ["Company", [["About", "/about"], ["Careers", "/about"], ["Blog", "/blog"], ["Contact", "/contact"]]],
    ],
    support: "Support",
    supportLinks: [["Help Center", "/contact"], ["Guides", "/resources"], ["System Status", "/contact"], ["FAQ", "/resources"]],
    copyright: "© 2024 HeadHunter. All rights reserved.",
    terms: "Terms of Use",
    privacy: "Privacy Policy",
    language: "עברית",
  },
  he: {
    footerDescription:
      "פלטפורמת הגיוס החכמה של ישראל. מחברת מועמדים איכותיים עם חברות מובילות באמצעות AI.",
    footerColumns: [
      ["למועמדים", [["חיפוש משרות", "/jobs"], ["פרופיל אישי", "/register?type=candidate"], ["התאמות AI", "/ai-career"], ["קורות חיים", "/register?type=candidate"]]],
      ["לחברות", [["פרסום משרה", "/register?type=staffing_agency"], ["חיפוש מועמדים", "/register?type=staffing_agency"], ["התאמות AI", "/ai-career"], ["אנליטיקה", "/register?type=staffing_agency"]]],
      ["החברה", [["אודות", "/about"], ["קריירה", "/about"], ["בלוג", "/blog"], ["צור קשר", "/contact"]]],
    ],
    support: "תמיכה",
    supportLinks: [["מרכז עזרה", "/contact"], ["מדריכים", "/resources"], ["סטטוס המערכת", "/contact"], ["שאלות נפוצות", "/resources"]],
    copyright: "© 2024 HeadHunter. כל הזכויות שמורות.",
    terms: "תנאי שימוש",
    privacy: "מדיניות פרטיות",
    language: "English",
  },
}

function MatchBadge({ score }) {
  const { i18n } = useTranslation()

  const isRtl = !i18n.language?.startsWith("en")

  const high = score >= 90

  const label = high ? (isRtl ? "התאמה גבוהה" : "High match") : isRtl ? "התאמה טובה" : "Good match"

  return (
    <span
      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black"
      style={{
        background: high ? "rgba(16,185,129,0.10)" : "rgba(245,158,11,0.10)",
        color: high ? "#059669" : "#D97706",
        border: high ? "1px solid rgba(16,185,129,0.18)" : "1px solid rgba(245,158,11,0.18)",
      }}
    >
      <Sparkles className="w-3.5 h-3.5" />
      {label} {score}%
    </span>
  )
}

function Checkbox({ label, checked, onChange }) {
  return (
    <label className="jobs-checkbox">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="jobs-checkbox__control" aria-hidden="true">
        <Check />
      </span>
      <span>{label}</span>
    </label>
  )
}

function RadioButton({ name, label, value, checked, onChange }) {
  return (
    <label className="jobs-radio">
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} />
      <span className="jobs-radio__control" aria-hidden="true" />
      <span>{label}</span>
    </label>
  )
}

function FilterBlock({ title, open, onToggle, children }) {
  return (
    <div className="border-b border-[#E4ECFF] pb-5 mb-5">
      <button onClick={onToggle} className="w-full flex items-center justify-between mb-4">
        <span className="text-[14px] font-black text-[#0F172A]">{title}</span>

        {open ? (
          <ChevronUp className="w-4 h-4 text-[#7C3AED]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#94A3B8]" />
        )}
      </button>

      {open && <div className="space-y-1">{children}</div>}
    </div>
  )
}

function JobCard({ job }) {
  const { t, i18n } = useTranslation()

  const isRtl = !i18n.language?.startsWith("en")

  const initials = job.company_initials || (job.company || "").slice(0, 2) || "HR"

  const daysAgo = Math.max(
    0,
    Math.floor((Date.now() - new Date(job.created_date || Date.now())) / 86400000),
  )

  const typeLabel = isRtl
    ? { full: "משרה מלאה", part: "חלקית", remote: "מרחוק", daily: "יומי" }[job.type] || ""
    : { full: "Full-time", part: "Part-time", remote: "Remote", daily: "Daily" }[job.type] || ""

  const matchScore = 78 + (job.id?.charCodeAt?.(0) % 20 || 14)

  const isNew = daysAgo <= 3

  return (
    <article
      className="job-result-card group relative overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={glass}
    >
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-l from-[#A855F7] via-[#6C4DFF] to-[#2FB8FF] opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="absolute -top-24 -left-24 w-56 h-56 rounded-full bg-[#8B5CF6]/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="job-result-card__body p-7 relative">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-[58px] h-[58px] rounded-2xl flex items-center justify-center text-white text-[15px] font-black shadow-[0_18px_35px_rgba(108,77,255,0.25)]"
              style={{
                background: `linear-gradient(135deg, ${job.company_color || "#8B5CF6"}, #2F80FF)`,
              }}
            >
              {initials}
            </div>

            <div>
              <div className="flex flex-wrap gap-2">
                <MatchBadge score={matchScore} />

                {isNew && (
                  <span className="px-3 py-1.5 rounded-full text-xs font-black bg-[#EEF6FF] text-[#2F80FF] border border-[#DDEBFF]">
                    {isRtl ? "חדש" : "New"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <h3 className="job-result-card__title text-[22px] leading-[1.25] font-black text-[#0F172A] mb-2">
          {job.title}
        </h3>

        <p className="text-[15px] font-black text-[#7C3AED] mb-4">{job.company || "חברה מובילה"}</p>

        <div className="flex flex-wrap items-center gap-4 mb-5 text-[14px] font-bold text-[#64748B]">
          {job.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#60A5FA]" />

              {job.location}
            </span>
          )}

          {typeLabel && (
            <span className="flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-[#8B5CF6]" />

              {typeLabel}
            </span>
          )}

          {job.salary_min && job.salary_max && (
            <span className="text-[#0F172A]">
              ₪{job.salary_min?.toLocaleString(isRtl ? "he-IL" : "en-US")}–₪
              {job.salary_max?.toLocaleString(isRtl ? "he-IL" : "en-US")}
            </span>
          )}
        </div>

        {job.description && (
          <p className="text-[15px] leading-8 text-[#64748B] mb-5 line-clamp-2">
            {job.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mb-7">
          {job.category && (
            <span className="px-4 py-2 rounded-2xl bg-[#F3EFFF] text-[#7C3AED] border border-[#E2D8FF] text-xs font-black">
              {job.category}
            </span>
          )}

          <span className="px-4 py-2 rounded-2xl bg-[#F7FBFF] text-[#64748B] border border-[#E4ECFF] text-xs font-bold">
            הנדסת תוכנה
          </span>
        </div>

        <div className="job-result-card__footer flex items-center justify-between pt-5 border-t border-[#E4ECFF]">
          <span className="flex items-center gap-1.5 text-xs font-bold text-[#94A3B8]">
            <Calendar className="w-4 h-4" />

            {isRtl
              ? daysAgo === 0
                ? "היום"
                : daysAgo === 1
                  ? "אתמול"
                  : `לפני ${daysAgo} ימים`
              : daysAgo === 0
                ? "Today"
                : daysAgo === 1
                  ? "Yesterday"
                  : `${daysAgo} days ago`}
          </span>

          <div className="flex items-center gap-2">
            <button className="w-8 h-8 rounded-lg bg-white border border-[#E4ECFF] flex items-center justify-center text-[#94A3B8] hover:text-[#7C3AED]">
              <Bookmark className="w-3.5 h-3.5" />
            </button>

            <button className="w-8 h-8 rounded-lg bg-white border border-[#E4ECFF] flex items-center justify-center text-[#94A3B8] hover:text-[#7C3AED]">
              <Share2 className="w-3.5 h-3.5" />
            </button>

            <Link
              to={`/jobs/${job.id}`}
              className="inline-flex items-center gap-2 px-7 h-12 rounded-2xl text-white text-[15px] font-black"
              style={{
                background: "linear-gradient(135deg,#A855F7,#6C4DFF,#2F80FF)",
                boxShadow: "0 18px 42px rgba(108,77,255,0.32)",
              }}
            >
              {t("jobs.card.apply")}

              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}

export default function Jobs() {
  const { t, i18n } = useTranslation()

  const isRtl = !i18n.language?.startsWith("en")

  const [urlP] = useSearchParams()

  const urlSearch = urlP.toString()

  const navigate = useNavigate()

  const JOB_TYPES = [
    { value: "full", label: t("jobs.jobTypes.fullTime") },
    { value: "part", label: t("jobs.jobTypes.partTime") },
    { value: "remote", label: t("jobs.jobTypes.remote") },
    { value: "daily", label: isRtl ? "יומי" : "Daily" },
  ]

  const EXP_LEVELS = [
    { value: "0", label: isRtl ? "ללא ניסיון" : "No experience" },
    { value: "1-2", label: isRtl ? "1-2 שנות ניסיון" : "1-2 years experience" },
    { value: "3-5", label: isRtl ? "3-5 שנות ניסיון" : "3-5 years experience" },
    { value: "5+", label: isRtl ? "5+ שנות ניסיון" : "5+ years experience" },
  ]

  const WORK_MODES = [
    { value: "hybrid", label: isRtl ? "היברידי" : "Hybrid" },
    { value: "remote", label: isRtl ? "מהבית" : "Remote" },
    { value: "onsite", label: isRtl ? "במשרד" : "On-site" },
  ]

  const { data: domains = [] } = useQuery({
    queryKey: ["job-search-domains"],
    queryFn: () => taxonomyService.domains(),
    staleTime: 5 * 60 * 1000,
  })

  const [search, setSearch] = useState(urlP.get("search") || urlP.get("q") || "")

  const [loc, setLoc] = useState(urlP.get("location") || "")

  const [domainId, setDomainId] = useState(urlP.get("domain_id") || "")

  const [jobTypes, setJobTypes] = useState(urlP.getAll("type"))

  const [experienceLevel, setExperienceLevel] = useState(urlP.get("experience") || "")

  const [salaryMin, setSalaryMin] = useState(urlP.get("salary_min") || "")

  const [salaryMax, setSalaryMax] = useState(urlP.get("salary_max") || "")

  const [workMode, setWorkMode] = useState(urlP.get("work_mode") || "")

  const [viewMode, setViewMode] = useState("list")

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const [currentPage, setCurrentPage] = useState(getPageNumber(urlP.get("page")))

  const [pageSize, setPageSize] = useState(getPageSize(urlP.get("page_size")))

  const [openFilters, setOpenFilters] = useState({
    type: true,
    exp: true,
    salary: true,
    mode: true,
  })

  const toggle = (k) => setOpenFilters((f) => ({ ...f, [k]: !f[k] }))

  useEffect(() => {
    const params = new URLSearchParams(urlSearch)

    setSearch(params.get("search") || params.get("q") || "")
    setLoc(params.get("location") || "")
    setDomainId(params.get("domain_id") || "")
    setJobTypes(params.getAll("type"))
    setExperienceLevel(params.get("experience") || "")
    setSalaryMin(params.get("salary_min") || "")
    setSalaryMax(params.get("salary_max") || "")
    setWorkMode(params.get("work_mode") || "")
    setCurrentPage(getPageNumber(params.get("page")))
    setPageSize(getPageSize(params.get("page_size")))
  }, [urlSearch])

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: [
      "jobs",
      search,
      loc,
      domainId,
      jobTypes,
      experienceLevel,
      salaryMin,
      salaryMax,
      workMode,
    ],
    queryFn: async () => {
      const experienceRange = {
        "0": { min: 0, max: 0 },
        "1-2": { min: 1, max: 2 },
        "3-5": { min: 3, max: 5 },
        "5+": { min: 5, max: undefined },
      }[experienceLevel]

      if (
        search ||
        loc ||
        domainId ||
        jobTypes.length ||
        experienceLevel ||
        salaryMin ||
        salaryMax ||
        workMode
      ) {
        const r = await publicWorkflowService.searchJobs({
          query: search,
          filters: {
            type: jobTypes.length ? jobTypes : undefined,
            location: loc || undefined,
            domain_id: domainId ? Number(domainId) : undefined,
            salary_min: salaryMin ? Number(salaryMin) : undefined,
            salary_max: salaryMax ? Number(salaryMax) : undefined,
            experience_min: experienceRange?.min,
            experience_max: experienceRange?.max,
            work_mode: workMode || undefined,
          },
          type: "search",
          limit: 100,
        })

        return r.jobs || []
      }

      let all = await publicJobService.list({
        is_closed: false,
        sort: "created_date",
        order: "DESC",
        limit: 100,
      })

      if (jobTypes.length) {
        all = all.filter((j) => jobTypes.includes(j.type))
      }

      if (loc) {
        all = all.filter((j) => j.location?.toLowerCase().includes(loc.toLowerCase()))
      }

      return all
    },
    initialData: [],
  })

  const buildSearchPath = (
    searchTerm = search,
    {
      page = currentPage,
      size = pageSize,
      types = jobTypes,
      experience = experienceLevel,
      minimumSalary = salaryMin,
      maximumSalary = salaryMax,
      mode = workMode,
    } = {},
  ) => {
    const params = new URLSearchParams()

    if (searchTerm.trim()) {
      params.set("search", searchTerm.trim())
    }

    if (loc.trim()) {
      params.set("location", loc.trim())
    }

    if (domainId) {
      params.set("domain_id", domainId)
    }

    types.forEach((type) => params.append("type", type))

    if (experience) {
      params.set("experience", experience)
    }

    if (minimumSalary) {
      params.set("salary_min", minimumSalary)
    }

    if (maximumSalary) {
      params.set("salary_max", maximumSalary)
    }

    if (mode) {
      params.set("work_mode", mode)
    }

    params.set("page", String(page))
    params.set("page_size", String(size))

    const queryString = params.toString()

    return queryString ? `/jobs?${queryString}` : "/jobs"
  }

  const toggleType = (value) => {
    const nextTypes = jobTypes.includes(value)
      ? jobTypes.filter((type) => type !== value)
      : [...jobTypes, value]

    setJobTypes(nextTypes)
    navigate(buildSearchPath(search, { page: 1, types: nextTypes }))
  }

  const changeExperience = (value) => {
    const nextExperience = experienceLevel === value ? "" : value

    setExperienceLevel(nextExperience)
    navigate(buildSearchPath(search, { page: 1, experience: nextExperience }))
  }

  const changeWorkMode = (value) => {
    const nextMode = workMode === value ? "" : value

    setWorkMode(nextMode)
    navigate(buildSearchPath(search, { page: 1, mode: nextMode }))
  }

  const applySalaryFilters = () => {
    navigate(
      buildSearchPath(search, {
        page: 1,
        minimumSalary: salaryMin,
        maximumSalary: salaryMax,
      }),
    )
  }

  const handleSearch = () => navigate(buildSearchPath(search, { page: 1 }))

  const applyQuickSearch = (tag) => {
    setSearch(tag)
    navigate(buildSearchPath(tag, { page: 1 }))
  }

  const clearFilters = () => {
    setSearch("")
    setLoc("")
    setDomainId("")
    setJobTypes([])
    setExperienceLevel("")
    setSalaryMin("")
    setSalaryMax("")
    setWorkMode("")
    navigate(`/jobs?page=1&page_size=${pageSize}`)
  }

  const sortedJobs = [...jobs].sort((firstJob, secondJob) => {
    const firstTimestamp = Date.parse(
      firstJob.created_date || firstJob.created_at || firstJob.published_at || "",
    )

    const secondTimestamp = Date.parse(
      secondJob.created_date || secondJob.created_at || secondJob.published_at || "",
    )

    const safeFirstTimestamp = Number.isNaN(firstTimestamp) ? 0 : firstTimestamp

    const safeSecondTimestamp = Number.isNaN(secondTimestamp) ? 0 : secondTimestamp

    return safeSecondTimestamp - safeFirstTimestamp
  })

  const totalPages = Math.max(1, Math.ceil(sortedJobs.length / pageSize))

  const activePage = Math.min(currentPage, totalPages)

  const paginatedJobs = sortedJobs.slice((activePage - 1) * pageSize, activePage * pageSize)

  const visiblePages = Array.from({ length: totalPages }, (_, index) => index + 1)

  const goToPage = (page) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages)

    navigate(buildSearchPath(search, { page: nextPage }))
  }

  const changePageSize = (size) => {
    navigate(buildSearchPath(search, { page: 1, size }))
  }

  const jobsFooterCopy = footerContent[isRtl ? "he" : "en"]

  const changeLanguage = () => i18n.changeLanguage(isRtl ? "en" : "he")

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="headhunter-home jobs-page min-h-screen relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg,#F6FBFF 0%,#EEF6FF 46%,#F7FBFF 100%)",
      }}
    >
      <SEOHead
        title={search ? `"${search}" | HeadHunter` : "כל המשרות | HeadHunter"}
        description="חיפוש משרות בפלטפורמת גיוס מבוססת AI"
      />

      <div className="fixed top-[-220px] right-[-140px] w-[620px] h-[620px] rounded-full bg-[#8B5CF6]/15 blur-3xl pointer-events-none" />

      <div className="fixed top-[220px] left-[-180px] w-[620px] h-[620px] rounded-full bg-[#2FB8FF]/14 blur-3xl pointer-events-none" />

      <div className="fixed bottom-[-180px] right-[28%] w-[520px] h-[520px] rounded-full bg-[#6C4DFF]/10 blur-3xl pointer-events-none" />

      <Navbar />

      <main className="jobs-main relative z-10">
        <section className="jobs-intro text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/80 border border-[#DDEBFF] text-[#7C3AED] font-black shadow-[0_12px_30px_rgba(108,77,255,0.10)] mb-5">
            <Sparkles className="w-4 h-4" />

            {isRtl ? "פלטפורמת משרות מבוססת AI בישראל" : "AI-Powered Jobs Platform in Israel"}
          </div>

          <h1 className="jobs-title text-[58px] leading-[1.05] font-black text-[#0F172A] mb-5">
            {isRtl ? "משרות שמותאמות" : "Jobs tailored"}

            <span className="block bg-gradient-to-l from-[#8B5CF6] via-[#6C4DFF] to-[#2FB8FF] bg-clip-text text-transparent">
              {isRtl ? "בדיוק אליך" : "just for you"}
            </span>
          </h1>

          <p className="text-[20px] leading-9 text-[#64748B] max-w-[760px] mx-auto font-semibold">
            {isRtl
              ? "מצא את ההזדמנות הבאה שלך עם חיפוש חכם, התאמות AI, פילטרים מתקדמים וחוויית מועמד מדויקת."
              : "Find your next opportunity with smart search, AI matching, advanced filters and a precise candidate experience."}
          </p>
        </section>

        <section className="jobs-search-card" style={glass}>
          <div className="jobs-search-card__inner p-7">
            <div className="jobs-search-grid grid grid-cols-1 lg:grid-cols-[1.4fr_1fr_0.8fr_auto] gap-4">
              <div className="h-16 rounded-2xl bg-white border border-[#DDEBFF] flex items-center gap-3 px-5">
                <Search className="w-5 h-5 text-[#94A3B8]" />

                <input
                  type="text"
                  placeholder={t("jobs.searchPlaceholder")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full bg-transparent outline-none text-[15px] font-bold text-[#0F172A] placeholder:text-[#94A3B8]"
                />
              </div>

              <div className="h-16 rounded-2xl bg-white border border-[#DDEBFF] flex items-center gap-3 px-5">
                <MapPin className="w-5 h-5 text-[#94A3B8]" />

                <input
                  type="text"
                  placeholder={t("jobs.locationPlaceholder")}
                  value={loc}
                  onChange={(e) => setLoc(e.target.value)}
                  className="w-full bg-transparent outline-none text-[15px] font-bold text-[#0F172A] placeholder:text-[#94A3B8]"
                />
              </div>

              <div className="h-16 rounded-2xl bg-white border border-[#DDEBFF] flex items-center gap-3 px-5">
                <Tag className="w-5 h-5 text-[#94A3B8]" />

                <select
                  value={domainId}
                  className="w-full bg-transparent outline-none text-[15px] font-bold text-[#64748B]"
                  onChange={(e) => setDomainId(e.target.value)}
                >
                  <option value="">{isRtl ? "כל התחומים" : "All fields"}</option>

                  {domains.map((domain) => (
                    <option key={domain.domain_id} value={domain.domain_id}>
                      {domain.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleSearch}
                className="h-16 px-10 rounded-2xl text-white text-[16px] font-black flex items-center justify-center gap-3"
                style={{
                  background: "linear-gradient(135deg,#A855F7,#6C4DFF,#2F80FF)",
                  boxShadow: "0 18px 42px rgba(108,77,255,0.35)",
                }}
              >
                <Search className="w-5 h-5" />

                {t("jobs.searchButton")}
              </button>
            </div>

            <div className="jobs-quick-search flex flex-wrap gap-3 mt-5 justify-center">
              {(isRtl
                ? [
                    "אנליסט נתונים",
                    "מהנדס DevOps",
                    "מעצב UI/UX",
                    "מפתח Frontend",
                    "מפתח Full Stack",
                    "מפתח Backend",
                    "מוצר",
                    "שיווק דיגיטלי",
                  ]
                : [
                    "Data Analyst",
                    "DevOps Engineer",
                    "UI/UX Designer",
                    "Frontend Developer",
                    "Full Stack Developer",
                    "Backend Developer",
                    "Product",
                    "Digital Marketing",
                  ]
              ).map((tag) => (
                <button
                  key={tag}
                  onClick={() => applyQuickSearch(tag)}
                  className="px-5 py-2.5 rounded-full bg-white border border-[#DDEBFF] text-[#6C4DFF] text-sm font-black shadow-sm hover:shadow-md transition"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </section>

        <button
          type="button"
          className="jobs-mobile-filter-button"
          onClick={() => setMobileFiltersOpen((open) => !open)}
          aria-expanded={mobileFiltersOpen}
        >
          {mobileFiltersOpen ? <X /> : <SlidersHorizontal />}
          {mobileFiltersOpen
            ? isRtl
              ? "סגירת מסננים"
              : "Close filters"
            : t("jobs.filters.title")}
        </button>

        <div className="jobs-workspace">
          <aside
            className={`jobs-filters ${mobileFiltersOpen ? "jobs-filters--open" : ""}`}
            style={glass}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-[#0F172A] flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-[#7C3AED]" />

                  {t("jobs.filters.title")}
                </h3>

                <button onClick={clearFilters} className="text-[#94A3B8] text-sm font-bold flex items-center gap-1">
                  <RotateCcw className="w-4 h-4" />

                  {t("jobs.filters.clearAll")}
                </button>
              </div>

              <FilterBlock
                title={t("jobs.filters.jobType")}
                open={openFilters.type}
                onToggle={() => toggle("type")}
              >
                {JOB_TYPES.map((jt) => (
                  <Checkbox
                    key={jt.value}
                    label={jt.label}
                    checked={jobTypes.includes(jt.value)}
                    onChange={() => toggleType(jt.value)}
                  />
                ))}
              </FilterBlock>

              <FilterBlock
                title={t("jobs.filters.experience")}
                open={openFilters.exp}
                onToggle={() => toggle("exp")}
              >
                {EXP_LEVELS.map((e) => (
                  <RadioButton
                    key={e.value}
                    name="experience"
                    label={e.label}
                    value={e.value}
                    checked={experienceLevel === e.value}
                    onChange={() => changeExperience(e.value)}
                  />
                ))}
              </FilterBlock>

              <FilterBlock
                title={t("jobs.filters.salary")}
                open={openFilters.salary}
                onToggle={() => toggle("salary")}
              >
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    className="h-11 rounded-xl border border-[#DDEBFF] bg-white px-3 text-sm outline-none"
                    placeholder={isRtl ? "מינימום" : "Minimum"}
                    value={salaryMin}
                    onChange={(event) => setSalaryMin(event.target.value)}
                    onBlur={applySalaryFilters}
                    onKeyDown={(event) => event.key === "Enter" && applySalaryFilters()}
                  />

                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    className="h-11 rounded-xl border border-[#DDEBFF] bg-white px-3 text-sm outline-none"
                    placeholder={isRtl ? "מקסימום" : "Maximum"}
                    value={salaryMax}
                    onChange={(event) => setSalaryMax(event.target.value)}
                    onBlur={applySalaryFilters}
                    onKeyDown={(event) => event.key === "Enter" && applySalaryFilters()}
                  />
                </div>
              </FilterBlock>

              <FilterBlock
                title={isRtl ? "סידור עבודה" : "Work mode"}
                open={openFilters.mode}
                onToggle={() => toggle("mode")}
              >
                {WORK_MODES.map((mode) => (
                  <RadioButton
                    key={mode.value}
                    name="work-mode"
                    label={mode.label}
                    value={mode.value}
                    checked={workMode === mode.value}
                    onChange={() => changeWorkMode(mode.value)}
                  />
                ))}
              </FilterBlock>
            </div>
          </aside>

          <section className="jobs-results">
            <div className="jobs-results-toolbar flex items-center justify-between mb-6">
              <div>
                <h2 className="text-[26px] font-black text-[#0F172A]">
                  {isRtl ? `${jobs.length} משרות נמצאו` : `${jobs.length} jobs found`}
                </h2>

                <p className="text-[#64748B] font-semibold">
                  {isRtl ? "ממוינות לפי התאמה ורלוונטיות" : "Sorted by match and relevance"}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select className="h-12 rounded-2xl bg-white border border-[#DDEBFF] px-4 text-sm font-bold text-[#64748B] outline-none">
                  <option>{isRtl ? "תאריך פרסום" : "Publish date"}</option>

                  <option>{isRtl ? "רלוונטיות" : "Relevance"}</option>

                  <option>{isRtl ? "שכר גבוה לנמוך" : "Salary: High to Low"}</option>
                </select>

                <div className="h-12 rounded-2xl bg-white border border-[#DDEBFF] flex overflow-hidden">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`w-12 flex items-center justify-center ${viewMode === "list" ? "text-[#7C3AED] bg-[#F3EFFF]" : "text-[#94A3B8]"}`}
                  >
                    <List className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => setViewMode("grid")}
                    className={`w-12 flex items-center justify-center ${viewMode === "grid" ? "text-[#7C3AED] bg-[#F3EFFF]" : "text-[#94A3B8]"}`}
                  >
                    <LayoutGrid className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="h-[420px] flex flex-col items-center justify-center" style={glass}>
                <div className="w-16 h-16 rounded-full border-4 border-[#E4ECFF] border-t-[#7C3AED] animate-spin mb-5" />

                <p className="text-[#64748B] text-lg font-black">
                  {isRtl ? "AI מחפש משרות מתאימות..." : "AI is finding matching jobs..."}
                </p>
              </div>
            ) : jobs.length === 0 ? (
              <div
                className="h-[420px] flex flex-col items-center justify-center text-center"
                style={glass}
              >
                <Briefcase className="w-16 h-16 text-[#C4B5FD] mb-5" />

                <h3 className="text-2xl font-black text-[#0F172A] mb-2">{t("jobs.noJobs")}</h3>

                <p className="text-[#64748B] font-semibold">
                  {isRtl
                    ? "נסה לשנות את הסינון או מילת החיפוש"
                    : "Try adjusting your filters or search term"}
                </p>
              </div>
            ) : (
              <>
                <div
                  className={`grid gap-6 ${viewMode === "grid" ? "lg:grid-cols-2" : "grid-cols-1"}`}
                >
                  {paginatedJobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>

                <nav
                  className="jobs-pagination"
                  aria-label={isRtl ? "ניווט בין דפי משרות" : "Jobs pagination"}
                >
                  <div className="jobs-pagination__summary">
                    {isRtl
                      ? `מציגים ${(activePage - 1) * pageSize + 1}–${Math.min(activePage * pageSize, jobs.length)} מתוך ${jobs.length}`
                      : `Showing ${(activePage - 1) * pageSize + 1}–${Math.min(activePage * pageSize, jobs.length)} of ${jobs.length}`}
                  </div>

                  <div className="jobs-pagination__pages">
                    <button
                      type="button"
                      onClick={() => goToPage(activePage - 1)}
                      disabled={activePage === 1}
                      aria-label={isRtl ? "העמוד הקודם" : "Previous page"}
                    >
                      {isRtl ? <ChevronRight /> : <ChevronLeft />}
                    </button>

                    {visiblePages.map((page) => (
                      <button
                        type="button"
                        key={page}
                        onClick={() => goToPage(page)}
                        className={page === activePage ? "is-active" : ""}
                        aria-current={page === activePage ? "page" : undefined}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => goToPage(activePage + 1)}
                      disabled={activePage === totalPages}
                      aria-label={isRtl ? "העמוד הבא" : "Next page"}
                    >
                      {isRtl ? <ChevronLeft /> : <ChevronRight />}
                    </button>
                  </div>

                  <label className="jobs-pagination__size">
                    <span>{isRtl ? "משרות בעמוד" : "Jobs per page"}</span>
                    <select
                      value={pageSize}
                      onChange={(event) => changePageSize(Number(event.target.value))}
                    >
                      {PAGE_SIZE_OPTIONS.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </label>
                </nav>
              </>
            )}
          </section>

          <aside className="jobs-insights">
            <div style={glass} className="p-6">
              <h3 className="text-xl font-black text-[#0F172A] mb-5 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#7C3AED]" />

                {isRtl ? "משרות מומלצות עבורך" : "Recommended for you"}
              </h3>

              {sortedJobs.slice(0, 3).map((job) => (
                <div
                  key={job.id}
                  className="flex items-center gap-4 py-4 border-b border-[#E4ECFF] last:border-b-0"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#2F80FF] text-white flex items-center justify-center text-sm font-black">
                    {job.company_initials || (job.company || "HR").slice(0, 2)}
                  </div>

                  <div>
                    <Link to={`/jobs/${job.id}`} className="font-black text-[#0F172A] text-sm">
                      {job.title}
                    </Link>

                    <div className="text-[#64748B] text-xs font-bold">{job.company}</div>

                    <div className="text-[#7C3AED] text-xs font-black">
                      {job.location || (isRtl ? "ישראל" : "Israel")}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={glass} className="p-6">
              <h3 className="text-xl font-black text-[#0F172A] mb-5 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-[#2F80FF]" />
                {isRtl ? "תובנות שוק העבודה" : "Job market insights"}
              </h3>

              <div className="rounded-lg p-6 bg-gradient-to-br from-[#F3EFFF] to-[#EAF8FF] border border-[#DDEBFF]">
                <div className="text-[42px] leading-none font-black bg-gradient-to-l from-[#8B5CF6] to-[#2F80FF] bg-clip-text text-transparent mb-2">
                  +24%
                </div>

                <p className="text-[#64748B] font-bold mb-4">
                  {isRtl ? "עלייה בביקוש למשרות טכנולוגיה" : "Growth in demand for technology roles"}
                </p>

                <div className="flex items-center gap-2 text-[#10B981] font-black text-sm">
                  <TrendingUp className="w-4 h-4" />
                  {isRtl ? "ביקוש גבוה בתחום פיתוח" : "Strong demand in development"}
                </div>
              </div>
            </div>

            <div
              className="p-7 text-white relative overflow-hidden"
              style={{
                borderRadius: 20,
                background: "linear-gradient(135deg,#A855F7,#6C4DFF,#2F80FF)",
                boxShadow: "0 28px 80px rgba(108,77,255,0.30)",
              }}
            >
              <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />

              <Wand2 className="w-9 h-9 mb-4 relative" />

              <h3 className="text-2xl font-black mb-3 relative">
                {isRtl ? "לא יודע מה לחפש?" : "Not sure what to search for?"}
              </h3>

              <p className="text-white/80 font-semibold leading-7 mb-6 relative">
                {isRtl
                  ? "תן ל־AI למצוא עבורך את המשרות שהכי מתאימות לניסיון, לכישורים וליעדים שלך."
                  : "Let AI find the roles that best match your experience, skills and career goals."}
              </p>

              <Link
                to="/register"
                className="relative h-12 rounded-2xl bg-white/18 border border-white/30 backdrop-blur-xl flex items-center justify-center text-white font-black"
              >
                {isRtl ? "התחל חיפוש חכם" : "Start smart matching"}
              </Link>
            </div>
          </aside>
        </div>

        <section className="jobs-trust-grid grid grid-cols-1 md:grid-cols-4 gap-5 mt-12">
          {(isRtl
            ? [
                [ShieldCheck, "100% אנונימי", "המעסיק רואה אותך רק אחרי אישור"],
                [Zap, "תהליך מהיר", "הגשה למשרות בלחיצה אחת"],
                [Brain, "התאמת AI", "התאמות חכמות בזמן אמת"],
                [Building2, "חברות איכותיות", "משרות מחברות מובילות בלבד"],
              ]
            : [
                [ShieldCheck, "Private by design", "Employers see your profile only after approval"],
                [Zap, "Fast process", "Apply to relevant roles in one click"],
                [Brain, "AI matching", "Smart recommendations updated in real time"],
                [Building2, "Quality companies", "Openings from trusted employers only"],
              ]
          ).map(([Icon, title, text]) => (
            <div key={title} className="p-6 text-center" style={glass}>
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#2F80FF] flex items-center justify-center mb-4">
                <Icon className="w-7 h-7 text-white" />
              </div>

              <h3 className="text-lg font-black text-[#0F172A] mb-2">{title}</h3>

              <p className="text-sm font-semibold text-[#64748B] leading-6">{text}</p>
            </div>
          ))}
        </section>
      </main>
      <LandingFooter
        copy={jobsFooterCopy}
        isEnglish={!isRtl}
        changeLanguage={changeLanguage}
      />
    </div>
  )
}
