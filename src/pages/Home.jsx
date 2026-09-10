import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import {
  ArrowLeft, ArrowRight, BadgeCheck, BarChart3, Bell, Bot, BrainCircuit,
  BriefcaseBusiness, Building2, ChevronDown, Clock3, FileText,
  LockKeyhole, MapPin, MessageSquareText, Quote, Rocket, Search, Send,
  ShieldCheck, Sparkles, Star, Target, Trophy, UserPlus, Users, Zap,
} from "lucide-react"
import Navbar from "@/components/home/Navbar"
import LandingFooter from "@/components/home/LandingFooter"
import SEOHead from "@/components/SEOHead"
import { publicJobService } from "@/api/services/publicJobService"
import { taxonomyService } from "@/api/services/taxonomyService"
import { candidateProfileService } from "@/api/services/candidateProfileService"
import { useAuth } from "@/lib/AuthContext"
import "./Home.css"

const icons = {
  features: [BarChart3, Bell, ShieldCheck, Zap, Bot],
  tools: [BarChart3, MessageSquareText, Target, FileText],
  stats: [Trophy, BriefcaseBusiness, Building2, Users],
  steps: [UserPlus, BrainCircuit, Send, Rocket],
}

const content = {
  he: {
    seoTitle: "HeadHunter - הקריירה שלך מתחילה כאן",
    seoDescription: "פלטפורמת הגיוס המובילה בישראל למציאת משרות והתאמת קריירה באמצעות AI.",
    heroPill: "פלטפורמת הגיוס המובילה AI בישראל",
    heroTitle: "הקריירה שלך",
    heroAccent: "מתחילה כאן",
    heroText: ["משרות איכותיות, התאמה אישית, תהליך פשוט ומהיר", "כל מה שאתה צריך כדי למצוא את העבודה הבאה שלך."],
    searchJobs: "חיפוש משרות",
    register: "הרשמה כמועמד חדש",
    proof: "אלפי מועמדים כבר מצאו את המקום שלהם",
    candidate: {
      name: "דניאל כהן", location: "תל אביב, ישראל", match: "התאמה למשרות",
      upgrade: "שדרוג קורות החיים עם AI", new: "חדש", experience: "ניסיון תעסוקתי",
      period: "TensorAid · היום — 2021", education: "השכלה", degree: "B.Sc במדעי המחשב",
      university: "אוניברסיטת תל אביב · 2021",
    },
    featuresTitle: "למה מועמדים ב־",
    featuresText: "כל מה שצריך כדי לעבור מחיפוש מתיש להזדמנות שמתאימה באמת לניסיון, לכישורים ולשאיפות שלך.",
    features: [
      ["קידום הקריירה שלך", "כלים, טיפים ותובנות שיעזרו לך להתקדם"],
      ["התראות בזמן אמת", "קבל התראות על משרות חדשות המתאימות לך"],
      ["משרות איכותיות בלבד", "אנחנו עובדים רק עם חברות מובילות ומעסיקים אמינים"],
      ["תהליך מהיר ופשוט", "מגישים מועמדות בלחיצה אחת ומתקדמים בזמן אמת"],
      ["AI אישי לקריירה שלך", "AI שמנתח את הפרופיל שלך וממליץ על משרות וטיפים", "חדש"],
    ],
    findJobs: "חפש משרות", matchYou: "שמתאימות לך", placeholder: "תפקיד, תחום או מילת מפתח",
    location: "מיקום", allFields: "כל התחומים", moreFields: "עוד תחומים",
    tags: ["שיווק דיגיטלי", "מוצר", "מפתח Full Stack", "מפתח Frontend", "UI/UX Designer", "DevOps", "Data Analyst"],
    jobsEyebrow: "משרות נבחרות",
    jobsTitle: "הזדמנויות שמחכות להתאמה הנכונה",
    jobsText: "תפקידים איכותיים מחברות מובילות, עם מידע ברור לפני שמגישים מועמדות.",
    featuredJobs: [
      ["Senior Frontend Developer", "NovaTech", "תל אביב", "היברידי", ["React", "TypeScript", "Design Systems"]],
      ["Product Designer", "Monday Labs", "רמת גן", "היברידי", ["Figma", "Research", "B2B SaaS"]],
      ["Data Analyst", "Finora", "הרצליה", "משרה מלאה", ["SQL", "Python", "Tableau"]],
    ],
    recentlyPosted: "פורסם לאחרונה", viewRole: "לפרטי המשרה", viewAllJobs: "לכל המשרות",
    tools: [
      ["תובנות קריירה", "דוחות אישיים והמלצות לקידום הקריירה שלך"],
      ["הכנה לראיונות", "תרגול שאלות ראיון וקבלת משוב חכם לפני הראיון"],
      ["התאמת משרות חכמה", "AI מוצא עבורך משרות שמתאימות בדיוק לפרופיל שלך"],
      ["שדרוג קורות חיים", "שפר את קורות החיים שלך עם AI והבלט את הניסיון שלך"],
    ],
    aiTitle: "חדש! מרכז AI לקריירה", aiText: "סוויטת כלים חכמים לשדרוג הסיכויים שלך ולקבל את העבודה הבאה", aiCta: "כניסה למרכז AI",
    stats: [["98%", "שביעות רצון מועמדים"], ["8,500+", "משרות פתוחות"], ["1,200+", "חברות מגייסות"], ["15,000+", "מועמדים פעילים"]],
    how: "איך זה עובד?", howText: "ארבעה צעדים ברורים מפרופיל מקצועי ועד להזדמנות הבאה שלך.",
    steps: [
      ["יוצרים פרופיל", "מעלים קורות חיים וממלאים פרטים בסיסיים"],
      ["AI מתאים עבורך", "המערכת מנתחת את הפרופיל שלך ומוצאת משרות רלוונטיות"],
      ["מגישים בקליק", "מגישים מועמדות בלחיצה אחת ומקבלים עדכונים"],
      ["מתקדמים לקריירה", "מקבלים זימונים לראיונות ומתחילים פרק חדש"],
    ],
    storyEyebrow: "סיפורי הצלחה",
    storyTitle: "חיפוש עבודה שמרגיש אישי",
    storyQuote: "במקום לשלוח קורות חיים לעשרות משרות לא רלוונטיות, קיבלתי התאמות שבאמת דיברו לניסיון שלי. בתוך שלושה שבועות כבר הייתי בשני ראיונות.",
    storyName: "נועה לוי", storyRole: "Product Designer, Tel Aviv", storyMetric: "4.9 מתוך 5", storyMetricText: "דירוג מועמדים לתהליך ההתאמה",
    ctaTitle: "מוכן לעשות את הצעד הבא בקריירה שלך?", ctaText: "הצטרף עכשיו לאלפי מועמדים שמצאו את העבודה המושלמת דרך HeadHunter",
    trust: [["100% אמינות", "משרות אמיתיות מחברות אמינות בלבד"], ["ללא עלות", "חוסך זמן ומאמץ"], ["תהליך מהיר", "ההרשמה למועמדים חינמית לחלוטין"], ["מאובטח ופרטי", "המידע שלך מוגן"]],
    footerDescription: "פלטפורמת הגיוס החכמה של ישראל. מחברת מועמדים איכותיים עם חברות מובילות באמצעות AI.",
    footerColumns: [
      ["למועמדים", [["חיפוש משרות", "/jobs"], ["פרופיל אישי", "/register?type=candidate"], ["התאמות AI", "/ai-career"], ["קורות חיים", "/register?type=candidate"]]],
      ["לחברות", [["פרסום משרה", "/register?type=staffing_agency"], ["חיפוש מועמדים", "/register?type=staffing_agency"], ["התאמות AI", "/ai-career"], ["אנליטיקה", "/register?type=staffing_agency"]]],
      ["החברה", [["אודות", "/about"], ["קריירה", "/about"], ["בלוג", "/blog"], ["צור קשר", "/contact"]]],
    ],
    support: "תמיכה", supportLinks: [["מרכז עזרה", "/contact"], ["מדריכים", "/resources"], ["סטטוס המערכת", "/contact"], ["שאלות נפוצות", "/resources"]],
    copyright: "© 2024 HeadHunter. כל הזכויות שמורות.", terms: "תנאי שימוש", privacy: "מדיניות פרטיות", language: "English",
  },
  en: {
    seoTitle: "HeadHunter - Your career starts here",
    seoDescription: "Israel's leading AI recruitment platform for finding quality jobs and building your career.",
    heroPill: "Israel's leading AI recruitment platform",
    heroTitle: "Your career",
    heroAccent: "starts here",
    heroText: ["Quality jobs, personal matching, a fast and simple process", "Everything you need to find your next opportunity."],
    searchJobs: "Search Jobs", register: "Register as a Candidate", proof: "Thousands of candidates have already found their place",
    candidate: {
      name: "Daniel Cohen", location: "Tel Aviv, Israel", match: "Job match", upgrade: "Upgrade your resume with AI",
      new: "New", experience: "Work experience", period: "TensorAid · 2021 — Present", education: "Education",
      degree: "B.Sc. Computer Science", university: "Tel Aviv University · 2021",
    },
    featuresTitle: "Why candidates choose ",
    featuresText: "Everything you need to move from an exhausting search to an opportunity that truly fits your experience, skills and ambitions.",
    features: [
      ["Advance your career", "Tools, tips and insights that help you move forward"],
      ["Real-time alerts", "Get notified when new jobs match your profile"],
      ["Quality jobs only", "We work only with leading companies and trusted employers"],
      ["Fast and simple", "Apply in one click and move forward in real time"],
      ["Personal career AI", "AI analyzes your profile and recommends jobs and practical tips", "New"],
    ],
    findJobs: "Find jobs", matchYou: "that match you", placeholder: "Role, field or keyword", location: "Location", allFields: "All fields", moreFields: "More fields",
    tags: ["Digital Marketing", "Product", "Full Stack Developer", "Frontend Developer", "UI/UX Designer", "DevOps", "Data Analyst"],
    jobsEyebrow: "Featured opportunities",
    jobsTitle: "Open roles waiting for the right match",
    jobsText: "Quality positions from leading companies, with the details you need before you apply.",
    featuredJobs: [
      ["Senior Frontend Developer", "NovaTech", "Tel Aviv", "Hybrid", ["React", "TypeScript", "Design Systems"]],
      ["Product Designer", "Monday Labs", "Ramat Gan", "Hybrid", ["Figma", "Research", "B2B SaaS"]],
      ["Data Analyst", "Finora", "Herzliya", "Full time", ["SQL", "Python", "Tableau"]],
    ],
    recentlyPosted: "Recently posted", viewRole: "View role", viewAllJobs: "View all jobs",
    tools: [
      ["Career insights", "Personal reports and recommendations to advance your career"],
      ["Interview preparation", "Practice interview questions and receive intelligent feedback"],
      ["Smart job matching", "AI finds jobs that precisely match your profile"],
      ["Resume upgrade", "Improve your resume with AI and highlight your experience"],
    ],
    aiTitle: "New! AI Career Center", aiText: "A smart suite of tools designed to improve your chances of landing your next job", aiCta: "Enter AI Center",
    stats: [["98%", "Candidate satisfaction"], ["8,500+", "Open positions"], ["1,200+", "Hiring companies"], ["15,000+", "Active candidates"]],
    how: "How does it work?", howText: "Four clear steps from a professional profile to your next opportunity.",
    steps: [
      ["Create a profile", "Upload your resume and add your basic details"],
      ["AI matches you", "The platform analyzes your profile and finds relevant jobs"],
      ["Apply in one click", "Submit applications easily and receive live updates"],
      ["Advance your career", "Get interview invitations and start a new chapter"],
    ],
    storyEyebrow: "Candidate success",
    storyTitle: "A job search that feels personal",
    storyQuote: "Instead of sending my resume to dozens of irrelevant positions, I received matches that genuinely reflected my experience. Within three weeks, I already had two interviews.",
    storyName: "Noa Levi", storyRole: "Product Designer, Tel Aviv", storyMetric: "4.9 out of 5", storyMetricText: "Candidate rating for the matching experience",
    ctaTitle: "Ready to take the next step in your career?", ctaText: "Join thousands of candidates who found the perfect job through HeadHunter",
    trust: [["100% trusted", "Real jobs from trusted companies only"], ["Free to use", "Save time and effort"], ["Fast process", "Registration is completely free for candidates"], ["Secure and private", "Your information is protected"]],
    footerDescription: "Israel's smart recruitment platform. Connecting quality candidates with leading companies through AI.",
    footerColumns: [
      ["For Candidates", [["Search Jobs", "/jobs"], ["Personal Profile", "/register?type=candidate"], ["AI Matching", "/ai-career"], ["Resume", "/register?type=candidate"]]],
      ["For Companies", [["Post a Job", "/register?type=staffing_agency"], ["Find Candidates", "/register?type=staffing_agency"], ["AI Matching", "/ai-career"], ["Analytics", "/register?type=staffing_agency"]]],
      ["Company", [["About", "/about"], ["Careers", "/about"], ["Blog", "/blog"], ["Contact", "/contact"]]],
    ],
    support: "Support", supportLinks: [["Help Center", "/contact"], ["Guides", "/resources"], ["System Status", "/contact"], ["FAQ", "/resources"]],
    copyright: "© 2024 HeadHunter. All rights reserved.", terms: "Terms of Use", privacy: "Privacy Policy", language: "עברית",
  },
}

