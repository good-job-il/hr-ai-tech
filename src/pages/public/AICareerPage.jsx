import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  Clock3,
  FileText,
  LockKeyhole,
  MessageSquare,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  UserPlus,
  WandSparkles,
} from "lucide-react"
import Navbar from "@/components/home/Navbar"
import LandingFooter from "@/components/home/LandingFooter"
import SEOHead from "@/components/SEOHead"
import "../Home.css"
import "./AICareerPage.css"

const pageContent = {
  en: {
    eyebrow: "Your personal AI career center",
    title: "Make every career move",
    titleAccent: "with more confidence",
    heroText:
      "From a stronger resume to better-fit jobs and interview preparation — HeadHunter AI turns your experience into a clear next step.",
    primaryCta: "Create your free profile",
    secondaryCta: "Explore open jobs",
    free: "Free for candidates",
    private: "Your data stays private",
    available: "Available whenever you need it",
    workspace: "AI career workspace",
    workspaceCaption: "Personal guidance based on your profile",
    profileStrength: "Profile strength",
    matchLabel: "Top job match",
    matchValue: "94% match",
    recommendation: "Next recommendation",
    recommendationText: "Highlight measurable impact in your latest role.",
    metricTools: "AI career tools",
    metricCandidates: "active candidates",
    metricSupport: "career support",
    sectionEyebrow: "Everything in one place",
    sectionTitle: "Practical AI tools for your next opportunity",
    sectionText:
      "Each tool uses the same professional profile, so your recommendations stay relevant and consistent.",
    features: [
      {
        icon: FileText,
        title: "AI resume analysis",
        desc: "Find weak points, sharpen achievements and understand how recruiters read your resume.",
        tag: "Resume",
      },
      {
        icon: Target,
        title: "Personalized job matching",
        desc: "Rank open roles by experience, skills, location and your professional preferences.",
        tag: "Matching",
      },
      {
        icon: MessageSquare,
        title: "Interview coaching",
        desc: "Practice realistic questions and receive clear feedback before the real conversation.",
        tag: "Practice",
      },
      {
        icon: TrendingUp,
        title: "Career path planning",
        desc: "See possible next roles and the skills that can help you reach them with confidence.",
        tag: "Growth",
      },
      {
        icon: WandSparkles,
        title: "Cover letter writing",
        desc: "Create a focused, role-specific draft that reflects your real experience and strengths.",
        tag: "Application",
      },
      {
        icon: BarChart3,
        title: "Salary insights",
        desc: "Prepare for compensation conversations with relevant role and market context.",
        tag: "Salary",
      },
    ],
    processEyebrow: "Simple by design",
    processTitle: "From profile to opportunity in four steps",
    processText:
      "Set up your profile once. The platform uses it to improve every recommendation that follows.",
    steps: [
      ["01", "Create your profile", "Add your experience, goals, skills and preferences."],
      ["02", "Upload your resume", "Use your existing CV or complete the profile manually."],
      ["03", "Get AI guidance", "Receive matches and practical recommendations tailored to you."],
      ["04", "Apply with confidence", "Choose relevant roles and move forward with stronger materials."],
    ],
    testimonialEyebrow: "Candidate stories",
    testimonialTitle: "More clarity at every stage of the search",
    testimonials: [
      {
        name: "Daniel K.",
        role: "Frontend Developer",
        text: "The matching helped me focus on roles that genuinely fit my experience instead of applying everywhere.",
      },
      {
        name: "Michelle A.",
        role: "Product Manager",
        text: "The resume feedback was specific and useful. My profile finally communicated the value of my work clearly.",
      },
      {
        name: "Ron S.",
        role: "DevOps Engineer",
        text: "Interview practice gave me a clear structure for my answers and made the real interview much less stressful.",
      },
    ],
    ctaTitle: "Your next career step can start today",
    ctaText: "Build one professional profile and let HeadHunter AI help you make the most of it.",
    ctaButton: "Start free",
    ctaNote: "No credit card required",
  },
  he: {
    eyebrow: "מרכז הקריירה האישי שלך עם AI",
    title: "לקבל כל החלטת קריירה",
    titleAccent: "עם יותר ביטחון",
    heroText:
      "מקורות חיים חזקים יותר, דרך משרות שבאמת מתאימות לך ועד הכנה לראיון — HeadHunter AI הופך את הניסיון שלך לצעד הבא הברור.",
    primaryCta: "יצירת פרופיל בחינם",
    secondaryCta: "למשרות הפתוחות",
    free: "חינם למועמדים",
    private: "המידע שלך נשאר פרטי",
    available: "זמין בכל זמן שצריך",
    workspace: "סביבת הקריירה עם AI",
    workspaceCaption: "הכוונה אישית המבוססת על הפרופיל שלך",
    profileStrength: "חוזק הפרופיל",
    matchLabel: "ההתאמה המובילה",
    matchValue: "94% התאמה",
    recommendation: "ההמלצה הבאה",
    recommendationText: "כדאי להדגיש הישג מדיד מהתפקיד האחרון שלך.",
    metricTools: "כלי AI לקריירה",
    metricCandidates: "מועמדים פעילים",
    metricSupport: "תמיכה בקריירה",
    sectionEyebrow: "הכול במקום אחד",
    sectionTitle: "כלי AI מעשיים להזדמנות הבאה שלך",
    sectionText:
      "כל הכלים עובדים עם אותו פרופיל מקצועי, כך שההמלצות נשארות רלוונטיות ועקביות.",
    features: [
      {
        icon: FileText,
        title: "ניתוח קורות חיים עם AI",
        desc: "לזהות נקודות חלשות, לחדד הישגים ולהבין איך מגייסים קוראים את קורות החיים שלך.",
        tag: "קורות חיים",
      },
      {
        icon: Target,
        title: "התאמה אישית למשרות",
        desc: "דירוג משרות פתוחות לפי ניסיון, כישורים, מיקום והעדפות מקצועיות.",
        tag: "התאמה",
      },
      {
        icon: MessageSquare,
        title: "אימון לראיון עבודה",
        desc: "תרגול שאלות מציאותיות וקבלת משוב ברור לפני השיחה האמיתית.",
        tag: "תרגול",
      },
      {
        icon: TrendingUp,
        title: "תכנון מסלול קריירה",
        desc: "לגלות תפקידים אפשריים וכישורים שיעזרו להגיע אליהם בביטחון.",
        tag: "צמיחה",
      },
      {
        icon: WandSparkles,
        title: "כתיבת מכתב מקדים",
        desc: "יצירת טיוטה ממוקדת למשרה שמשקפת את הניסיון והחוזקות האמיתיים שלך.",
        tag: "מועמדות",
      },
      {
        icon: BarChart3,
        title: "תובנות שכר",
        desc: "הכנה לשיחות שכר עם הקשר רלוונטי לתפקיד ולשוק העבודה.",
        tag: "שכר",
      },
    ],
    processEyebrow: "פשוט בכוונה",
    processTitle: "מפרופיל להזדמנות בארבעה צעדים",
    processText:
      "מגדירים את הפרופיל פעם אחת. המערכת משתמשת בו כדי לשפר כל המלצה בהמשך.",
    steps: [
      ["01", "יוצרים פרופיל", "מוסיפים ניסיון, מטרות, כישורים והעדפות."],
      ["02", "מעלים קורות חיים", "משתמשים בקובץ הקיים או משלימים ידנית."],
      ["03", "מקבלים הכוונת AI", "מקבלים התאמות והמלצות מעשיות המותאמות לך."],
      ["04", "מגישים בביטחון", "בוחרים משרות רלוונטיות ומתקדמים עם חומרים חזקים יותר."],
    ],
    testimonialEyebrow: "סיפורי מועמדים",
    testimonialTitle: "יותר בהירות בכל שלב בחיפוש",
    testimonials: [
      {
        name: "דניאל כ.",
        role: "Frontend Developer",
        text: "ההתאמות עזרו לי להתמקד בתפקידים שבאמת מתאימים לניסיון שלי במקום להגיש לכל מקום.",
      },
      {
        name: "מיכל א.",
        role: "Product Manager",
        text: "המשוב על קורות החיים היה מדויק ושימושי. סוף סוף הפרופיל שלי הציג בצורה ברורה את הערך שאני מביאה.",
      },
      {
        name: "רון ש.",
        role: "DevOps Engineer",
        text: "התרגול נתן לי מבנה ברור לתשובות והפך את הראיון האמיתי להרבה פחות מלחיץ.",
      },
    ],
    ctaTitle: "הצעד הבא בקריירה יכול להתחיל היום",
    ctaText: "בונים פרופיל מקצועי אחד ונותנים ל-HeadHunter AI לעזור להפיק ממנו את המרב.",
    ctaButton: "מתחילים בחינם",
    ctaNote: "ללא צורך בכרטיס אשראי",
  },
}

