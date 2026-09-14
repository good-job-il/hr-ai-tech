import { useState } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Calculator,
  Check,
  Clock3,
  Download,
  FileText,
  FolderOpen,
  Mail,
  Play,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Video,
} from "lucide-react"
import Navbar from "@/components/home/Navbar"
import LandingFooter from "@/components/home/LandingFooter"
import SEOHead from "@/components/SEOHead"
import "../Home.css"
import "./ResourcesPage.css"

const pageContent = {
  en: {
    eyebrow: "Free career resources",
    title: "Practical tools for every",
    titleAccent: "step of your career",
    intro:
      "Resume templates, clear guides, market reports and useful tools — organized so you can find what you need quickly.",
    browse: "Browse resources",
    aiCta: "Explore AI tools",
    library: "Career resource library",
    libraryDetail: "Templates, guides, tools and reports",
    ready: "Ready to use",
    readyDetail: "Clear formats and practical next steps",
    freeAccess: "Free access",
    freeAccessDetail: "Built to support every candidate",
    resourceCount: "career resources",
    categoryCount: "focused collections",
    videoCount: "video guides",
    accessLabel: "for candidates",
    aiEyebrow: "Featured AI tool",
    aiTitle: "Turn your resume into a stronger professional profile",
    aiText:
      "Use HeadHunter AI to identify gaps, clarify achievements and prepare your experience for better-fit opportunities.",
    aiButton: "Open AI Career Center",
    aiScore: "Profile score",
    aiRecommendation: "Personal recommendations",
    resourcesEyebrow: "Resource library",
    resourcesTitle: "Choose the support you need right now",
    resourcesText:
      "Each collection is focused on a specific part of the job search, from preparing a resume to understanding the market.",
    categories: [
      {
        icon: FileText,
        title: "Resume templates",
        desc: "Professional structures for different roles and levels",
        tone: "violet",
        items: [
          ["Tech CV template", "Popular", "DOCX"],
          ["Marketing & sales CV template", "", "DOCX"],
          ["Executive CV template", "New", "DOCX"],
          ["English CV template", "", "DOCX"],
        ],
      },
      {
        icon: BookOpen,
        title: "Professional guides",
        desc: "Straightforward advice for a more focused job search",
        tone: "blue",
        items: [
          ["Resume writing guide", "Essential", "PDF"],
          ["Job interview guide", "Popular", "PDF"],
          ["LinkedIn guide", "", "PDF"],
          ["First job search guide", "New", "PDF"],
        ],
      },
      {
        icon: Calculator,
        title: "Tools & calculators",
        desc: "Compare options, understand compensation and plan ahead",
        tone: "cyan",
        items: [
          ["Gross-to-net salary calculator", "Useful", "Tool"],
          ["Pension & benefits calculator", "", "Tool"],
          ["Job offer comparison", "New", "Tool"],
          ["Vacation days calculator", "", "Tool"],
        ],
      },
      {
        icon: TrendingUp,
        title: "Job market reports",
        desc: "Market context, hiring trends and role demand",
        tone: "orange",
        items: [
          ["High-tech salary report Q1 2025", "Latest", "PDF"],
          ["Recruitment trends 2025", "", "PDF"],
          ["Role demand report", "", "PDF"],
          ["AI impact on the job market", "Hot", "PDF"],
        ],
      },
    ],
    videosEyebrow: "Learn at your pace",
    videosTitle: "Short video guides for practical career skills",
    videosText: "Focused explanations you can watch before improving your profile or preparing for an interview.",
    videos: [
      ["How to write a CV recruiters can assess quickly", "12:34", "Resume"],
      ["Five ways to prepare for a stronger job interview", "8:15", "Interview"],
      ["How HeadHunter AI turns a profile into job matches", "5:20", "AI matching"],
    ],
    newsletterEyebrow: "New resources",
    newsletterTitle: "Keep your career toolkit up to date",
    newsletterText: "Receive new templates, reports and guides in one concise email.",
    emailPlaceholder: "Your email address",
    subscribe: "Subscribe",
    subscribed: "You are subscribed",
    privacy: "No spam. Unsubscribe whenever you want.",
  },
  he: {
    eyebrow: "משאבי קריירה בחינם",
    title: "כלים מעשיים לכל",
    titleAccent: "שלב בקריירה שלך",
    intro:
      "תבניות קורות חיים, מדריכים ברורים, דוחות שוק וכלים שימושיים — מסודרים כך שאפשר למצוא במהירות את מה שצריך.",
    browse: "לכל המשאבים",
    aiCta: "לכלי ה-AI",
    library: "ספריית משאבי קריירה",
    libraryDetail: "תבניות, מדריכים, כלים ודוחות",
    ready: "מוכנים לשימוש",
    readyDetail: "מבנה ברור וצעדים מעשיים",
    freeAccess: "גישה בחינם",
    freeAccessDetail: "נבנה כדי לתמוך בכל מועמד ומועמדת",
    resourceCount: "משאבי קריירה",
    categoryCount: "אוספים ממוקדים",
    videoCount: "מדריכי וידאו",
    accessLabel: "למועמדים",
    aiEyebrow: "כלי AI מומלץ",
    aiTitle: "להפוך את קורות החיים לפרופיל מקצועי חזק יותר",
    aiText:
      "HeadHunter AI עוזר לזהות פערים, לחדד הישגים ולהכין את הניסיון שלך להזדמנויות מתאימות יותר.",
    aiButton: "פתיחת מרכז הקריירה AI",
    aiScore: "ציון הפרופיל",
    aiRecommendation: "המלצות אישיות",
    resourcesEyebrow: "ספריית המשאבים",
    resourcesTitle: "בוחרים את התמיכה שצריך עכשיו",
    resourcesText:
      "כל אוסף מתמקד בחלק אחר של חיפוש העבודה, מהכנת קורות החיים ועד להבנת השוק.",
    categories: [
      {
        icon: FileText,
        title: "תבניות קורות חיים",
        desc: "מבנים מקצועיים לתפקידים ולרמות ניסיון שונות",
        tone: "violet",
        items: [
          ["תבנית קורות חיים טכנולוגית", "פופולרי", "DOCX"],
          ["תבנית קורות חיים לשיווק ומכירות", "", "DOCX"],
          ["תבנית קורות חיים למנהלים", "חדש", "DOCX"],
          ["תבנית קורות חיים באנגלית", "", "DOCX"],
        ],
      },
      {
        icon: BookOpen,
        title: "מדריכים מקצועיים",
        desc: "עצות ברורות לחיפוש עבודה ממוקד יותר",
        tone: "blue",
        items: [
          ["מדריך לכתיבת קורות חיים", "בסיסי", "PDF"],
          ["מדריך לראיון עבודה", "פופולרי", "PDF"],
          ["מדריך LinkedIn", "", "PDF"],
          ["מדריך לחיפוש עבודה ראשונה", "חדש", "PDF"],
        ],
      },
      {
        icon: Calculator,
        title: "כלים ומחשבונים",
        desc: "השוואת אפשרויות, הבנת שכר ותכנון קדימה",
        tone: "cyan",
        items: [
          ["מחשבון שכר ברוטו-נטו", "שימושי", "כלי"],
          ["מחשבון פנסיה והפרשות", "", "כלי"],
          ["השוואת הצעות עבודה", "חדש", "כלי"],
          ["מחשבון ימי חופשה", "", "כלי"],
        ],
      },
      {
        icon: TrendingUp,
        title: "דוחות שוק העבודה",
        desc: "תמונת שוק, מגמות גיוס וביקוש לתפקידים",
        tone: "orange",
        items: [
          ["דוח שכר הייטק רבעון ראשון 2025", "עדכני", "PDF"],
          ["מגמות גיוס 2025", "", "PDF"],
          ["דוח ביקוש לתפקידים", "", "PDF"],
          ["השפעת AI על שוק העבודה", "חם", "PDF"],
        ],
      },
    ],
    videosEyebrow: "לומדים בקצב שלך",
    videosTitle: "מדריכי וידאו קצרים למיומנויות קריירה מעשיות",
    videosText: "הסברים ממוקדים לצפייה לפני שיפור הפרופיל או הכנה לראיון.",
    videos: [
      ["איך לכתוב קורות חיים שמגייסים יכולים להעריך במהירות", "12:34", "קורות חיים"],
      ["חמש דרכים להתכונן לראיון עבודה חזק יותר", "8:15", "ראיון"],
      ["איך HeadHunter AI הופך פרופיל להתאמות למשרות", "5:20", "התאמת AI"],
    ],
    newsletterEyebrow: "משאבים חדשים",
    newsletterTitle: "שומרים על ארגז הכלים לקריירה מעודכן",
    newsletterText: "מקבלים תבניות, דוחות ומדריכים חדשים במייל אחד ממוקד.",
    emailPlaceholder: "כתובת האימייל שלך",
    subscribe: "הרשמה",
    subscribed: "נרשמת בהצלחה",
    privacy: "ללא ספאם. אפשר להסיר את ההרשמה בכל זמן.",
  },
}

