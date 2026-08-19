import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/lib/AuthContext"
import {
  UserPlus,
  Bell,
  Bot,
  Zap,
  ShieldCheck,
  TrendingUp,
  BriefcaseBusiness,
  Building2,
  Trophy,
  Rocket,
  Send,
  Brain,
  FileText,
  MessageSquare,
  Target,
  Users,
} from "lucide-react"

const gradientText =
  "bg-gradient-to-l from-[#6C4DFF] via-[#5B7CFF] to-[#2FB8FF] bg-clip-text text-transparent"

const glassCard =
  "bg-white/82 backdrop-blur-2xl border border-[#DDEBFF] shadow-[0_24px_80px_rgba(79,124,255,0.12)] rounded-lg"

function HHLogo() {
  return (
    <Link to="/" className="flex items-center select-none" style={{ textDecoration: "none" }}>
      <img
        src="/logo.png"
        alt="HeadHunter HR-Tech"
        style={{ height: 48, width: "auto", objectFit: "contain", imageRendering: "crisp-edges" }}
      />
    </Link>
  )
}

function CandidateCard() {
  const { i18n } = useTranslation()

  const isRtl = !i18n.language?.startsWith("en")

  return (
    <div className={`${glassCard} w-[360px] p-7 relative overflow-hidden`}>
      <div className="absolute -top-16 -left-16 w-40 h-40 bg-[#7C3AED]/10 rounded-full blur-3xl" />

      <div className="flex items-start gap-4 mb-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#EAF8FF] to-[#EDE9FE] border-4 border-white shadow-xl flex items-center justify-center text-3xl">
          👨‍💻
        </div>

        <div>
          <h3 className="text-[#0F172A] text-xl font-extrabold">
            {isRtl ? "דניאל כהן" : "Daniel Cohen"}
          </h3>

          <p className="text-[#48556A] font-semibold">Full Stack Developer</p>

          <p className="text-[#6C4DFF] text-sm font-semibold mt-1">
            {isRtl ? "תל אביב, ישראל" : "Tel Aviv, Israel"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-5">
        <div className="w-16 h-16 rounded-full bg-white border-[6px] border-[#AEEFF7] shadow-inner flex items-center justify-center">
          <span className="text-[#12A7A8] font-extrabold text-xl">95%</span>
        </div>

        <div className="font-bold text-[#172033]">{isRtl ? "התאמה למשרות" : "Job Match"}</div>
      </div>

      <button className="w-full h-13 rounded-2xl bg-gradient-to-l from-[#2F80FF] to-[#8B5CF6] text-white font-bold shadow-[0_14px_35px_rgba(79,124,255,0.25)] mb-5 py-4">
        <Sparkles className="inline w-4 h-4 mr-2" />

        {isRtl ? "שדרוג קורות החיים עם AI" : "Upgrade Resume with AI"}
      </button>

      <div className="flex flex-wrap gap-2 mb-6">
        {["React", "Node.js", "TypeScript", "PostgreSQL", "AWS"].map((tag) => (
          <span
            key={tag}
            className="px-3 py-1.5 rounded-full bg-[#F0F4FF] text-[#5B4FEA] text-xs font-bold"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="space-y-4 border-t border-[#E6EEFF] pt-5">
        <div className="flex items-start justify-between gap-5">
          <BriefcaseBusiness className="w-6 h-6 text-[#6C4DFF]" />

          <div className="text-right">
            <p className="text-[#0F172A] font-extrabold">
              {isRtl ? "ניסיון תעסוקתי" : "Work Experience"}
            </p>

            <p className="text-[#64748B] text-sm">Senior Frontend Developer</p>

            <p className="text-[#94A3B8] text-xs">2021 — {isRtl ? "היום" : "Present"}</p>
          </div>
        </div>

        <div className="flex items-start justify-between gap-5">
          <Building2 className="w-6 h-6 text-[#2F80FF]" />

          <div className="text-right">
            <p className="text-[#0F172A] font-extrabold">{isRtl ? "השכלה" : "Education"}</p>

            <p className="text-[#64748B] text-sm">
              {isRtl ? "B.Sc במדעי המחשב" : "B.Sc Computer Science"}
            </p>

            <p className="text-[#94A3B8] text-xs">
              {isRtl ? "אוניברסיטת תל אביב" : "Tel Aviv University"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function AIOrb() {
  return (
    <div
      style={{
        position: "relative",
        width: 420,
        height: 420,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(108,77,255,0.22) 0%, rgba(47,128,255,0.12) 45%, transparent 72%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          width: 400,
          height: 400,
          borderRadius: "50%",
          border: "1px solid rgba(164,196,255,0.28)",
        }}
      />

      <div
        style={{
          position: "absolute",
          width: 350,
          height: 350,
          borderRadius: "50%",
          border: "1px solid rgba(164,196,255,0.22)",
        }}
      />

      <div
        style={{
          position: "absolute",
          width: 300,
          height: 300,
          borderRadius: "50%",
          border: "1px solid rgba(164,196,255,0.18)",
        }}
      />

      <div
        style={{
          position: "absolute",
          width: 260,
          height: 260,
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 38% 32%, rgba(255,255,255,0.22) 0%, transparent 42%), linear-gradient(145deg, #6C3FDD 0%, #4F7CFF 40%, #06B6D4 100%)",
          boxShadow:
            "0 0 0 1px rgba(255,255,255,0.18), 0 0 60px rgba(108,77,255,0.55), 0 0 120px rgba(79,124,255,0.3), 0 30px 80px rgba(79,124,255,0.3)",
          overflow: "hidden",
        }}
      >
        <svg
          viewBox="0 0 260 260"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.5 }}
        >
          <defs>
            <linearGradient id="nl1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.8" />

              <stop offset="100%" stopColor="#7DE3FF" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          <line x1="20" y1="80" x2="130" y2="120" stroke="url(#nl1)" strokeWidth="0.8" />

          <line x1="130" y1="120" x2="240" y2="70" stroke="url(#nl1)" strokeWidth="0.8" />

          <line x1="130" y1="120" x2="200" y2="180" stroke="url(#nl1)" strokeWidth="0.8" />

          <line x1="130" y1="120" x2="60" y2="190" stroke="url(#nl1)" strokeWidth="0.8" />

          <line x1="60" y1="190" x2="200" y2="180" stroke="url(#nl1)" strokeWidth="0.8" />

          <circle cx="130" cy="120" r="4" fill="white" opacity="0.9" />

          <circle cx="20" cy="80" r="3" fill="white" opacity="0.7" />

          <circle cx="240" cy="70" r="3" fill="white" opacity="0.7" />

          <circle cx="200" cy="180" r="3" fill="white" opacity="0.7" />

          <circle cx="60" cy="190" r="3" fill="white" opacity="0.7" />
        </svg>

        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            viewBox="0 0 120 148"
            width="108"
            height="133"
            style={{
              filter:
                "drop-shadow(0 0 20px rgba(165,243,252,0.7)) drop-shadow(0 0 8px rgba(255,255,255,0.4))",
            }}
          >
            <defs>
              <linearGradient id="hf2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />

                <stop offset="100%" stopColor="rgba(167,243,252,0.2)" />
              </linearGradient>

              <linearGradient id="cl2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />

                <stop offset="100%" stopColor="#A5F3FC" stopOpacity="0.7" />
              </linearGradient>
            </defs>

            <rect
              x="44"
              y="110"
              width="32"
              height="28"
              rx="6"
              fill="url(#hf2)"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="1"
            />

            <path
              d="M60 8 C30 8 16 32 16 58 C16 84 26 100 42 112 L42 122 L78 122 L78 112 C94 100 104 84 104 58 C104 32 90 8 60 8 Z"
              fill="url(#hf2)"
              stroke="rgba(255,255,255,0.55)"
              strokeWidth="1.5"
            />

            <rect
              x="8"
              y="52"
              width="9"
              height="20"
              rx="4.5"
              fill="rgba(255,255,255,0.22)"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="1"
            />

            <rect
              x="103"
              y="52"
              width="9"
              height="20"
              rx="4.5"
              fill="rgba(255,255,255,0.22)"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="1"
            />

            <line
              x1="34"
              y1="52"
              x2="57"
              y2="52"
              stroke="url(#cl2)"
              strokeWidth="1.2"
              strokeLinecap="round"
              opacity="0.85"
            />

            <line
              x1="63"
              y1="52"
              x2="86"
              y2="52"
              stroke="url(#cl2)"
              strokeWidth="1.2"
              strokeLinecap="round"
              opacity="0.85"
            />

            <line
              x1="60"
              y1="40"
              x2="60"
              y2="78"
              stroke="url(#cl2)"
              strokeWidth="1.2"
              strokeLinecap="round"
              opacity="0.75"
            />

            <line
              x1="36"
              y1="66"
              x2="84"
              y2="66"
              stroke="url(#cl2)"
              strokeWidth="1"
              strokeLinecap="round"
              opacity="0.65"
            />

            {[
              [60, 52],
              [60, 66],
              [42, 56],
              [78, 56],
              [42, 76],
              [78, 76],
              [60, 40],
              [60, 78],
            ].map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r="2.8" fill="white" opacity={0.8 + (i % 2) * 0.15} />
            ))}

            <ellipse cx="47" cy="56" rx="5.5" ry="3.5" fill="rgba(167,243,252,0.6)" />

            <ellipse cx="73" cy="56" rx="5.5" ry="3.5" fill="rgba(167,243,252,0.6)" />

            <circle cx="47" cy="56" r="2.2" fill="white" opacity="0.95" />

            <circle cx="73" cy="56" r="2.2" fill="white" opacity="0.95" />

            <path
              d="M50 88 Q60 94 70 88"
              fill="none"
              stroke="rgba(255,255,255,0.6)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: 60,
          right: 50,
          width: 12,
          height: 12,
          borderRadius: "50%",
          background: "#A5F3FC",
          boxShadow: "0 0 14px rgba(165,243,252,0.9)",
        }}
      />

      <div
        style={{
          position: "absolute",
          bottom: 65,
          left: 48,
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "#C4B5FD",
          boxShadow: "0 0 12px rgba(196,181,253,0.9)",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 80,
          left: 70,
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: "#93C5FD",
          boxShadow: "0 0 10px rgba(147,197,253,0.8)",
        }}
      />

      <div
        style={{
          position: "absolute",
          bottom: 85,
          right: 65,
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.18)",
          border: "1px solid rgba(255,255,255,0.4)",
          backdropFilter: "blur(4px)",
        }}
      />
    </div>
  )
}