export default function AICareerPage() {
  const { i18n } = useTranslation()

  const isEnglish = i18n.language?.startsWith("en")

  const copy = pageContent[isEnglish ? "en" : "he"]

  const ForwardArrow = isEnglish ? ArrowRight : ArrowLeft

  return (
    <div className="headhunter-home ai-career-page" dir={isEnglish ? "ltr" : "rtl"}>
      <SEOHead
        title={isEnglish ? "AI Career Center | HeadHunter" : "מרכז קריירה AI | HeadHunter"}
        description={copy.heroText}
        canonical="https://headhunter.co.il/ai-career"
      />
      <Navbar />

      <main>
        <section className="ai-career-hero">
          <div className="ai-career-shell ai-career-hero-grid">
            <div className="ai-career-hero-copy">
              <span className="ai-career-pill"><Sparkles />{copy.eyebrow}</span>
              <h1>{copy.title}<span>{copy.titleAccent}</span></h1>
              <p>{copy.heroText}</p>
              <div className="ai-career-actions">
                <Link to="/register?type=candidate" className="ai-career-primary-button">
                  <UserPlus />{copy.primaryCta}
                </Link>
                <Link to="/jobs" className="ai-career-secondary-button">
                  {copy.secondaryCta}<ForwardArrow />
                </Link>
              </div>
              <div className="ai-career-trust-row">
                <span><CheckCircle2 /> {copy.free}</span>
                <span><LockKeyhole /> {copy.private}</span>
                <span><Clock3 /> {copy.available}</span>
              </div>
            </div>

            <div className="ai-career-visual" aria-hidden="true">
              <div className="ai-career-orb"><BrainCircuit /></div>
              <div className="ai-career-orbit ai-career-orbit-one" />
              <div className="ai-career-orbit ai-career-orbit-two" />
              <div className="ai-career-workspace-card">
                <div className="ai-career-workspace-head">
                  <span><Sparkles /></span>
                  <div><strong>{copy.workspace}</strong><small>{copy.workspaceCaption}</small></div>
                  <b>AI</b>
                </div>
                <div className="ai-career-profile-progress">
                  <div className="ai-career-progress-ring">86%</div>
                  <div>
                    <small>{copy.profileStrength}</small><strong>86 / 100</strong><span><i /></span>
                  </div>
                </div>
                <div className="ai-career-match-card">
                  <span><BriefcaseBusiness /></span>
                  <div><small>{copy.matchLabel}</small><strong>Senior Product Designer</strong></div>
                  <b>{copy.matchValue}</b>
                </div>
                <div className="ai-career-recommendation">
                  <WandSparkles />
                  <div><strong>{copy.recommendation}</strong><p>{copy.recommendationText}</p></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="ai-career-metrics" aria-label={copy.workspace}>
          <div className="ai-career-shell ai-career-metrics-grid">
            <div><BrainCircuit /><strong>6</strong><span>{copy.metricTools}</span></div>
            <div><UserPlus /><strong>15,000+</strong><span>{copy.metricCandidates}</span></div>
            <div><Clock3 /><strong>24/7</strong><span>{copy.metricSupport}</span></div>
          </div>
        </section>

        <section className="ai-career-tools-section">
          <div className="ai-career-shell">
            <div className="ai-career-section-heading">
              <span>{copy.sectionEyebrow}</span><h2>{copy.sectionTitle}</h2><p>{copy.sectionText}</p>
            </div>
            <div className="ai-career-tools-grid">
              {copy.features.map(({ icon: Icon, title, desc, tag }, index) => (
                <article key={title} className={`ai-career-tool ai-career-tool-${index + 1}`}>
                  <div className="ai-career-tool-top"><span><Icon /></span><small>{tag}</small></div>
                  <h3>{title}</h3><p>{desc}</p><div className="ai-career-tool-line"><i /></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="ai-career-process-section">
          <div className="ai-career-shell ai-career-process-layout">
            <div className="ai-career-process-intro">
              <span>{copy.processEyebrow}</span><h2>{copy.processTitle}</h2><p>{copy.processText}</p>
              <div className="ai-career-process-note">
                <ShieldCheck /><div><strong>{copy.private}</strong><span>{copy.free}</span></div>
              </div>
            </div>
            <ol className="ai-career-steps">
              {copy.steps.map(([number, title, desc]) => (
                <li key={number}>
                  <span>{number}</span><div><h3>{title}</h3><p>{desc}</p></div><Check />
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="ai-career-testimonials-section">
          <div className="ai-career-shell">
            <div className="ai-career-section-heading">
              <span>{copy.testimonialEyebrow}</span><h2>{copy.testimonialTitle}</h2>
            </div>
            <div className="ai-career-testimonials-grid">
              {copy.testimonials.map((item) => (
                <article key={item.name}>
                  <Quote /><p>{item.text}</p>
                  <div>
                    <span>{item.name.slice(0, 1)}</span>
                    <div><strong>{item.name}</strong><small>{item.role}</small></div>
                    <div className="ai-career-review-stars">
                      {[1, 2, 3, 4, 5].map((star) => <Star key={star} />)}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="ai-career-cta-section">
          <div className="ai-career-shell ai-career-cta">
            <div>
              <span><Sparkles /> HeadHunter AI</span><h2>{copy.ctaTitle}</h2><p>{copy.ctaText}</p>
            </div>
            <div>
              <Link to="/register?type=candidate">{copy.ctaButton}<ForwardArrow /></Link>
              <small>{copy.ctaNote}</small>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  )
}