function CandidateCard({ copy }) {
  const { user, isLoadingAuth } = useAuth()

  const { i18n } = useTranslation()

  const isEnglish = i18n.language?.startsWith("en")

  const isCandidate = (user?.role || user?.user_type) === "candidate"

  const { data: profile = null, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["landing-candidate-profile", user?.email],
    queryFn: () => candidateProfileService.me(),
    enabled: isCandidate,
    retry: false,
  })

  if (isLoadingAuth || (isCandidate && isLoadingProfile)) {
    return <article className="candidate-card candidate-card-loading" aria-label={isEnglish ? "Loading candidate profile" : "טוען פרופיל מועמד"}><span /><span /><span /><span /><span /></article>
  }

  if (!isCandidate) {
    const guest = isEnglish
      ? {
          name: "Your professional profile",
          title: "Get jobs matched to your experience",
          location: "Personal, private and free",
          match: "Personal matching starts here",
          action: "Create your candidate profile",
          badge: "Free",
          tags: ["Job matches", "Smart alerts", "AI resume"],
          firstLabel: "One profile",
          firstTitle: "Apply faster to relevant roles",
          firstText: "Keep your experience and skills in one place",
          secondLabel: "Career AI",
          secondTitle: "Get recommendations made for you",
          secondText: "Sign in to unlock your personal workspace",
        }
      : {
          name: "הפרופיל המקצועי שלך",
          title: "קבל משרות שמתאימות לניסיון שלך",
          location: "אישי, מאובטח וללא עלות",
          match: "ההתאמה האישית מתחילה כאן",
          action: "יצירת פרופיל מועמד",
          badge: "חינם",
          tags: ["התאמת משרות", "התראות חכמות", "קורות חיים AI"],
          firstLabel: "פרופיל אחד",
          firstTitle: "מגישים מהר למשרות רלוונטיות",
          firstText: "כל הניסיון והכישורים במקום אחד",
          secondLabel: "AI לקריירה",
          secondTitle: "מקבלים המלצות אישיות",
          secondText: "נרשמים ופותחים סביבת עבודה אישית",
        }

    return <article className="candidate-card candidate-card-guest"><div className="candidate-head"><div className="candidate-avatar"><UserPlus /></div><div><h3>{guest.name}</h3><p>{guest.title}</p><span><ShieldCheck /> {guest.location}</span></div></div><div className="candidate-match"><div className="match-score match-score-guest"><Sparkles /></div><strong>{guest.match}</strong></div><Link className="candidate-ai" to="/register?type=candidate"><UserPlus /> {guest.action} <small>{guest.badge}</small></Link><div className="candidate-tags">{guest.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><div className="candidate-line"><BriefcaseBusiness /><div><b>{guest.firstLabel}</b><strong>{guest.firstTitle}</strong><span>{guest.firstText}</span></div></div><div className="candidate-line"><BrainCircuit /><div><b>{guest.secondLabel}</b><strong>{guest.secondTitle}</strong><span>{guest.secondText}</span></div></div></article>
  }

  const candidate = copy.candidate

  const experience = Array.isArray(profile?.experience) ? profile.experience[0] : null

  const education = Array.isArray(profile?.education)
    ? profile.education[0]
    : profile?.education

  const educationTitle =
    typeof education === "string"
      ? education
      : education?.degree || education?.title || education?.institution

  const completionFields = [
    profile?.full_name,
    profile?.title,
    profile?.location,
    profile?.summary,
    profile?.skills?.length,
    profile?.experience?.length,
    profile?.education && (Array.isArray(profile.education) ? profile.education.length : true),
    profile?.resume_url,
  ]

  const profileStrength = Math.round(
    (completionFields.filter(Boolean).length / completionFields.length) * 100,
  )

  const labels = isEnglish
    ? {
        fallbackTitle: "Candidate profile",
        fallbackLocation: "Add your location",
        strength: "Profile strength",
        complete: "Complete your profile",
        addResume: "Add your resume",
        upgrade: "Upgrade your resume with AI",
        experience: "Work experience",
        addExperience: "Add work experience",
        education: "Education",
        addEducation: "Add education",
        updated: "Keep your profile up to date",
      }
    : {
        fallbackTitle: "פרופיל מועמד",
        fallbackLocation: "הוספת מיקום",
        strength: "חוזק הפרופיל",
        complete: "השלמת הפרופיל",
        addResume: "הוספת קורות חיים",
        upgrade: "שדרוג קורות החיים עם AI",
        experience: "ניסיון תעסוקתי",
        addExperience: "הוספת ניסיון תעסוקתי",
        education: "השכלה",
        addEducation: "הוספת השכלה",
        updated: "כדאי לשמור על פרופיל מעודכן",
      }

  const action = profile?.resume_url
    ? { label: labels.upgrade, to: "/ai-career" }
    : { label: profile ? labels.addResume : labels.complete, to: "/candidate/profile" }

  const skills = profile?.skills?.slice(0, 5) || []

  const name = profile?.full_name || user?.full_name || user?.email

  return <article className="candidate-card"><div className="candidate-head"><div className="candidate-avatar"><Users /></div><div><h3>{name}</h3><p>{profile?.title || labels.fallbackTitle}</p><span><MapPin /> {profile?.location || labels.fallbackLocation}</span></div></div><div className="candidate-match"><div className="match-score" style={{ background: `conic-gradient(#61d6d7 0 ${profileStrength}%, #e4eeee ${profileStrength}% 100%)` }}>{profileStrength}%</div><strong>{labels.strength}</strong></div><Link className="candidate-ai" to={action.to}><Sparkles /> {action.label} <small>{candidate.new}</small></Link>{skills.length > 0 && <div className="candidate-tags">{skills.map((tag) => <span key={tag}>{tag}</span>)}</div>}<div className="candidate-line"><BriefcaseBusiness /><div><b>{labels.experience}</b><strong>{experience?.role || experience?.title || labels.addExperience}</strong><span>{experience ? [experience.company, experience.years || experience.period].filter(Boolean).join(" · ") : labels.updated}</span></div></div><div className="candidate-line"><Building2 /><div><b>{labels.education}</b><strong>{educationTitle || labels.addEducation}</strong><span>{typeof education === "object" ? [education?.institution, education?.year].filter(Boolean).join(" · ") || labels.updated : labels.updated}</span></div></div></article>
}