function HeroSection() {
  const { user, isAuthenticated } = useAuth()

  const { t, i18n } = useTranslation()

  const isRtl = !i18n.language?.startsWith("en")

  const dashboardLink = () => {
    const role = user?.role || user?.user_type || ""

    const map = {
      recruiter: "/agency/recruiter/dashboard",
      team_manager: "/agency/dashboard",
      recruitment_manager: "/agency/dashboard",
      org_admin: "/agency/dashboard",
      employer: "/employer/dashboard",
      hiring_manager: "/employer/dashboard",
      candidate: "/candidate/dashboard",
      admin: "/platform/dashboard",
    }

    return map[role] || "/"
  }

  return (
    <section className="relative overflow-hidden bg-[#F7FBFF]" style={{ minHeight: 820 }}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(139,92,246,0.18),transparent_28%),radial-gradient(circle_at_78%_18%,rgba(47,128,255,0.18),transparent_32%),linear-gradient(180deg,#F8FCFF_0%,#EEF8FF_100%)]" />

      <div className="absolute left-20 top-32 w-72 h-72 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#2FB8FF] opacity-20 blur-3xl" />

      <div className="absolute right-28 bottom-24 w-80 h-80 rounded-full bg-[#2FB8FF]/20 blur-3xl" />

      <div
        className="relative max-w-[1500px] mx-auto px-8 py-16 grid grid-cols-1 lg:grid-cols-[35%_30%_35%] gap-10 items-center"
        style={{ minHeight: 820 }}
        dir={isRtl ? "rtl" : "ltr"}
      >
        <div className={isRtl ? "text-right lg:order-1" : "text-left lg:order-1"}>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D8E4FF] bg-white/75 backdrop-blur-xl px-5 py-2.5 text-[#6C4DFF] font-bold shadow-sm mb-8">
            <Sparkles className="w-4 h-4" />

            {isRtl
              ? "פלטפורמת הגיוס המובילה AI בישראל"
              : "Israel's Leading AI Recruitment Platform"}
          </div>

          <h1 className="text-[76px] leading-[0.98] font-black tracking-tight text-[#0F172A] mb-8">
            {isRtl ? (
              <>
                הקריירה שלך
                <br />
                <span className={gradientText}>מתחילה כאן.</span>
              </>
            ) : (
              <>
                Your career
                <br />
                <span className={gradientText}>starts here.</span>
              </>
            )}
          </h1>

          <p className="text-[23px] leading-9 text-[#475569] max-w-[620px] mb-10">
            {isRtl
              ? "משרות איכותיות, התאמה אישית, תהליך פשוט ומהיר — כל מה שאתה צריך כדי למצוא את העבודה הבאה שלך."
              : "Quality jobs, personalized matching, and a fast simple process — everything you need to find your next job."}
          </p>

          <div className="flex flex-wrap gap-5 mb-10">
            <Link
              to="/jobs"
              className="h-16 px-11 rounded-2xl bg-gradient-to-l from-[#2F80FF] via-[#6C4DFF] to-[#A855F7] text-white font-extrabold text-lg shadow-[0_20px_45px_rgba(108,77,255,0.30)] inline-flex items-center justify-center hover:scale-[1.02] transition"
            >
              <Search className="w-5 h-5 mr-3" />

              {t("jobs.searchButton")}
            </Link>

            {isAuthenticated && user ? (
              <Link
                to={dashboardLink()}
                className="h-16 px-11 rounded-2xl bg-white/85 border border-[#C9D8FF] text-[#6C4DFF] font-extrabold text-lg shadow-[0_20px_45px_rgba(79,124,255,0.10)] inline-flex items-center justify-center hover:scale-[1.02] transition"
              >
                <Rocket className="w-5 h-5 mr-3" />

                {t("common.dashboard")}
              </Link>
            ) : (
              <Link
                to="/register"
                className="h-16 px-11 rounded-2xl bg-white/85 border border-[#C9D8FF] text-[#6C4DFF] font-extrabold text-lg shadow-[0_20px_45px_rgba(79,124,255,0.10)] inline-flex items-center justify-center hover:scale-[1.02] transition"
              >
                <UserPlus className="w-5 h-5 mr-3" />

                {isRtl ? "הרשמה כמועמד חדש" : "Register as Candidate"}
              </Link>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {["👩🏻", "👨🏽", "👩🏼", "👨🏻"].map((a, i) => (
                <div
                  key={i}
                  className="w-12 h-12 rounded-full bg-white border-4 border-white shadow-md flex items-center justify-center text-xl"
                >
                  {a}
                </div>
              ))}

              <div className="w-12 h-12 rounded-full bg-white border-4 border-white shadow-md flex items-center justify-center text-[#6C4DFF] font-black">
                +
              </div>
            </div>

            <p className="text-[#64748B] font-semibold">
              {isRtl
                ? "אלפי מועמדים כבר מצאו את המקום שלהם"
                : "Thousands of candidates have already found their place"}
            </p>
          </div>
        </div>

        <div className="lg:order-2 flex justify-center">
          <AIOrb />
        </div>

        <div className="lg:order-3 flex justify-center">
          <CandidateCard />
        </div>
      </div>
    </section>
  )
}

function WhySection() {
  const { t, i18n } = useTranslation()

  const isRtl = !i18n.language?.startsWith("en")

  const items = [
    {
      icon: Bot,
      title: isRtl ? "AI אישי לקריירה שלך" : "Personal AI for Your Career",
      text: isRtl
        ? "AI שמנתח את הפרופיל שלך ומציע משרות שמתאימות בדיוק לניסיון, לכישורים וליעדים שלך."
        : "AI that analyzes your profile and suggests jobs that match your experience, skills and goals exactly.",
      badge: isRtl ? "חדש" : "New",
    },
    {
      icon: Bell,
      title: isRtl ? "התראות בזמן אמת" : "Real-Time Alerts",
      text: isRtl
        ? "קבל התראות על משרות חדשות שמתאימות לך בדיוק."
        : "Get notified about new jobs that match your profile.",
    },
    {
      icon: ShieldCheck,
      title: isRtl ? "משרות איכותיות בלבד" : "Quality Jobs Only",
      text: isRtl
        ? "אנחנו עובדים רק עם חברות מובילות ומעסיקים אמינים."
        : "We work only with leading companies and trusted employers.",
    },
    {
      icon: Zap,
      title: isRtl ? "תהליך מהיר ופשוט" : "Fast & Simple Process",
      text: isRtl
        ? "מגישים מועמדות בלחיצה אחת ומתקדמים בתהליך בצורה מהירה ונוחה."
        : "Apply in one click and advance through the process quickly and conveniently.",
    },
    {
      icon: TrendingUp,
      title: isRtl ? "קידום הקריירה שלך" : "Advance Your Career",
      text: isRtl
        ? "כלים, טיפים ותובנות שיעזרו לך להתקדם מהר יותר."
        : "Tools, tips and insights to help you move forward faster.",
    },
  ]

  return (
    <section className="relative bg-white" style={{ padding: "80px 0" }}>
      <div className="max-w-[1560px] mx-auto px-8" dir={isRtl ? "rtl" : "ltr"}>
        <h2
          style={{
            fontSize: 52,
            fontWeight: 900,
            lineHeight: 1.1,
            color: "#0F172A",
            textAlign: "center",
            marginBottom: 48,
          }}
        >
          {isRtl ? (
            <>
              למה מועמדים בוחרים ב־<span className={gradientText}>HeadHunter?</span>
            </>
          ) : (
            <>
              Why candidates choose <span className={gradientText}>HeadHunter?</span>
            </>
          )}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {items.map((item) => (
            <div
              key={item.title}
              className={`${glassCard} p-7 min-h-[240px] hover:-translate-y-1 hover:shadow-[0_30px_90px_rgba(108,77,255,0.16)] transition`}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F4EEFF] to-[#EAF8FF] flex items-center justify-center">
                  <item.icon className="w-8 h-8 text-[#6C4DFF]" />
                </div>

                {item.badge && (
                  <span className="px-3 py-1 rounded-full bg-[#6C4DFF] text-white text-xs font-bold">
                    {item.badge}
                  </span>
                )}
              </div>

              <h3 className="text-xl font-extrabold text-[#0F172A] mb-3">{item.title}</h3>

              <p className="text-[#64748B] leading-7">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function SearchSection() {
  const navigate = useNavigate()

  const { t, i18n } = useTranslation()

  const isRtl = !i18n.language?.startsWith("en")

  const [q, setQ] = useState("")

  const doSearch = () => {
    navigate(q.trim() ? `/jobs?search=${encodeURIComponent(q.trim())}` : "/jobs")
  }

  const tags = isRtl
    ? [
        "מפתח Frontend",
        "מפתח Full Stack",
        "מפתח Backend",
        "DevOps",
        "אנליסט נתונים",
        "מעצב UI/UX",
        "מוצר",
        "שיווק דיגיטלי",
      ]
    : [
        "Frontend Developer",
        "Full Stack Developer",
        "Backend Developer",
        "DevOps",
        "Data Analyst",
        "UI/UX Designer",
        "Product",
        "Digital Marketing",
      ]

  return (
    <section className="bg-[#F6FBFF]" style={{ padding: "80px 0" }}>
      <div className="max-w-[1560px] mx-auto px-8" dir={isRtl ? "rtl" : "ltr"}>
        <h2
          style={{
            fontSize: 48,
            fontWeight: 900,
            lineHeight: 1.1,
            color: "#0F172A",
            textAlign: "center",
            marginBottom: 32,
          }}
        >
          {isRtl ? "חפש משרות שמתאימות לך" : "Find jobs that match you"}
        </h2>

        <div className={`${glassCard} p-9`}>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_1fr_220px] gap-4">
            <div className="h-16 rounded-2xl bg-white border border-[#DCE8FF] flex items-center px-5">
              <Search className="w-5 h-5 text-[#9AA8BD] mr-3" />

              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && doSearch()}
                placeholder={t("jobs.searchPlaceholder")}
                className="w-full outline-none bg-transparent text-[#0F172A] placeholder:text-[#9AA8BD] font-semibold"
              />
            </div>

            <div className="h-16 rounded-2xl bg-white border border-[#DCE8FF] flex items-center justify-between px-5 text-[#64748B] font-semibold">
              <span>{isRtl ? "מיקום" : "Location"}</span>

              <ChevronDown className="w-5 h-5" />
            </div>

            <div className="h-16 rounded-2xl bg-white border border-[#DCE8FF] flex items-center justify-between px-5 text-[#64748B] font-semibold">
              <span>{isRtl ? "כל התחומים" : "All fields"}</span>

              <ChevronDown className="w-5 h-5" />
            </div>

            <button
              onClick={doSearch}
              className="h-16 rounded-2xl bg-gradient-to-l from-[#2F80FF] via-[#6C4DFF] to-[#A855F7] text-white font-extrabold shadow-[0_18px_38px_rgba(108,77,255,0.25)]"
            >
              {t("jobs.searchButton")}
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mt-7">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  setQ(tag)
                  navigate(`/jobs?search=${encodeURIComponent(tag)}`)
                }}
                className="px-5 py-2 rounded-full bg-white border border-[#DCE8FF] text-[#6C4DFF] font-bold shadow-sm hover:shadow-md transition"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function AICenter() {
  const { t, i18n } = useTranslation()

  const isRtl = !i18n.language?.startsWith("en")

  const cards = [
    {
      icon: FileText,
      title: isRtl ? "שדרוג קורות חיים" : "Resume Upgrade",
      text: isRtl
        ? "שפר את קורות החיים שלך כך שיבלטו לעיני מעסיקים מובילים."
        : "Improve your resume so it stands out to top employers.",
    },
    {
      icon: Target,
      title: isRtl ? "התאמת משרות חכמה" : "Smart Job Matching",
      text: isRtl
        ? "AI מוצא עבורך משרות שמתאימות בדיוק לפרופיל שלך."
        : "AI finds jobs that match your profile exactly.",
    },
    {
      icon: MessageSquare,
      title: isRtl ? "הכנה לראיונות" : "Interview Prep",
      text: isRtl
        ? "תרגול שאלות ראיון וקבלת משוב חכם לפני הראיון."
        : "Practice interview questions and get smart feedback before the interview.",
    },
    {
      icon: TrendingUp,
      title: isRtl ? "תובנות קריירה" : "Career Insights",
      text: isRtl
        ? "דוחות אישיים והמלצות לקידום הקריירה שלך."
        : "Personal reports and recommendations to advance your career.",
    },
  ]

  return (
    <section className="bg-white" style={{ padding: "80px 0" }}>
      <div className="max-w-[1560px] mx-auto px-8" dir={isRtl ? "rtl" : "ltr"}>
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
          <div className={`${glassCard} p-8 bg-gradient-to-br from-white to-[#F3F0FF]`}>
            <span className="inline-flex px-3 py-1 rounded-full bg-[#6C4DFF] text-white text-xs font-bold mb-5">
              {isRtl ? "חדש" : "New"}
            </span>

            <h2
              style={{
                fontSize: 44,
                fontWeight: 900,
                lineHeight: 1.1,
                color: "#0F172A",
                marginBottom: 16,
              }}
            >
              {isRtl ? "מרכז AI לקריירה" : "AI Career Center"}
            </h2>

            <p className="text-[#64748B] leading-7 mb-6">
              {isRtl
                ? "סט כלים חכמים לשדרוג הסיכויים שלך לקבל את העבודה הבאה."
                : "A smart set of tools to boost your chances of landing the next job."}
            </p>

            <Link
              to="/register"
              className="h-12 px-6 rounded-2xl bg-gradient-to-l from-[#2F80FF] to-[#8B5CF6] text-white font-bold inline-flex items-center"
            >
              {isRtl ? "כניסה למרכז AI" : "Enter AI Center"}
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {cards.map((card) => {
              const Icon = card.icon

              return (
                <div key={card.title} className={`${glassCard} p-7`}>
                  <Icon className="w-9 h-9 text-[#6C4DFF] mb-6" />

                  <h3 className="text-xl font-extrabold text-[#0F172A] mb-3">{card.title}</h3>

                  <p className="text-[#64748B] leading-7">{card.text}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

function StatsSection() {
  const { i18n } = useTranslation()

  const isRtl = !i18n.language?.startsWith("en")

  const stats = [
    { icon: Users, value: "15,000+", label: isRtl ? "מועמדים פעילים" : "Active Candidates" },
    { icon: Building2, value: "1,200+", label: isRtl ? "חברות מגייסות" : "Hiring Companies" },
    { icon: BriefcaseBusiness, value: "8,500+", label: isRtl ? "משרות פתוחות" : "Open Positions" },
    { icon: Trophy, value: "98%", label: isRtl ? "שביעות רצון מועמדים" : "Candidate Satisfaction" },
  ]

  return (
    <section className="bg-[#F6FBFF]" style={{ padding: "60px 0" }}>
      <div className="max-w-[1560px] mx-auto px-8" dir={isRtl ? "rtl" : "ltr"}>
        <div
          className={`${glassCard} grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#DCE8FF]`}
        >
          {stats.map((s) => {
            const Icon = s.icon

            return (
              <div key={s.label} className="p-9 text-center">
                <Icon className="w-10 h-10 text-[#6C4DFF] mx-auto mb-4" />

                <div className="text-4xl font-black text-[#6C4DFF] mb-2">{s.value}</div>

                <div className="text-[#64748B] font-bold">{s.label}</div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const { i18n } = useTranslation()

  const isRtl = !i18n.language?.startsWith("en")

  const steps = [
    {
      icon: UserPlus,
      title: isRtl ? "יוצרים פרופיל" : "Create a Profile",
      text: isRtl
        ? "מעלים קורות חיים וממלאים פרטים בסיסיים."
        : "Upload your resume and fill in basic details.",
    },
    {
      icon: Brain,
      title: isRtl ? "AI מתאים עבורך" : "AI Matches for You",
      text: isRtl
        ? "המערכת מנתחת את הפרופיל שלך ומוצאת משרות רלוונטיות."
        : "The system analyzes your profile and finds relevant jobs.",
    },
    {
      icon: Send,
      title: isRtl ? "מגישים בקליק" : "Apply in One Click",
      text: isRtl
        ? "שולחים מועמדות בלחיצה אחת ומקבלים עדכונים."
        : "Send your application in one click and receive updates.",
    },
    {
      icon: Rocket,
      title: isRtl ? "מתקדמים לקריירה" : "Advance Your Career",
      text: isRtl
        ? "עוקבים אחרי ההתקדמות ומקבלים תובנות להמשך הדרך."
        : "Track progress and get insights for the road ahead.",
    },
  ]

  return (
    <section className="bg-white" style={{ padding: "80px 0" }}>
      <div className="max-w-[1560px] mx-auto px-8" dir={isRtl ? "rtl" : "ltr"}>
        <h2
          style={{
            fontSize: 48,
            fontWeight: 900,
            lineHeight: 1.1,
            color: "#0F172A",
            textAlign: "center",
            marginBottom: 48,
          }}
        >
          {isRtl ? "איך זה עובד?" : "How does it work?"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon

            return (
              <div key={step.title} className={`${glassCard} p-8 text-center relative`}>
                <div className="absolute top-5 right-5 w-9 h-9 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#2F80FF] text-white flex items-center justify-center font-black">
                  {index + 1}
                </div>

                <Icon className="w-12 h-12 text-[#6C4DFF] mx-auto mb-6 mt-6" />

                <h3 className="text-xl font-extrabold text-[#0F172A] mb-3">{step.title}</h3>

                <p className="text-[#64748B] leading-7">{step.text}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  const { i18n } = useTranslation()

  const isRtl = !i18n.language?.startsWith("en")

  return (
    <section className="bg-[#F6FBFF]" style={{ padding: "80px 0" }}>
      <div className="max-w-[1560px] mx-auto px-8" dir={isRtl ? "rtl" : "ltr"}>
        <div className="rounded-lg bg-gradient-to-l from-[#2F80FF] via-[#6C4DFF] to-[#A855F7] p-12 text-white shadow-[0_30px_90px_rgba(108,77,255,0.28)] flex flex-col lg:flex-row items-center justify-between gap-8">
          <div>
            <h2 style={{ fontSize: 48, fontWeight: 900, lineHeight: 1.1, marginBottom: 12 }}>
              {isRtl
                ? "מוכן לעשות את הצעד הבא בקריירה שלך?"
                : "Ready to take the next step in your career?"}
            </h2>

            <p className="text-white/80 text-lg">
              {isRtl
                ? "הצטרף עכשיו לאלפי מועמדים שמצאו את העבודה המשתלמת דרך HeadHunter."
                : "Join thousands of candidates who found their dream job through HeadHunter."}
            </p>
          </div>

          <Link
            to="/register"
            className="h-16 px-10 rounded-2xl bg-white text-[#6C4DFF] font-black inline-flex items-center shadow-xl whitespace-nowrap"
          >
            {isRtl ? "הרשמה כמועמד חדש" : "Register as Candidate"}
          </Link>
        </div>
      </div>
    </section>
  )
}

function HomeFooter() {
  const { t, i18n } = useTranslation()

  const isRtl = !i18n.language?.startsWith("en")

  const columns = isRtl
    ? [
        ["למועמדים", "חיפוש משרות", "פרופיל אישי", "התאמות AI", "קורות חיים"],
        ["לחברות", "פרסום משרה", "חיפוש מועמדים", "AI Matching", "אנליטיקה"],
        ["חברה", "אודות", "קריירה", "בלוג", "צור קשר"],
        ["תמיכה", "מרכז עזרה", "מדריכים", "סטטוס מערכת", "שאלות נפוצות"],
      ]
    : [
        ["For Candidates", "Search Jobs", "Personal Profile", "AI Matching", "Resume"],
        ["For Companies", "Post a Job", "Find Candidates", "AI Matching", "Analytics"],
        ["Company", "About", "Careers", "Blog", "Contact"],
        ["Support", "Help Center", "Guides", "System Status", "FAQ"],
      ]

  return (
    <footer className="bg-[#071124] text-white pt-16 pb-8" dir={isRtl ? "rtl" : "ltr"}>
      <div className="max-w-[1560px] mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">
          <div className="md:col-span-2">
            <HHLogo />

            <p className="text-white/60 leading-8 mt-5 max-w-md">
              {isRtl
                ? "פלטפורמת הגיוס החכמה בישראל. מחברת בין מועמדים איכותיים לחברות מובילות באמצעות AI."
                : "Israel's smart recruitment platform. Connecting quality candidates with leading companies through AI."}
            </p>
          </div>

          {columns.map(([title, ...links]) => (
            <div key={title}>
              <h4 className="font-black mb-5">{title}</h4>

              <div className="space-y-3 text-white/55">
                {links.map((l) => (
                  <div key={l}>{l}</div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-white/50">
          <div>
            {isRtl
              ? "© 2024 HeadHunter. כל הזכויות שמורות."
              : "© 2024 HeadHunter. All rights reserved."}
          </div>

          <div className="flex items-center gap-6">
            <LanguageSwitcher variant="minimal" className="text-white/50 hover:text-white/80" />

            <span>{isRtl ? "תנאי שימוש" : t("common.terms")}</span>

            <span>{isRtl ? "מדיניות פרטיות" : t("common.privacy")}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function Home() {
  const { i18n } = useTranslation()

  const isRtl = !i18n.language?.startsWith("en")

  return (
    <div className="min-h-screen bg-[#F7FBFF] text-[#0F172A]" dir={isRtl ? "rtl" : "ltr"}>
      <SEOHead
        title={
          isRtl
            ? "HeadHunter - פלטפורמת גיוס מבוססת AI"
            : "HeadHunter - AI-Powered Recruitment Platform"
        }
        description={
          isRtl
            ? "HeadHunter היא פלטפורמת גיוס חכמה המחברת בין מועמדים איכותיים לחברות מובילות באמצעות AI."
            : "HeadHunter is a smart recruitment platform connecting quality candidates with leading companies through AI."
        }
        canonical="https://headhunter.co.il/"
        keywords={
          isRtl
            ? "דרושים, משרות, גיוס, AI, קריירה, HeadHunter, HR-Tech"
            : "jobs, recruitment, AI, career, HeadHunter, HR-Tech, Israel"
        }
      />

      <Navbar />

      <HeroSection />

      <WhySection />

      <SearchSection />

      <AICenter />

      <StatsSection />

      <HowItWorks />

      <CTASection />

      <HomeFooter />
    </div>
  )
}