export default function ResourcesPage() {
  const { i18n } = useTranslation()

  const isEnglish = i18n.language?.startsWith("en")

  const copy = pageContent[isEnglish ? "en" : "he"]

  const [subscribed, setSubscribed] = useState(false)

  const ForwardArrow = isEnglish ? ArrowRight : ArrowLeft

  return (
    <div className="headhunter-home resources-page" dir={isEnglish ? "ltr" : "rtl"}>
      <SEOHead
        title={isEnglish ? "Free Career Resources | HeadHunter" : "משאבי קריירה בחינם | HeadHunter"}
        description={copy.intro}
        canonical="https://headhunter.co.il/resources"
      />
      <Navbar />

      <main>
        <section className="resources-hero">
          <div className="resources-shell resources-hero-grid">
            <div className="resources-hero-copy">
              <span className="resources-pill"><FolderOpen />{copy.eyebrow}</span>
              <h1>{copy.title}<span>{copy.titleAccent}</span></h1>
              <p>{copy.intro}</p>
              <div className="resources-hero-actions">
                <a href="#resource-library" className="resources-primary-button">
                  <BookOpen />{copy.browse}
                </a>
                <Link to="/ai-career" className="resources-secondary-button">
                  <Sparkles />{copy.aiCta}
                </Link>
              </div>
            </div>

            <div className="resources-hero-library" aria-hidden="true">
              <div className="resources-library-glow" />
              <article className="resources-library-main">
                <span><FolderOpen /></span>
                <div><strong>{copy.library}</strong><small>{copy.libraryDetail}</small></div>
                <b>16</b>
              </article>
              <article className="resources-library-note resources-library-note-one">
                <FileText /><div><strong>{copy.ready}</strong><small>{copy.readyDetail}</small></div><Check />
              </article>
              <article className="resources-library-note resources-library-note-two">
                <ShieldCheck /><div><strong>{copy.freeAccess}</strong><small>{copy.freeAccessDetail}</small></div><Check />
              </article>
              <div className="resources-library-types">
                <span>PDF</span><span>DOCX</span><span><Video /></span><span><Calculator /></span>
              </div>
            </div>
          </div>
        </section>

        <section className="resources-metrics-section">
          <div className="resources-shell resources-metrics">
            <div><FileText /><strong>16</strong><span>{copy.resourceCount}</span></div>
            <div><FolderOpen /><strong>4</strong><span>{copy.categoryCount}</span></div>
            <div><Video /><strong>3</strong><span>{copy.videoCount}</span></div>
            <div><ShieldCheck /><strong>100%</strong><span>{copy.accessLabel}</span></div>
          </div>
        </section>

        <section className="resources-ai-section">
          <div className="resources-shell resources-ai-card">
            <div className="resources-ai-copy">
              <span><Sparkles />{copy.aiEyebrow}</span><h2>{copy.aiTitle}</h2><p>{copy.aiText}</p>
              <Link to="/ai-career">{copy.aiButton}<ForwardArrow /></Link>
            </div>
            <div className="resources-ai-preview" aria-hidden="true">
              <div className="resources-ai-score"><BrainCircuit /><strong>86%</strong><small>{copy.aiScore}</small></div>
              <div className="resources-ai-bars">
                <span><i /></span><span><i /></span><span><i /></span>
                <strong>{copy.aiRecommendation}</strong>
              </div>
            </div>
          </div>
        </section>

        <section id="resource-library" className="resources-library-section">
          <div className="resources-shell">
            <div className="resources-section-heading">
              <span>{copy.resourcesEyebrow}</span><h2>{copy.resourcesTitle}</h2><p>{copy.resourcesText}</p>
            </div>
            <div className="resources-category-grid">
              {copy.categories.map(({ icon: Icon, title, desc, tone, items }) => (
                <article key={title} className={`resources-category-card resources-tone-${tone}`}>
                  <header>
                    <span><Icon /></span><div><h3>{title}</h3><p>{desc}</p></div><small>{items.length}</small>
                  </header>
                  <ul>
                    {items.map(([name, tag, type]) => (
                      <li key={name}>
                        <div><strong>{name}</strong>{tag && <small>{tag}</small>}</div>
                        <span>{type}<Download /></span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="resources-videos-section">
          <div className="resources-shell">
            <div className="resources-section-heading">
              <span>{copy.videosEyebrow}</span><h2>{copy.videosTitle}</h2><p>{copy.videosText}</p>
            </div>
            <div className="resources-video-grid">
              {copy.videos.map(([title, duration, category], index) => (
                <article key={title}>
                  <div className={`resources-video-visual resources-video-${index + 1}`}>
                    <span><Play /></span><small><Clock3 />{duration}</small><i /><i />
                  </div>
                  <div className="resources-video-copy"><span>{category}</span><h3>{title}</h3></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="resources-newsletter-section">
          <div className="resources-shell resources-newsletter">
            <div>
              <span><Sparkles />{copy.newsletterEyebrow}</span><h2>{copy.newsletterTitle}</h2><p>{copy.newsletterText}</p>
            </div>
            {subscribed ? (
              <div className="resources-subscribed"><Check />{copy.subscribed}</div>
            ) : (
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  setSubscribed(true)
                }}
              >
                <label><Mail /><input type="email" required placeholder={copy.emailPlaceholder} dir="ltr" /></label>
                <button type="submit">{copy.subscribe}<ForwardArrow /></button>
                <small>{copy.privacy}</small>
              </form>
            )}
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  )
}