function Hero({ copy }) {
  return <section className="hh-hero"><div className="hero-glow hero-glow-one" /><div className="hero-glow hero-glow-two" /><div className="hh-shell hero-grid"><div className="hero-copy"><div className="hero-pill"><Sparkles /> {copy.heroPill} <Sparkles /></div><h1>{copy.heroTitle}<br /><span>{copy.heroAccent}</span></h1><p>{copy.heroText[0]}<br />{copy.heroText[1]}</p><div className="hero-actions"><Link className="hh-button" to="/jobs"><Search /> {copy.searchJobs}</Link><Link className="hh-button hh-button-outline" to="/register?type=candidate"><UserPlus /> {copy.register}</Link></div><div className="candidate-proof"><div className="proof-avatars"><span>A</span><span>N</span><span>D</span><span>Y</span><b>+</b></div><p>{copy.proof}</p></div></div><div className="hero-visual"><div className="ai-orb" aria-hidden="true"><span>AI</span></div><div className="orbit orbit-one" aria-hidden="true" /><div className="orbit orbit-two" aria-hidden="true" /><CandidateCard copy={copy} /></div></div></section>
}

function FeatureSection({ copy }) {
  return <section className="hh-section features-section"><div className="hh-shell"><h2 className="section-title">{copy.featuresTitle}<span>HeadHunter?</span></h2><p className="section-description">{copy.featuresText}</p><div className="feature-grid">{copy.features.map(([title, text, badge], index) => {
 const Icon = icons.features[index];

 return <article className="hh-card feature-card" key={title}>{badge && <small>{badge}</small>}<Icon /><h3>{title}</h3><p>{text}</p></article> 
})}</div></div></section>
}

