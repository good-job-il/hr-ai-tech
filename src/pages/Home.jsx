import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  ArrowLeft, ArrowRight, BadgeCheck, BarChart3, Bell, Bot, BrainCircuit,
  BriefcaseBusiness, Building2, ChevronDown, Clock3, FileText, Globe2,
  LockKeyhole, MapPin, MessageSquareText, Quote, Rocket, Search, Send,
  ShieldCheck, Sparkles, Star, Target, Trophy, UserPlus, Users, Zap,
} from "lucide-react"
import Navbar from "@/components/home/Navbar"
import SEOHead from "@/components/SEOHead"
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
  const candidate = copy.candidate

  return <article className="candidate-card"><div className="candidate-head"><div className="candidate-avatar"><Users /></div><div><h3>{candidate.name}</h3><p>Full Stack Developer</p><span><MapPin /> {candidate.location}</span></div></div><div className="candidate-match"><div className="match-score">95%</div><strong>{candidate.match}</strong></div><button className="candidate-ai"><Sparkles /> {candidate.upgrade} <small>{candidate.new}</small></button><div className="candidate-tags">{["React", "Node.js", "TypeScript", "AWS", "PostgreSQL"].map((tag) => <span key={tag}>{tag}</span>)}</div><div className="candidate-line"><BriefcaseBusiness /><div><b>{candidate.experience}</b><strong>Senior Frontend Developer</strong><span>{candidate.period}</span></div></div><div className="candidate-line"><Building2 /><div><b>{candidate.education}</b><strong>{candidate.degree}</strong><span>{candidate.university}</span></div></div></article>
}

function Hero({ copy }) {
  return <section className="hh-hero"><div className="hero-glow hero-glow-one" /><div className="hero-glow hero-glow-two" /><div className="hh-shell hero-grid"><div className="hero-copy"><div className="hero-pill"><Sparkles /> {copy.heroPill} <Sparkles /></div><h1>{copy.heroTitle}<br /><span>{copy.heroAccent}</span></h1><p>{copy.heroText[0]}<br />{copy.heroText[1]}</p><div className="hero-actions"><Link className="hh-button" to="/jobs"><Search /> {copy.searchJobs}</Link><Link className="hh-button hh-button-outline" to="/register?type=candidate"><UserPlus /> {copy.register}</Link></div><div className="candidate-proof"><div className="proof-avatars"><span>A</span><span>N</span><span>D</span><span>Y</span><b>+</b></div><p>{copy.proof}</p></div></div><div className="hero-visual" aria-hidden="true"><div className="ai-orb"><span>AI</span></div><div className="orbit orbit-one" /><div className="orbit orbit-two" /><CandidateCard copy={copy} /></div></div></section>
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

  const search = () => navigate(query.trim() ? `/jobs?search=${encodeURIComponent(query.trim())}` : "/jobs")

  return <section className="hh-section jobs-section"><div className="hh-shell hh-card search-card"><h2 className="section-title">{copy.findJobs} <span>{copy.matchYou}</span></h2><div className="search-row"><label><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" && search()} placeholder={copy.placeholder} /></label><button className="search-select"><MapPin /> {copy.location} <ChevronDown /></button><button className="search-select"><BriefcaseBusiness /> {copy.allFields} <ChevronDown /></button><button className="hh-button search-submit" onClick={search}>{copy.searchJobs}</button></div><div className="tag-row"><span>{copy.moreFields}</span>{copy.tags.map((tag) => <button key={tag} onClick={() => navigate(`/jobs?search=${encodeURIComponent(tag)}`)}>{tag}</button>)}</div></div></section>
}

function FeaturedJobs({ copy, isEnglish }) {
  const Arrow = isEnglish ? ArrowRight : ArrowLeft

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
          {copy.featuredJobs.map(([title, company, location, mode, skills], index) => (
            <article className="job-preview-card" key={title}>
              <div className="job-preview-top"><span className="company-avatar">{company.charAt(0)}</span><div className="job-preview-badges">{index === 0 && <small className="job-match"><Sparkles /> 95% match</small>}<span className="job-fresh"><Clock3 /> {copy.recentlyPosted}</span></div></div>
              <h3>{title}</h3><p className="job-company">{company}</p>
              <div className="job-meta"><span><MapPin /> {location}</span><span><BriefcaseBusiness /> {mode}</span></div>
              <div className="job-skills">{skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
              <Link to={`/jobs?search=${encodeURIComponent(title)}`}>{copy.viewRole} <Arrow /></Link>
            </article>
          ))}
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

function FooterLinks({ title, links, className = "" }) {
  return <div className={`hh-footer-column ${className}`}><h3>{title}</h3>{links.map(([label, href]) => <Link key={label} to={href}>{label}</Link>)}</div>
}

function Footer({ copy, isEnglish, changeLanguage }) {
  return <footer className="hh-footer" dir={isEnglish ? "ltr" : "rtl"}><div className="hh-footer-shell"><div className="hh-footer-grid"><div className="hh-footer-intro"><img src="/logo.png" alt="HeadHunter" /><p>{copy.footerDescription}</p></div>{copy.footerColumns.map(([title, links]) => <FooterLinks key={title} title={title} links={links} />)}<FooterLinks className="hh-footer-support" title={copy.support} links={copy.supportLinks} /></div><div className="hh-footer-bottom"><span>{copy.copyright}</span><nav aria-label="Footer"><button type="button" onClick={changeLanguage}><Globe2 /> {copy.language}</button><Link to="/terms">{copy.terms}</Link><Link to="/privacy">{copy.privacy}</Link></nav></div></div></footer>
}

export default function Home() {
  const { i18n } = useTranslation()

  const isEnglish = i18n.language?.startsWith("en")

  const copy = content[isEnglish ? "en" : "he"]

  const changeLanguage = () => i18n.changeLanguage(isEnglish ? "he" : "en")

  return <div className="headhunter-home" dir={isEnglish ? "ltr" : "rtl"}><SEOHead title={copy.seoTitle} description={copy.seoDescription} canonical="https://headhunter.co.il/" keywords={isEnglish ? "jobs, recruitment, career, AI, Israel" : "משרות, דרושים, גיוס, קריירה, AI"} /><Navbar /><main><Hero copy={copy} /><FeatureSection copy={copy} /><SearchSection copy={copy} /><FeaturedJobs copy={copy} isEnglish={isEnglish} /><AICenter copy={copy} /><Stats copy={copy} /><HowItWorks copy={copy} isEnglish={isEnglish} /><CandidateStory copy={copy} /><BottomCta copy={copy} /></main><Footer copy={copy} isEnglish={isEnglish} changeLanguage={changeLanguage} /></div>
}
