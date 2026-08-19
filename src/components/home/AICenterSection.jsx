import React from "react"
import { FileText, Target, MessageSquare, TrendingUp, Sparkles, ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"

const SERVICES = [
  {
    icon: FileText,
    color: "#6C4DFF",
    bg: "rgba(108,77,255,0.08)",
    title: "שדרוג קורות חיים",
    desc: "שפר את קורות החיים שלך עם AI כדי שיבלטו לעיני המעסיקים הנכונים.",
  },
  {
    icon: Target,
    color: "#4F7CFF",
    bg: "rgba(79,124,255,0.08)",
    title: "התאמת משרות חכמה",
    desc: "AI מחפש ומתאים משרות שמתאימות לך בדיוק לפי הפרופיל שלך.",
  },
  {
    icon: MessageSquare,
    color: "#10B981",
    bg: "rgba(16,185,129,0.08)",
    title: "הכנה לראיונות",
    desc: "תרגול שאלות ראיון עם AI מבוסס על פרמטרים של חברות ישראליות.",
  },
  {
    icon: TrendingUp,
    color: "#8B5CF6",
    bg: "rgba(139,92,246,0.08)",
    title: "תובנות קריירה",
    desc: "קבל דוחות אישיים ותובנות לקדם את הקריירה שלך בתחום שלך.",
  },
]

export default function AICenterSection() {
  const navigate = useNavigate()
  return (
    <section
      id="ai-center"
      dir="rtl"
      style={{ padding: "96px 0", background: "white", position: "relative", overflow: "hidden" }}
    >
      {/* Gradient bg */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(108,77,255,0.04) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", maxWidth: 1320, margin: "0 auto", padding: "0 32px" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: 24,
            marginBottom: 56,
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 16px",
                borderRadius: 8,
                marginBottom: 16,
                background: "rgba(108,77,255,0.08)",
                border: "1px solid rgba(108,77,255,0.18)",
              }}
            >
              <Sparkles style={{ width: 12, height: 12, color: "#6C4DFF" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#6C4DFF" }}>
                חדש! מרכז AI לקריירה
              </span>
            </div>
            <h2
              style={{
                fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
                fontWeight: 900,
                color: "#0F172A",
                margin: "0 0 12px",
                letterSpacing: "-0.04em",
              }}
            >
              מרכז AI לקריירה
            </h2>
            <p
              style={{ fontSize: 15, color: "#64748B", maxWidth: 420, lineHeight: 1.75, margin: 0 }}
            >
              כלים חכמים שמלווים אותך בכל שלב — מהרשמה עד לקבלת העבודה שלך.
            </p>
          </div>
          <button
            onClick={() => navigate("/register")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "11px 22px",
              borderRadius: 8,
              background: "linear-gradient(135deg, #6C4DFF, #4F7CFF)",
              color: "white",
              border: "none",
              cursor: "pointer",
              fontSize: 13.5,
              fontWeight: 700,
              boxShadow: "0 6px 20px rgba(108,77,255,0.35)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)"
              e.currentTarget.style.boxShadow = "0 10px 28px rgba(108,77,255,0.45)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = ""
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(108,77,255,0.35)"
            }}
          >
            <Sparkles style={{ width: 13, height: 13 }} /> כניסה למרכז
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 18,
          }}
        >
          {SERVICES.map((s, i) => {
            const Icon = s.icon
            return (
              <div
                key={i}
                style={{
                  padding: "32px 28px",
                  borderRadius: 8,
                  background: "white",
                  border: "1px solid rgba(108,77,255,0.08)",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                  cursor: "default",
                  transition: "all 0.3s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-6px)"
                  e.currentTarget.style.boxShadow = "0 24px 64px rgba(108,77,255,0.14)"
                  e.currentTarget.style.borderColor = "rgba(108,77,255,0.22)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = ""
                  e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)"
                  e.currentTarget.style.borderColor = "rgba(108,77,255,0.08)"
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 8,
                    background: s.bg,
                    marginBottom: 22,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon style={{ width: 24, height: 24, color: s.color }} />
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
                  {s.title}
                </h3>
                <p
                  style={{ fontSize: 13.5, color: "#64748B", lineHeight: 1.7, margin: "0 0 18px" }}
                >
                  {s.desc}
                </p>
                <button
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: s.color,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  לחצו להתחיל <ArrowLeft style={{ width: 12, height: 12 }} />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