function SearchSection({ copy }) {
  const navigate = useNavigate()

  const [query, setQuery] = useState("")

  const [selectedLocation, setSelectedLocation] = useState("")

  const [selectedDomain, setSelectedDomain] = useState("")

  const { data: domains = [] } = useQuery({
    queryKey: ["landing-job-domains"],
    queryFn: () => taxonomyService.domains(),
    staleTime: 5 * 60 * 1000,
  })

  const { data: availableJobs = [] } = useQuery({
    queryKey: ["landing-job-locations"],
    queryFn: () => publicJobService.list({ limit: 500, sort: "created_date", order: "DESC" }),
    staleTime: 60 * 1000,
  })

  const locations = Array.from(
    new Set(availableJobs.map((job) => job.location?.trim()).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b))

  const goToJobs = (searchTerm = query) => {
    const params = new URLSearchParams()

    if (searchTerm.trim()) {
      params.set("search", searchTerm.trim())
    }

    if (selectedLocation) {
      params.set("location", selectedLocation)
    }

    if (selectedDomain) {
      params.set("domain_id", selectedDomain)
    }

    const queryString = params.toString()

    navigate(queryString ? `/jobs?${queryString}` : "/jobs")
  }

  return <section className="hh-section jobs-section"><div className="hh-shell hh-card search-card"><h2 className="section-title">{copy.findJobs} <span>{copy.matchYou}</span></h2><div className="search-row"><label><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" && goToJobs()} placeholder={copy.placeholder} /></label><label className="search-select"><MapPin /><select aria-label={copy.location} value={selectedLocation} onChange={(event) => setSelectedLocation(event.target.value)}><option value="">{copy.location}</option>{locations.map((location) => <option key={location} value={location}>{location}</option>)}</select><ChevronDown /></label><label className="search-select"><BriefcaseBusiness /><select aria-label={copy.allFields} value={selectedDomain} onChange={(event) => setSelectedDomain(event.target.value)}><option value="">{copy.allFields}</option>{domains.map((domain) => <option key={domain.domain_id} value={domain.domain_id}>{domain.name}</option>)}</select><ChevronDown /></label><button className="hh-button search-submit" onClick={() => goToJobs()}>{copy.searchJobs}</button></div><div className="tag-row"><span>{copy.moreFields}</span>{copy.tags.map((tag) => <button key={tag} onClick={() => goToJobs(tag)}>{tag}</button>)}</div></div></section>
}

