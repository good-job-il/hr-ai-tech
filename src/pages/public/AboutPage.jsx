import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  BriefcaseBusiness,
  Building2,
  Check,
  Eye,
  HeartHandshake,
  Lightbulb,
  LockKeyhole,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  UserPlus,
  Users,
} from "lucide-react"
import Navbar from "@/components/home/Navbar"
import LandingFooter from "@/components/home/LandingFooter"
import SEOHead from "@/components/SEOHead"
import "../Home.css"
import "./AboutPage.css"

const pageContent = {
  en: {
    eyebrow: "About HeadHunter",
    title: "Building a clearer connection",
    titleAccent: "between talent and opportunity",
    intro:
      "HeadHunter is an Israeli recruitment platform designed to help candidates find relevant work and hiring teams reach the right people with less friction.",
    candidateCta: "Find your next role",
    companyCta: "Start hiring",
    candidates: "Candidates",
    candidatesDetail: "One profile, focused opportunities",
    matching: "Smart matching",
    matchingDetail: "Experience and role context aligned",
    companies: "Companies",
    companiesDetail: "Better signals, clearer decisions",
    missionEyebrow: "Why we exist",
    missionTitle: "Recruitment should work better for both sides",
    missionText:
      "Job searches often create noise for candidates and hiring teams alike. We built HeadHunter to make the process more focused, transparent and useful from the first profile to the final decision.",
    missionPoints: [
      "Help candidates understand which opportunities fit their experience.",
      "Give hiring teams clearer, more relevant candidate signals.",
      "Keep applications and communication organized in one process.",
    ],
    platformEyebrow: "One connected platform",
    platformTitle: "Built around the decisions people actually need to make",
    candidateSide: "For candidates",
    candidateSideText:
      "Create a professional profile, discover relevant roles and track every application without losing context.",
    candidateItems: ["Personal job matching", "Career and resume guidance", "Application tracking"],
    employerSide: "For hiring teams",
    employerSideText:
      "Publish roles, identify suitable candidates and coordinate the hiring process from one shared workspace.",
    employerItems: ["Structured job publishing", "Candidate matching signals", "Collaborative hiring workflow"],
    valuesEyebrow: "How we work",
    valuesTitle: "Principles that shape the product",
    valuesText: "Technology is useful only when it makes important decisions clearer and more human.",
    values: [
      {
        icon: Eye,
        title: "Clarity",
        text: "Explain the information people need without hiding it behind unnecessary complexity.",
      },
      {
        icon: Lightbulb,
        title: "Useful innovation",
        text: "Apply AI where it can improve relevance, preparation and day-to-day recruiting work.",
      },
      {
        icon: ShieldCheck,
        title: "Trust",
        text: "Design every experience with responsible data handling and user control in mind.",
      },
      {
        icon: HeartHandshake,
        title: "Respect for both sides",
        text: "Create a process that values candidates’ time and helps employers make thoughtful decisions.",
      },
    ],
    metricCandidates: "active candidates",
    metricJobs: "open positions",
    metricCompanies: "hiring companies",
    metricSatisfaction: "candidate satisfaction",
    ctaEyebrow: "Move forward with HeadHunter",
    ctaTitle: "A better hiring experience starts with one clear next step",
    ctaText: "Explore current opportunities or create an account for your hiring team.",
    privacy: "Private, focused and free for candidates",
  },
  he: {
    eyebrow: "על HeadHunter",
    title: "יוצרים חיבור ברור יותר",
    titleAccent: "בין כישרון להזדמנות",
    intro:
      "HeadHunter היא פלטפורמת גיוס ישראלית שעוזרת למועמדים למצוא עבודה רלוונטית ולצוותי גיוס להגיע לאנשים הנכונים בפחות חיכוך.",
    candidateCta: "למציאת התפקיד הבא",
    companyCta: "מתחילים לגייס",
    candidates: "מועמדים",
    candidatesDetail: "פרופיל אחד, הזדמנויות ממוקדות",
    matching: "התאמה חכמה",
    matchingDetail: "חיבור בין ניסיון להקשר התפקיד",
    companies: "חברות",
    companiesDetail: "אותות טובים יותר, החלטות ברורות",
    missionEyebrow: "למה אנחנו כאן",
    missionTitle: "תהליך הגיוס צריך לעבוד טוב יותר לשני הצדדים",
    missionText:
      "חיפוש עבודה יוצר לעיתים קרובות עומס ורעש גם למועמדים וגם לצוותי גיוס. בנינו את HeadHunter כדי להפוך את התהליך לממוקד, שקוף ושימושי יותר, מהפרופיל הראשון ועד להחלטה הסופית.",
    missionPoints: [
      "לעזור למועמדים להבין אילו הזדמנויות מתאימות לניסיון שלהם.",
      "לתת לצוותי גיוס אותות ברורים ורלוונטיים יותר על מועמדים.",
      "לשמור את המועמדויות והתקשורת מסודרות בתהליך אחד.",
    ],
    platformEyebrow: "פלטפורמה אחת מחוברת",
    platformTitle: "בנויה סביב ההחלטות שאנשים באמת צריכים לקבל",
    candidateSide: "למועמדים",
    candidateSideText:
      "יוצרים פרופיל מקצועי, מגלים תפקידים רלוונטיים ועוקבים אחרי כל מועמדות בלי לאבד הקשר.",
    candidateItems: ["התאמה אישית למשרות", "הכוונה לקריירה ולקורות חיים", "מעקב אחרי מועמדויות"],
    employerSide: "לצוותי גיוס",
    employerSideText:
      "מפרסמים משרות, מזהים מועמדים מתאימים ומתאמים את תהליך הגיוס בסביבת עבודה משותפת אחת.",
    employerItems: ["פרסום משרות מובנה", "אותות התאמה למועמדים", "תהליך גיוס שיתופי"],
    valuesEyebrow: "איך אנחנו עובדים",
    valuesTitle: "עקרונות שמעצבים את המוצר",
    valuesText: "טכנולוגיה שימושית רק כשהיא הופכת החלטות חשובות לברורות ואנושיות יותר.",
    values: [
      {
        icon: Eye,
        title: "בהירות",
        text: "להציג את המידע שאנשים צריכים בלי להסתיר אותו מאחורי מורכבות מיותרת.",
      },
      {
        icon: Lightbulb,
        title: "חדשנות שימושית",
        text: "ליישם AI במקומות שבהם הוא משפר רלוונטיות, הכנה ועבודת גיוס יומיומית.",
      },
      {
        icon: ShieldCheck,
        title: "אמון",
        text: "לתכנן כל חוויה מתוך אחריות למידע ושליטה של המשתמשים.",
      },
      {
        icon: HeartHandshake,
        title: "כבוד לשני הצדדים",
        text: "ליצור תהליך שמכבד את זמן המועמדים ועוזר למעסיקים לקבל החלטות שקולות.",
      },
    ],
    metricCandidates: "מועמדים פעילים",
    metricJobs: "משרות פתוחות",
    metricCompanies: "חברות מגייסות",
    metricSatisfaction: "שביעות רצון מועמדים",
    ctaEyebrow: "מתקדמים עם HeadHunter",
    ctaTitle: "חוויית גיוס טובה יותר מתחילה בצעד אחד ברור",
    ctaText: "מגלים הזדמנויות פתוחות או יוצרים חשבון לצוות הגיוס.",
    privacy: "פרטי, ממוקד וחינם למועמדים",
  },
}

