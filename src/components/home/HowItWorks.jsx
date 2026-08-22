import { UserCheck, Bot, Send, Trophy } from "lucide-react"

const STEPS = [
  {
    n: 1,
    icon: UserCheck,
    color: "#6C4DFF",
    bg: "rgba(108,77,255,0.08)",
    title: "יוצרים פרופיל",
    desc: "בנה קורות חיים עם AI וצור פרופיל מקצועי בקלות.",
  },
  {
    n: 2,
    icon: Bot,
    color: "#4F7CFF",
    bg: "rgba(79,124,255,0.08)",
    title: "AI מתאים עבורך",
    desc: "המנוע שלנו מנתח ומוצא את המשרות הכי מתאימות לך.",
  },
  {
    n: 3,
    icon: Send,
    color: "#8B5CF6",
    bg: "rgba(139,92,246,0.08)",
    title: "מגישים בקליק",
    desc: "הגש מועמדות למשרות בלחיצה אחת, בהתאמה מלאה.",
  },
  {
    n: 4,
    icon: Trophy,
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.08)",
    title: "מקדמים קריירה",
    desc: "קבל תובנות, הכנה לראיון ומעקב על כל ההגשות שלך.",
  },
]

const CONNECTOR = (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: 40,
      flexShrink: 0,
      paddingTop: 36,
    }}
  >
    <div
      style={{
        height: 2,
        width: "100%",
        background:
          "linear-gradient(90deg, rgba(108,77,255,0.15), rgba(79,124,255,0.4), rgba(108,77,255,0.15))",
        borderRadius: 8,
      }}
    />
  </div>
)

export default function HowItWorks() {
  return (
    <section id="how" dir="rtl" style={{ padding: "96px 0", background: "white" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 32px" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <h2
            style={{
              fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
              fontWeight: 900,
              color: "#0F172A",
              margin: "0 0 12px",
              letterSpacing: "-0.04em",
            }}
          >
            איך זה עובד?
          </h2>

          <p style={{ fontSize: 15, color: "#64748B", margin: 0 }}>
            4 שלבים פשוטים למצוא עבודה טוב יותר
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", gap: 0 }}>
          {STEPS.map((step, i) => {
            const Icon = step.icon

            return (
              <React.Fragment key={i}>
                <div
                  style={{
                    flex: 1,
                    padding: "32px 24px",
                    borderRadius: 8,
                    background: "white",
                    border: "1px solid rgba(108,77,255,0.08)",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                    textAlign: "center",
                    position: "relative",
                    transition: "all 0.3s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-6px)"
                    e.currentTarget.style.boxShadow = "0 20px 56px rgba(108,77,255,0.14)"
                    e.currentTarget.style.borderColor = "rgba(108,77,255,0.2)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = ""
                    e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)"
                    e.currentTarget.style.borderColor = "rgba(108,77,255,0.08)"
                  }}
                >
                  {/* Step number */}
                  <div
                    style={{
                      position: "absolute",
                      top: 18,
                      right: 18,
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #6C4DFF, #4F7CFF)",
                      color: "white",
                      fontSize: 12,
                      fontWeight: 900,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 4px 10px rgba(108,77,255,0.4)",
                    }}
                  >
                    {step.n}
                  </div>

                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 8,
                      background: step.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 22px",
                    }}
                  >
                    <Icon style={{ width: 30, height: 30, color: step.color }} />
                  </div>

                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: "#0F172A",
                      margin: "0 0 10px",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {step.title}
                  </h3>

                  <p style={{ fontSize: 13.5, color: "#64748B", lineHeight: 1.7, margin: 0 }}>
                    {step.desc}
                  </p>
                </div>

                {i < STEPS.length - 1 && CONNECTOR}
              </React.Fragment>
            )
          })}
        </div>
      </div>
    </section>
  )
}
import React from "react"