function FeaturedJobs({ copy, isEnglish }) {
  const Arrow = isEnglish ? ArrowRight : ArrowLeft

  const { data: jobs = [], isLoading, isError } = useQuery({
    queryKey: ["landing-featured-jobs"],
    queryFn: () =>
      publicJobService.list({ limit: 100, sort: "created_date", order: "DESC" }),
    staleTime: 60 * 1000,
  })

  const featuredJobs = jobs
    .filter((job) => {
      const title = job.title?.trim()

      return Boolean(
        title &&
          job.company?.trim() &&
          title.length <= 120 &&
          !title.includes("</") &&
          !title.includes("\\/") &&
          !title.includes('"statusCode"'),
      )
    })
    .sort((a, b) => {
      const quality = (job) =>
        Number(Boolean(job.location?.trim())) * 4 +
        Number(Boolean(job.description?.trim())) * 2 +
        Number(Boolean(job.category?.trim()))

      return quality(b) - quality(a)
    })
    .slice(0, 3)

  const typeLabels = isEnglish
    ? { full: "Full time", part: "Part time", daily: "Daily", remote: "Remote" }
    : { full: "משרה מלאה", part: "משרה חלקית", daily: "יומי", remote: "מרחוק" }

  const formatDate = (value) =>
    new Intl.DateTimeFormat(isEnglish ? "en-GB" : "he-IL", {
      day: "numeric",
      month: "short",
    }).format(new Date(value))

  return (
    <section className="hh-section featured-jobs-section">
      <div className="hh-shell">
        <div className="section-heading-row">
          <div>
            <span className="section-kicker">{copy.jobsEyebrow}</span>
            <h2 className="section-title">{copy.jobsTitle}</h2>
            <p className="section-description">{copy.jobsText}</p>
          </div>
          <Link className="section-link" to="/jobs">{copy.viewAllJobs} <Arrow /></Link>
        </div>
        <div className="featured-jobs-grid">
          {isLoading && [1, 2, 3].map((item) => (
            <article className="job-preview-card job-preview-loading" key={item} aria-hidden="true">
              <span /><span /><span /><span />
            </article>
          ))}

          {!isLoading && !isError && featuredJobs.map((job) => {
            const skills = [
              ...(Array.isArray(job.required_skills) ? job.required_skills : []),
              ...(Array.isArray(job.preferred_skills) ? job.preferred_skills : []),
              job.category,
            ].filter(Boolean).slice(0, 3)

            return (
              <article className="job-preview-card" key={job.id}>
                <div className="job-preview-top">
                  <span className="company-avatar">{job.company_initials || job.company.charAt(0)}</span>
                  <div className="job-preview-badges">
                    <span className="job-fresh"><Clock3 /> {formatDate(job.created_date)}</span>
                  </div>
                </div>
                <h3>{job.title}</h3>
                <p className="job-company">{job.company}</p>
                <div className="job-meta">
                  {job.location && <span><MapPin /> {job.location}</span>}
                  <span><BriefcaseBusiness /> {typeLabels[job.type] || job.type}</span>
                </div>
                {skills.length > 0 && <div className="job-skills">
                  {skills.map((skill) => <span key={skill}>{skill}</span>)}
                </div>}
                <Link to={`/jobs/${job.id}`}>{copy.viewRole} <Arrow /></Link>
              </article>
            )
          })}

          {!isLoading && (isError || featuredJobs.length === 0) && (
            <div className="featured-jobs-empty">
              <BriefcaseBusiness />
              <p>{isEnglish ? "No open roles are available right now." : "אין כרגע משרות פתוחות להצגה."}</p>
              <Link to="/jobs">{copy.viewAllJobs} <Arrow /></Link>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function AICenter({ copy }) {
  return <section className="hh-section ai-section"><div className="hh-shell ai-panel"><div className="ai-tool-grid">{copy.tools.map(([title, text], index) => {
 const Icon = icons.tools[index];

 return <article className="hh-card ai-tool" key={title}><Icon /><div><h3>{title}</h3><p>{text}</p></div></article> 
})}</div><aside className="ai-intro"><span>{copy.candidate.new}</span><h2>{copy.aiTitle}</h2><p>{copy.aiText}</p><Link to="/ai-career">{copy.aiCta} <Sparkles /></Link></aside></div></section>
}

function Stats({ copy }) {
  return <section className="hh-section stats-section"><div className="hh-shell hh-card stats-grid">{copy.stats.map(([value, label], index) => {
 const Icon = icons.stats[index];

 return <div key={label}><Icon /><strong>{value}</strong><span>{label}</span></div> 
})}</div></section>
}

function HowItWorks({ copy, isEnglish }) {
  return <section className="hh-section how-section"><div className="hh-shell"><h2 className="section-title">{copy.how}</h2><p className="section-description">{copy.howText}</p><div className="steps-grid">{copy.steps.map(([title, text], index) => {
 const Icon = icons.steps[index];

 return <article className="hh-card step-card" key={title}><span>{index + 1}</span><Icon /><h3>{title}</h3><p>{text}</p>{index < 3 && <i>{isEnglish ? "⟶" : "⟵"}</i>}</article> 
})}</div></div></section>
}

function CandidateStory({ copy }) {
  return (
    <section className="hh-section story-section">
      <div className="hh-shell story-panel">
        <div className="story-copy"><span className="section-kicker">{copy.storyEyebrow}</span><Quote /><h2>{copy.storyTitle}</h2><blockquote>“{copy.storyQuote}”</blockquote><div className="story-person"><span>{copy.storyName.charAt(0)}</span><div><strong>{copy.storyName}</strong><small>{copy.storyRole}</small></div><BadgeCheck /></div></div>
        <aside className="story-rating"><div className="stars">{[1, 2, 3, 4, 5].map((star) => <Star key={star} />)}</div><strong>{copy.storyMetric}</strong><p>{copy.storyMetricText}</p><div><Users /><span>15,000+</span></div></aside>
      </div>
    </section>
  )
}

function BottomCta({ copy }) {
  const trustIcons = [ShieldCheck, Zap, Target, LockKeyhole]

  return <section className="hh-section bottom-section"><div className="hh-shell"><div className="bottom-cta"><div><h2>{copy.ctaTitle}</h2><p>{copy.ctaText}</p></div><Link to="/register?type=candidate">{copy.register} <UserPlus /></Link></div><div className="trust-row">{copy.trust.map(([title, text], index) => {
 const Icon = trustIcons[index];

 return <div key={title}><Icon /><b>{title}</b><span>{text}</span></div> 
})}</div></div></section>
}

export default function Home() {
  const { i18n } = useTranslation()

  const isEnglish = i18n.language?.startsWith("en")

  const copy = content[isEnglish ? "en" : "he"]

  const changeLanguage = () => i18n.changeLanguage(isEnglish ? "he" : "en")

  return <div className="headhunter-home" dir={isEnglish ? "ltr" : "rtl"}><SEOHead title={copy.seoTitle} description={copy.seoDescription} canonical="https://headhunter.co.il/" keywords={isEnglish ? "jobs, recruitment, career, AI, Israel" : "משרות, דרושים, גיוס, קריירה, AI"} /><Navbar /><main><Hero copy={copy} /><FeatureSection copy={copy} /><SearchSection copy={copy} /><FeaturedJobs copy={copy} isEnglish={isEnglish} /><AICenter copy={copy} /><Stats copy={copy} /><HowItWorks copy={copy} isEnglish={isEnglish} /><CandidateStory copy={copy} /><BottomCta copy={copy} /></main><LandingFooter copy={copy} isEnglish={isEnglish} changeLanguage={changeLanguage} /></div>
}