export default function AboutPage() {
  const { i18n } = useTranslation()

  const isEnglish = i18n.language?.startsWith("en")

  const copy = pageContent[isEnglish ? "en" : "he"]

  const ForwardArrow = isEnglish ? ArrowRight : ArrowLeft

  return (
    <div className="headhunter-home about-page" dir={isEnglish ? "ltr" : "rtl"}>
      <SEOHead
        title={isEnglish ? "About HeadHunter" : "על HeadHunter"}
        description={copy.intro}
        canonical="https://headhunter.co.il/about"
      />
      <Navbar />

      <main>
        <section className="about-hero">
          <div className="about-shell about-hero-grid">
            <div className="about-hero-copy">
              <span className="about-pill"><Sparkles />{copy.eyebrow}</span>
              <h1>{copy.title}<span>{copy.titleAccent}</span></h1>
              <p>{copy.intro}</p>
              <div className="about-hero-actions">
                <Link to="/jobs" className="about-primary-button">
                  <Search />{copy.candidateCta}
                </Link>
                <Link to="/register?type=staffing_agency" className="about-secondary-button">
                  <Building2 />{copy.companyCta}
                </Link>
              </div>
            </div>

            <div className="about-connection" aria-hidden="true">
              <div className="about-connection-glow" />
              <article className="about-connection-card about-candidate-card">
                <span><Users /></span><div><strong>{copy.candidates}</strong><small>{copy.candidatesDetail}</small></div>
              </article>
              <div className="about-ai-core"><BrainCircuit /><strong>AI</strong></div>
              <article className="about-connection-card about-company-card">
                <span><Building2 /></span><div><strong>{copy.companies}</strong><small>{copy.companiesDetail}</small></div>
              </article>
              <div className="about-match-label"><Target /><span><strong>{copy.matching}</strong><small>{copy.matchingDetail}</small></span></div>
              <i className="about-orbit about-orbit-one" /><i className="about-orbit about-orbit-two" />
            </div>
          </div>
        </section>

        <section className="about-metrics-section">
          <div className="about-shell about-metrics">
            {[
              ["15,000+", copy.metricCandidates, Users],
              ["8,500+", copy.metricJobs, BriefcaseBusiness],
              ["1,200+", copy.metricCompanies, Building2],
              ["98%", copy.metricSatisfaction, HeartHandshake],
            ].map(([value, label, Icon]) => (
              <div key={label}><Icon /><strong>{value}</strong><span>{label}</span></div>
            ))}
          </div>
        </section>

        <section className="about-mission-section">
          <div className="about-shell about-mission-layout">
            <div className="about-mission-heading">
              <span>{copy.missionEyebrow}</span><h2>{copy.missionTitle}</h2>
            </div>
            <div className="about-mission-copy">
              <p>{copy.missionText}</p>
              <ul>
                {copy.missionPoints.map((point) => <li key={point}><Check />{point}</li>)}
              </ul>
            </div>
          </div>
        </section>

        <section className="about-platform-section">
          <div className="about-shell">
            <div className="about-section-heading">
              <span>{copy.platformEyebrow}</span><h2>{copy.platformTitle}</h2>
            </div>
            <div className="about-platform-grid">
              <article className="about-audience-card about-audience-candidate">
                <header><span><UserPlus /></span><h3>{copy.candidateSide}</h3></header>
                <p>{copy.candidateSideText}</p>
                <ul>{copy.candidateItems.map((item) => <li key={item}><Check />{item}</li>)}</ul>
                <Link to="/register?type=candidate">{copy.candidateCta}<ForwardArrow /></Link>
              </article>
              <div className="about-platform-center" aria-hidden="true">
                <span><BrainCircuit /></span><strong>HeadHunter AI</strong><small>{copy.matching}</small>
              </div>
              <article className="about-audience-card about-audience-company">
                <header><span><Building2 /></span><h3>{copy.employerSide}</h3></header>
                <p>{copy.employerSideText}</p>
                <ul>{copy.employerItems.map((item) => <li key={item}><Check />{item}</li>)}</ul>
                <Link to="/register?type=staffing_agency">{copy.companyCta}<ForwardArrow /></Link>
              </article>
            </div>
          </div>
        </section>

        <section className="about-values-section">
          <div className="about-shell">
            <div className="about-section-heading">
              <span>{copy.valuesEyebrow}</span><h2>{copy.valuesTitle}</h2><p>{copy.valuesText}</p>
            </div>
            <div className="about-values-grid">
              {copy.values.map(({ icon: Icon, title, text }, index) => (
                <article key={title}>
                  <div><span>0{index + 1}</span><Icon /></div><h3>{title}</h3><p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="about-cta-section">
          <div className="about-shell about-cta">
            <div>
              <span><Sparkles />{copy.ctaEyebrow}</span><h2>{copy.ctaTitle}</h2><p>{copy.ctaText}</p>
            </div>
            <div className="about-cta-actions">
              <Link to="/jobs">{copy.candidateCta}<ForwardArrow /></Link>
              <Link to="/register?type=staffing_agency">{copy.companyCta}</Link>
              <small><LockKeyhole />{copy.privacy}</small>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  )
}
