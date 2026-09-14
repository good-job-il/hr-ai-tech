import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  BrainCircuit,
  Check,
  Clock3,
  FileText,
  Lightbulb,
  Mail,
  MessageSquare,
  Sparkles,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react"
import Navbar from "@/components/home/Navbar"
import LandingFooter from "@/components/home/LandingFooter"
import SEOHead from "@/components/SEOHead"
import "../Home.css"
import "./BlogPage.css"

const pageContent = {
  en: {
    eyebrow: "HeadHunter career journal",
    title: "Ideas that help you make",
    titleAccent: "better career decisions",
    intro:
      "Practical guides, recruiting insights and clear perspectives on the Israeli job market — written for candidates and hiring teams.",
    latest: "Latest insights",
    guide: "Practical guides",
    market: "Market perspective",
    featured: "Featured article",
    articlesEyebrow: "Explore the journal",
    articlesTitle: "Advice for every side of the hiring process",
    articlesText: "Filter by topic and focus on the information most useful to you right now.",
    all: "All",
    categories: [
      "All",
      "AI & Recruitment",
      "Candidate Tips",
      "Job Market",
      "Job Interview",
      "Career",
      "For Employers",
    ],
    posts: [
      {
        id: 1,
        icon: BrainCircuit,
        category: "AI & Recruitment",
        title: "How AI is transforming recruitment in Israel",
        excerpt:
          "Artificial intelligence is changing how companies identify talent — from resume screening to more focused candidate matching.",
        author: "Yair Levy",
        date: "May 2025",
        readTime: "5 min read",
        tone: "violet",
      },
      {
        id: 2,
        icon: FileText,
        category: "Candidate Tips",
        title: "10 common resume mistakes that lead to rejection",
        excerpt:
          "Learn what makes a resume difficult to assess and how to present your experience with more clarity and impact.",
        author: "Michal Avni",
        date: "April 2025",
        readTime: "7 min read",
        tone: "blue",
      },
      {
        id: 3,
        icon: BarChart3,
        category: "Job Market",
        title: "Israeli high-tech market report — Q1 2025",
        excerpt:
          "A focused look at salaries, in-demand capabilities and the trends shaping Israel’s technology job market.",
        author: "HeadHunter Team",
        date: "April 2025",
        readTime: "10 min read",
        tone: "cyan",
      },
      {
        id: 4,
        icon: MessageSquare,
        category: "Job Interview",
        title: "The complete guide to a technical job interview",
        excerpt:
          "What to prepare, how to structure technical answers and how to approach algorithm questions under pressure.",
        author: "Daniel Cohen",
        date: "March 2025",
        readTime: "12 min read",
        tone: "orange",
      },
      {
        id: 5,
        icon: TrendingUp,
        category: "Career",
        title: "When is the right time to change jobs?",
        excerpt:
          "The signals worth noticing and a practical way to evaluate whether your next professional move is due.",
        author: "Sarah Golan",
        date: "March 2025",
        readTime: "6 min read",
        tone: "indigo",
      },
      {
        id: 6,
        icon: Users,
        category: "For Employers",
        title: "How to hire better candidates in less time",
        excerpt:
          "Practical ways to reduce time-to-fill while improving role clarity, team alignment and candidate experience.",
        author: "Ron Shapira",
        date: "February 2025",
        readTime: "8 min read",
        tone: "purple",
      },
    ],
    newsletterEyebrow: "Weekly career briefing",
    newsletterTitle: "Useful insight, delivered without the noise",
    newsletterText:
      "Get one concise email with new guides, market context and practical job-search advice.",
    emailPlaceholder: "Your email address",
    subscribe: "Subscribe",
    subscribed: "You are subscribed",
    privacy: "No spam. Unsubscribe whenever you want.",
  },
  he: {
    eyebrow: "מגזין הקריירה של HeadHunter",
    title: "תובנות שעוזרות לקבל",
    titleAccent: "החלטות קריירה טובות יותר",
    intro:
      "מדריכים מעשיים, תובנות מעולם הגיוס ונקודת מבט ברורה על שוק העבודה הישראלי — למועמדים ולצוותי גיוס.",
    latest: "התובנות האחרונות",
    guide: "מדריכים מעשיים",
    market: "מבט על השוק",
    featured: "מאמר מומלץ",
    articlesEyebrow: "לגלות את המגזין",
    articlesTitle: "מידע שימושי לכל צד בתהליך הגיוס",
    articlesText: "מסננים לפי נושא ומתמקדים במידע שהכי שימושי עבורך עכשיו.",
    all: "הכול",
    categories: [
      "הכול",
      "AI וגיוס",
      "טיפים למועמד",
      "שוק העבודה",
      "ראיון עבודה",
      "קריירה",
      "למעסיקים",
    ],
    posts: [
      {
        id: 1,
        icon: BrainCircuit,
        category: "AI וגיוס",
        title: "כיצד AI משנה את עולם הגיוס בישראל",
        excerpt:
          "בינה מלאכותית משנה את הדרך שבה חברות מאתרות כישרונות — מסינון קורות חיים ועד התאמה ממוקדת יותר.",
        author: "יאיר לוי",
        date: "מאי 2025",
        readTime: "5 דקות קריאה",
        tone: "violet",
      },
      {
        id: 2,
        icon: FileText,
        category: "טיפים למועמד",
        title: "10 טעויות נפוצות בקורות חיים שמובילות לדחייה",
        excerpt:
          "מה מקשה על מגייסים להעריך קורות חיים ואיך להציג את הניסיון שלך בצורה ברורה ומשפיעה יותר.",
        author: "מיכל אבני",
        date: "אפריל 2025",
        readTime: "7 דקות קריאה",
        tone: "blue",
      },
      {
        id: 3,
        icon: BarChart3,
        category: "שוק העבודה",
        title: "דוח שוק ההייטק הישראלי — רבעון ראשון 2025",
        excerpt:
          "מבט ממוקד על שכר, יכולות מבוקשות והמגמות שמעצבות את שוק העבודה הטכנולוגי בישראל.",
        author: "צוות HeadHunter",
        date: "אפריל 2025",
        readTime: "10 דקות קריאה",
        tone: "cyan",
      },
      {
        id: 4,
        icon: MessageSquare,
        category: "ראיון עבודה",
        title: "המדריך המלא לראיון עבודה טכני",
        excerpt:
          "מה להכין, איך לבנות תשובות טכניות ואיך לגשת לשאלות אלגוריתמים גם תחת לחץ.",
        author: "דניאל כהן",
        date: "מרץ 2025",
        readTime: "12 דקות קריאה",
        tone: "orange",
      },
      {
        id: 5,
        icon: TrendingUp,
        category: "קריירה",
        title: "מתי הזמן הנכון להחליף עבודה?",
        excerpt:
          "הסימנים שכדאי לזהות ודרך מעשית להעריך אם הגיע הזמן לצעד המקצועי הבא.",
        author: "שרה גולן",
        date: "מרץ 2025",
        readTime: "6 דקות קריאה",
        tone: "indigo",
      },
      {
        id: 6,
        icon: Users,
        category: "למעסיקים",
        title: "איך לגייס מועמדים טובים יותר בפחות זמן",
        excerpt:
          "דרכים מעשיות לקצר את זמן האיוש ולשפר את בהירות התפקיד, תיאום הצוות וחוויית המועמד.",
        author: "רון שפירא",
        date: "פברואר 2025",
        readTime: "8 דקות קריאה",
        tone: "purple",
      },
    ],
    newsletterEyebrow: "עדכון קריירה שבועי",
    newsletterTitle: "מידע שימושי, בלי רעש מיותר",
    newsletterText: "מייל אחד ממוקד עם מדריכים חדשים, תמונת מצב של השוק וטיפים מעשיים לחיפוש עבודה.",
    emailPlaceholder: "כתובת האימייל שלך",
    subscribe: "הרשמה",
    subscribed: "נרשמת בהצלחה",
    privacy: "ללא ספאם. אפשר להסיר את ההרשמה בכל זמן.",
  },
}

