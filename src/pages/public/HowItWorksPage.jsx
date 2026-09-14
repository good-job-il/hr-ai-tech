import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  BriefcaseBusiness,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileCheck2,
  LayoutDashboard,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react"
import Navbar from "@/components/home/Navbar"
import LandingFooter from "@/components/home/LandingFooter"
import SEOHead from "@/components/SEOHead"
import "../Home.css"
import "./HowItWorksPage.css"

const pageContent = {
  en: {
    eyebrow: "How HeadHunter works",
    title: "A clearer path from profile",
    titleAccent: "to the right opportunity",
    intro:
      "Create one professional profile, get relevant job matches and manage every application without losing track of what comes next.",
    candidateCta: "Start as a candidate",
    employerCta: "I am hiring",
    profile: "Professional profile",
    profileDetail: "Experience, skills and preferences",
    matching: "AI matching",
    matchingDetail: "Roles ranked for relevance",
    progress: "Application progress",
    progressDetail: "Every update in one place",
    metricSatisfaction: "candidate satisfaction",
    metricSpeed: "faster job discovery",
    metricJobs: "open positions",
    metricCandidates: "active candidates",
    candidateEyebrow: "For candidates",
    candidateTitle: "One simple journey, with guidance at every step",
    candidateIntro:
      "Your profile stays at the center of the process, so each match and application becomes more focused.",
    candidateSteps: [
      {
        icon: UserPlus,
        number: "01",
        title: "Create your profile",
        desc: "Add your experience, skills, salary expectations and preferred location. Upload an existing resume or complete the profile manually.",
        meta: "About 2 minutes",
      },
      {
        icon: BrainCircuit,
        number: "02",
        title: "AI analyzes and matches",
        desc: "The matching engine compares your professional profile with open roles using skills, seniority, location and preferences.",
        meta: "Automatic",
      },
      {
        icon: Search,
        number: "03",
        title: "Review relevant opportunities",
        desc: "See a focused list of jobs with a match score and the details you need before deciding whether to apply.",
        meta: "Updated regularly",
      },
      {
        icon: Send,
        number: "04",
        title: "Apply with confidence",
        desc: "Send your professional profile to the recruiter and prepare stronger application materials for the role.",
        meta: "Simple application",
      },
      {
        icon: LayoutDashboard,
        number: "05",
        title: "Track every application",
        desc: "Follow statuses, updates and interview reminders from one personal workspace without losing context.",
        meta: "Always organized",
      },
    ],
    candidateButton: "Create your free candidate profile",
    employerEyebrow: "For employers",
    employerTitle: "A focused hiring flow from role to shortlist",
    employerIntro:
      "Publish a clear role, surface relevant candidates and keep the hiring team aligned in one workspace.",
    employerSteps: [
      {
        icon: BriefcaseBusiness,
        number: "01",
        title: "Publish the position",
        desc: "Define the role, requirements and hiring context in a structured job post.",
      },
      {
        icon: Users,
        number: "02",
        title: "Find relevant candidates",
        desc: "Use matching signals to focus the team on candidates whose experience fits the role.",
      },
      {
        icon: FileCheck2,
        number: "03",
        title: "Manage the hiring process",
        desc: "Coordinate reviews, interviews, decisions and offers from the same workflow.",
      },
    ],
    employerButton: "Post your first position",
    faqEyebrow: "Good to know",
    faqTitle: "Frequently asked questions",
    faqIntro: "The essential details before you create a profile or publish a position.",
    faq: [
      {
        q: "Is the service free?",
        a: "Candidates can create a profile and use the job-search experience at no cost. Employer access depends on the selected plan and available offer.",
      },
      {
        q: "How long does it take to find a job?",
        a: "Timing depends on the role, market and availability. A complete profile and focused applications help recruiters assess your fit more quickly.",
      },
      {
        q: "How does AI know which roles fit me?",
        a: "Matching uses the information in your profile — including experience, skills, location and preferences — and compares it with the requirements of each role.",
      },
      {
        q: "Is my information secure?",
        a: "You control the information in your profile and what is shared with employers. The platform is designed to keep candidate data private and protected.",
      },
    ],
    ctaEyebrow: "Choose your next step",
    ctaTitle: "Ready to move forward?",
    ctaText: "Join as a candidate to discover roles, or create an employer account to start hiring.",
    secure: "Private and secure",
    freeCandidate: "Free candidate profile",
  },
  he: {
    eyebrow: "איך HeadHunter עובד",
    title: "מסלול ברור יותר מהפרופיל",
    titleAccent: "להזדמנות הנכונה",
    intro:
      "יוצרים פרופיל מקצועי אחד, מקבלים התאמות רלוונטיות למשרות ומנהלים כל מועמדות בלי לאבד את הצעד הבא.",
    candidateCta: "מתחילים כמועמדים",
    employerCta: "אני מגייס/ת",
    profile: "פרופיל מקצועי",
    profileDetail: "ניסיון, כישורים והעדפות",
    matching: "התאמת AI",
    matchingDetail: "דירוג משרות לפי רלוונטיות",
    progress: "התקדמות המועמדות",
    progressDetail: "כל עדכון במקום אחד",
    metricSatisfaction: "שביעות רצון מועמדים",
    metricSpeed: "איתור משרות מהיר יותר",
    metricJobs: "משרות פתוחות",
    metricCandidates: "מועמדים פעילים",
    candidateEyebrow: "למועמדים",
    candidateTitle: "מסלול פשוט אחד, עם הכוונה בכל שלב",
    candidateIntro:
      "הפרופיל שלך נשאר במרכז התהליך, כך שכל התאמה ומועמדות הופכות ממוקדות יותר.",
    candidateSteps: [
      {
        icon: UserPlus,
        number: "01",
        title: "יוצרים פרופיל",
        desc: "מוסיפים ניסיון, כישורים, ציפיות שכר ומיקום מועדף. אפשר להעלות קורות חיים קיימים או להשלים ידנית.",
        meta: "כ-2 דקות",
      },
      {
        icon: BrainCircuit,
        number: "02",
        title: "ה-AI מנתח ומתאים",
        desc: "מנוע ההתאמה משווה את הפרופיל המקצועי למשרות פתוחות לפי כישורים, ותק, מיקום והעדפות.",
        meta: "אוטומטי",
      },
      {
        icon: Search,
        number: "03",
        title: "בוחנים הזדמנויות רלוונטיות",
        desc: "מקבלים רשימה ממוקדת של משרות עם ציון התאמה והמידע הדרוש לפני שמחליטים להגיש.",
        meta: "מתעדכן באופן שוטף",
      },
      {
        icon: Send,
        number: "04",
        title: "מגישים בביטחון",
        desc: "שולחים את הפרופיל המקצועי למגייס ומתכוננים עם חומרים חזקים יותר לתפקיד.",
        meta: "הגשה פשוטה",
      },
      {
        icon: LayoutDashboard,
        number: "05",
        title: "עוקבים אחרי כל מועמדות",
        desc: "רואים סטטוסים, עדכונים ותזכורות לראיונות בסביבת עבודה אישית אחת.",
        meta: "תמיד מסודר",
      },
    ],
    candidateButton: "יצירת פרופיל מועמד בחינם",
    employerEyebrow: "למעסיקים",
    employerTitle: "תהליך גיוס ממוקד מהמשרה לרשימה הקצרה",
    employerIntro:
      "מפרסמים תפקיד ברור, מאתרים מועמדים רלוונטיים ומשאירים את צוות הגיוס מתואם בסביבה אחת.",
    employerSteps: [
      {
        icon: BriefcaseBusiness,
        number: "01",
        title: "מפרסמים את המשרה",
        desc: "מגדירים את התפקיד, הדרישות והקשר הגיוס במודעת משרה מובנית.",
      },
      {
        icon: Users,
        number: "02",
        title: "מאתרים מועמדים רלוונטיים",
        desc: "משתמשים באותות התאמה כדי להתמקד במועמדים שהניסיון שלהם מתאים לתפקיד.",
      },
      {
        icon: FileCheck2,
        number: "03",
        title: "מנהלים את תהליך הגיוס",
        desc: "מתאמים סקירות, ראיונות, החלטות והצעות באותו תהליך עבודה.",
      },
    ],
    employerButton: "פרסום המשרה הראשונה",
    faqEyebrow: "כדאי לדעת",
    faqTitle: "שאלות נפוצות",
    faqIntro: "הפרטים החשובים לפני יצירת פרופיל או פרסום משרה.",
    faq: [
      {
        q: "האם השירות בחינם?",
        a: "מועמדים יכולים ליצור פרופיל ולהשתמש בחיפוש המשרות ללא עלות. הגישה למעסיקים תלויה במסלול ובהצעה הזמינה.",
      },
      {
        q: "כמה זמן לוקח למצוא עבודה?",
        a: "משך הזמן תלוי בתפקיד, בשוק ובזמינות. פרופיל מלא והגשות ממוקדות עוזרים למגייסים להעריך התאמה מהר יותר.",
      },
      {
        q: "איך ה-AI יודע אילו משרות מתאימות לי?",
        a: "ההתאמה משתמשת במידע שבפרופיל — כולל ניסיון, כישורים, מיקום והעדפות — ומשווה אותו לדרישות של כל משרה.",
      },
      {
        q: "האם המידע שלי מאובטח?",
        a: "השליטה במידע שבפרופיל ובמה שנחשף למעסיקים נשארת בידיך. הפלטפורמה נועדה לשמור על נתוני המועמדים פרטיים ומוגנים.",
      },
    ],
    ctaEyebrow: "בוחרים את הצעד הבא",
    ctaTitle: "מוכנים להתקדם?",
    ctaText: "מצטרפים כמועמדים כדי לגלות משרות, או יוצרים חשבון מעסיק ומתחילים לגייס.",
    secure: "פרטי ומאובטח",
    freeCandidate: "פרופיל מועמד בחינם",
  },
}

