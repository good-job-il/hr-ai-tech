import { Bot, Zap, Shield, Bell, TrendingUp } from "lucide-react"

const FEATURES = [
  {
    icon: Bot,
    color: "#6C4DFF",
    bg: "rgba(108,77,255,0.08)",
    tag: "חדש",
    tagBg: "rgba(108,77,255,0.1)",
    tagColor: "#6C4DFF",
    title: "AI אישי לקריירה שלך",
    desc: "מודל AI אישי שלומד את הפרופיל שלך ומספק הזדמנויות מדויקות בדיוק עבורך.",
  },
  {
    icon: Zap,
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.08)",
    title: "הליך מהיר ופשוט",
    desc: "נגיש לכולם ודורש תשומת לב מינימלית כדי למצוא משרות מהר יותר.",
  },
  {
    icon: Shield,
    color: "#10B981",
    bg: "rgba(16,185,129,0.08)",
    title: "משרות איכות בלבד",
    desc: "אנחנו מוודאים שכל המשרות על הפלטפורמה הן איכותיות ומתאימות.",
  },
  {
    icon: Bell,
    color: "#4F7CFF",
    bg: "rgba(79,124,255,0.08)",
    title: "התראות בזמן אמת",
    desc: "קבל התראות על משרות שמתאימות לפרופיל שלך ברגע שמתפרסמות.",
  },
  {
    icon: TrendingUp,
    color: "#8B5CF6",
    bg: "rgba(139,92,246,0.08)",
    title: "קידום הקריירה שלך",
    desc: "כלים, טיפים, סיכומים שעוזרים לך להתקדם בקריירה שלך.",
  },
]

export default function WhyHeadHunter() {
  return (
    <section dir="rtl" style={{ padding: "96px 0", background: "white" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 32px" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <h2
            style={{
              fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
              fontWeight: 900,
              color: "#0F172A",
              margin: "0 0 14px",
              letterSpacing: "-0.04em",
            }}
          >
            למה מועמדים בוחרים ב-HeadHunter?
          </h2>

          <p
            style={{
              fontSize: 16,
              color: "#64748B",
              maxWidth: 500,
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            פלטפורמה שנבנתה בשביל המועמד — לא בשביל המעסיק
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
            gap: 18,
          }}
        >
          {FEATURES.map((f, i) => {
            const Icon = f.icon

            return (
              <div
                key={i}
                style={{
                  padding: "32px 28px",
                  borderRadius: 8,
                  background: "white",
                  border: "1px solid rgba(108,77,255,0.08)",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                  transition: "all 0.3s",
                  cursor: "default",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-6px)"
                  e.currentTarget.style.boxShadow = "0 20px 60px rgba(108,77,255,0.14)"
                  e.currentTarget.style.borderColor = "rgba(108,77,255,0.2)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = ""
                  e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)"
                  e.currentTarget.style.borderColor = "rgba(108,77,255,0.08)"
                }}
              >
                {f.tag && (
                  <span
                    style={{
                      position: "absolute",
                      top: 18,
                      left: 18,
                      padding: "3px 9px",
                      borderRadius: 8,
                      background: f.tagBg,
                      color: f.tagColor,
                      fontSize: 10.5,
                      fontWeight: 700,
                    }}
                  >
                    {f.tag}
                  </span>
                )}

                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 8,
                    background: f.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 22,
                  }}
                >
                  <Icon style={{ width: 24, height: 24, color: f.color }} />
                </div>

                <h3
                  style={{
                    fontSize: 15.5,
                    fontWeight: 800,
                    color: "#0F172A",
                    margin: "0 0 10px",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {f.title}
                </h3>

                <p style={{ fontSize: 13.5, color: "#64748B", lineHeight: 1.7, margin: 0 }}>
                  {f.desc}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