function PostVisual({ post, large = false }) {
  const Icon = post.icon

  return (
    <div className={`blog-post-visual blog-tone-${post.tone} ${large ? "is-large" : ""}`}>
      <div className="blog-visual-grid" />
      <span><Icon /></span>
      <small>{post.category}</small>
      <i /><i />
    </div>
  )
}

function PostMeta({ post }) {
  return (
    <div className="blog-post-meta">
      <span><UserRound />{post.author}</span>
      <span><Clock3 />{post.readTime}</span>
      <time>{post.date}</time>
    </div>
  )
}

export default function BlogPage() {
  const { i18n } = useTranslation()

  const isEnglish = i18n.language?.startsWith("en")

  const copy = pageContent[isEnglish ? "en" : "he"]

  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0)

  const [subscribed, setSubscribed] = useState(false)

  const ForwardArrow = isEnglish ? ArrowRight : ArrowLeft

  const filteredPosts = useMemo(
    () =>
      activeCategoryIndex === 0
        ? copy.posts
        : copy.posts.filter((post) => post.category === copy.categories[activeCategoryIndex]),
    [activeCategoryIndex, copy],
  )

  const featuredPost = filteredPosts[0]

  const remainingPosts = filteredPosts.slice(1)

  return (
    <div className="headhunter-home blog-page" dir={isEnglish ? "ltr" : "rtl"}>
      <SEOHead
        title={isEnglish ? "Career Insights & Hiring Advice | HeadHunter" : "תובנות קריירה וגיוס | HeadHunter"}
        description={copy.intro}
        canonical="https://headhunter.co.il/blog"
      />
      <Navbar />

      <main>
        <section className="blog-hero">
          <div className="blog-shell blog-hero-grid">
            <div className="blog-hero-copy">
              <span className="blog-pill"><BookOpen />{copy.eyebrow}</span>
              <h1>{copy.title}<span>{copy.titleAccent}</span></h1>
              <p>{copy.intro}</p>
            </div>
            <div className="blog-hero-stack" aria-hidden="true">
              <article className="blog-stack-card blog-stack-card-one">
                <span><BrainCircuit /></span><small>{copy.latest}</small>
                <strong>{copy.posts[0].title}</strong>
              </article>
              <article className="blog-stack-card blog-stack-card-two">
                <span><Lightbulb /></span><small>{copy.guide}</small>
                <strong>{copy.posts[1].title}</strong>
              </article>
              <article className="blog-stack-card blog-stack-card-three">
                <span><BarChart3 /></span><small>{copy.market}</small>
                <strong>{copy.posts[2].title}</strong>
              </article>
            </div>
          </div>
        </section>

        <section className="blog-content-section">
          <div className="blog-shell">
            <div className="blog-section-heading">
              <span>{copy.articlesEyebrow}</span><h2>{copy.articlesTitle}</h2><p>{copy.articlesText}</p>
            </div>

            <nav className="blog-categories" aria-label={copy.articlesEyebrow}>
              {copy.categories.map((category, index) => (
                <button
                  key={category}
                  type="button"
                  className={activeCategoryIndex === index ? "is-active" : ""}
                  onClick={() => setActiveCategoryIndex(index)}
                  aria-pressed={activeCategoryIndex === index}
                >
                  {category}
                </button>
              ))}
            </nav>

            {featuredPost && (
              <article className="blog-featured-post">
                <PostVisual post={featuredPost} large />
                <div className="blog-featured-copy">
                  <span>{featuredPost.category} · {copy.featured}</span>
                  <h2>{featuredPost.title}</h2>
                  <p>{featuredPost.excerpt}</p>
                  <PostMeta post={featuredPost} />
                  <div className="blog-reading-line"><i /></div>
                </div>
              </article>
            )}

            {remainingPosts.length > 0 && (
              <div className="blog-post-grid">
                {remainingPosts.map((post) => (
                  <article key={post.id} className="blog-post-card">
                    <PostVisual post={post} />
                    <div className="blog-post-copy">
                      <span>{post.category}</span><h3>{post.title}</h3><p>{post.excerpt}</p>
                      <PostMeta post={post} />
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="blog-newsletter-section">
          <div className="blog-shell blog-newsletter">
            <div className="blog-newsletter-copy">
              <span><Sparkles />{copy.newsletterEyebrow}</span>
              <h2>{copy.newsletterTitle}</h2><p>{copy.newsletterText}</p>
            </div>
            {subscribed ? (
              <div className="blog-subscribed"><Check />{copy.subscribed}</div>
            ) : (
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  setSubscribed(true)
                }}
              >
                <label>
                  <Mail />
                  <input type="email" required placeholder={copy.emailPlaceholder} dir="ltr" />
                </label>
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