export default function HowItWorksPage() {
  const { i18n } = useTranslation()

  const isEnglish = i18n.language?.startsWith("en")

  const copy = pageContent[isEnglish ? "en" : "he"]

  const ForwardArrow = isEnglish ? ArrowRight : ArrowLeft

  return (
    <div className="headhunter-home how-page" dir={isEnglish ? "ltr" : "rtl"}>
      <SEOHead
        title={isEnglish ? "How HeadHunter Works" : "איך HeadHunter עובד"}
        description={copy.intro}
        canonical="https://headhunter.co.il/how-it-works"
      />
      <Navbar />

      <main>
        <section className="how-hero">
          <div className="how-shell how-hero-grid">
            <div className="how-hero-copy">
              <span className="how-pill"><Sparkles />{copy.eyebrow}</span>
              <h1>{copy.title}<span>{copy.titleAccent}</span></h1>
              <p>{copy.intro}</p>
              <div className="how-hero-actions">
                <Link to="/register?type=candidate" className="how-primary-button">
                  <UserPlus />{copy.candidateCta}
                </Link>
                <Link to="/register?type=staffing_agency" className="how-secondary-button">
                  <Building2 />{copy.employerCta}
                </Link>
              </div>
            </div>

            <div className="how-flow" aria-hidden="true">
              <div className="how-flow-glow" />
              <article className="how-flow-card how-flow-profile">
                <span><UserPlus /></span>
                <div><strong>{copy.profile}</strong><small>{copy.profileDetail}</small></div>
                <Check />
              </article>
              <i className="how-flow-connector how-flow-connector-one"><ForwardArrow /></i>
              <article className="how-flow-card how-flow-match">
                <span><BrainCircuit /></span>
                <div><strong>{copy.matching}</strong><small>{copy.matchingDetail}</small></div>
                <b>AI</b>
              </article>
              <i className="how-flow-connector how-flow-connector-two"><ForwardArrow /></i>
              <article className="how-flow-card how-flow-progress">
                <span><LayoutDashboard /></span>
                <div><strong>{copy.progress}</strong><small>{copy.progressDetail}</small></div>
                <CheckCircle2 />
              </article>
            </div>
          </div>
        </section>

        <section className="how-metrics-section">
          <div className="how-shell how-metrics">
            {[
              ["98%", copy.metricSatisfaction],
              ["3×", copy.metricSpeed],
              ["8,500+", copy.metricJobs],
              ["15,000+", copy.metricCandidates],
            ].map(([value, label]) => (
              <div key={label}><strong>{value}</strong><span>{label}</span></div>
            ))}
          </div>
        </section>

        <section className="how-candidate-section">
          <div className="how-shell">
            <div className="how-section-heading">
              <span>{copy.candidateEyebrow}</span><h2>{copy.candidateTitle}</h2><p>{copy.candidateIntro}</p>
            </div>
            <div className="how-candidate-journey">
              {copy.candidateSteps.map(({ icon: Icon, number, title, desc, meta }) => (
                <article key={number}>
                  <div className="how-step-marker"><span>{number}</span><i /></div>
                  <div className="how-step-card">
                    <div className="how-step-icon"><Icon /></div>
                    <div className="how-step-copy"><h3>{title}</h3><p>{desc}</p></div>
                    <small><Clock3 />{meta}</small>
                  </div>
                </article>
              ))}
            </div>
            <div className="how-center-action">
              <Link to="/register?type=candidate">{copy.candidateButton}<ForwardArrow /></Link>
            </div>
          </div>
        </section>

        <section className="how-employer-section">
          <div className="how-shell">
            <div className="how-employer-heading">
              <div><span>{copy.employerEyebrow}</span><h2>{copy.employerTitle}</h2><p>{copy.employerIntro}</p></div>
              <Building2 />
            </div>
            <div className="how-employer-grid">
              {copy.employerSteps.map(({ icon: Icon, number, title, desc }) => (
                <article key={number}>
                  <div><span>{number}</span><Icon /></div><h3>{title}</h3><p>{desc}</p>
                </article>
              ))}
            </div>
            <div className="how-center-action how-employer-action">
              <Link to="/register?type=staffing_agency">{copy.employerButton}<ForwardArrow /></Link>
            </div>
          </div>
        </section>

        <section className="how-faq-section">
          <div className="how-shell how-faq-layout">
            <div className="how-faq-intro">
              <span>{copy.faqEyebrow}</span><h2>{copy.faqTitle}</h2><p>{copy.faqIntro}</p>
              <div><ShieldCheck /><strong>{copy.secure}</strong></div>
            </div>
            <div className="how-faq-list">
              {copy.faq.map((item, index) => (
                <details key={item.q} open={index === 0}>
                  <summary><span>{item.q}</span><ChevronDown /></summary><p>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="how-cta-section">
          <div className="how-shell how-cta">
            <div>
              <span><Sparkles />{copy.ctaEyebrow}</span><h2>{copy.ctaTitle}</h2><p>{copy.ctaText}</p>
            </div>
            <div className="how-cta-actions">
              <Link to="/register?type=candidate">{copy.candidateCta}<ForwardArrow /></Link>
              <Link to="/register?type=staffing_agency">{copy.employerCta}</Link>
              <small><Check />{copy.freeCandidate}</small>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  )
}
