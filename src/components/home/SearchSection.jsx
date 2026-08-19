import { useState } from "react"
import { useNavigate } from "react-router-dom"

const QUICK_TAGS = [
  "Full Stack מפתח",
  "Data Analyst",
  "DevOps",
  "UX/UI Designer",
  "מנהל/ת מוצר",
  "Frontend מפתח",
  "שיווק דיגיטלי",
]

const DOMAINS = [
  "כל התחומים",
  "הנדסה ופיתוח",
  "עיצוב",
  "שיווק",
  "מוצר",
  "מכירות",
  "כספים",
  "משאבי אנוש",
]

const TYPES = ["כל הסוגים", "משרה מלאה", "חלקית", "מרחוק", "יומי"]

export default function SearchSection() {
  const navigate = useNavigate()

  const [keyword, setKeyword] = useState("")

  const [location, setLocation] = useState("")

  const [domain, setDomain] = useState("כל התחומים")

  const [type, setType] = useState("כל הסוגים")

  const handleSearch = () => {
    const p = new URLSearchParams()

    if (keyword) {
      p.set("q", keyword)
    }

    if (location) {
      p.set("location", location)
    }

    if (domain !== "כל התחומים") {
      p.set("domain", domain)
    }

    navigate(`/jobs?${p.toString()}`)
  }

  return (
    <section
      dir="rtl"
      style={{ padding: "96px 0", background: "#F8FAFF", position: "relative", overflow: "hidden" }}
    >
      {/* bg glow */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          width: 800,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(108,77,255,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", maxWidth: 1320, margin: "0 auto", padding: "0 32px" }}>
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <h2
            style={{
              fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
              fontWeight: 900,
              color: "#0F172A",
              margin: "0 0 12px",
              letterSpacing: "-0.04em",
            }}
          >
            חפש משרות שמתאימות לך
          </h2>

          <p style={{ fontSize: 15, color: "#64748B", margin: 0 }}>מצא את ההדמנות הבאה שלך</p>
        </div>

        {/* Search container */}
        <div
          style={{
            background: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(20px)",
            border: "1.5px solid rgba(108,77,255,0.12)",
            borderRadius: 8,
            padding: 10,
            display: "flex",
            gap: 0,
            alignItems: "stretch",
            boxShadow: "0 8px 40px rgba(108,77,255,0.1), 0 2px 12px rgba(0,0,0,0.04)",
            maxWidth: 960,
            margin: "0 auto 24px",
          }}
        >
          {/* Keyword */}
          <div
            style={{
              flex: 3,
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "0 18px",
              borderLeft: "1px solid rgba(108,77,255,0.1)",
            }}
          >
            <Search style={{ width: 16, height: 16, color: "#6C4DFF", flexShrink: 0 }} />

            <input
              type="text"
              dir="rtl"
              placeholder="תפקיד, תחום או מילות מפתח..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: 14,
                color: "#0F172A",
                background: "transparent",
                fontFamily: "Assistant,sans-serif",
              }}
            />
          </div>

          {/* Location */}
          <div
            style={{
              flex: 2,
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "0 18px",
              borderLeft: "1px solid rgba(108,77,255,0.1)",
            }}
          >
            <MapPin style={{ width: 16, height: 16, color: "#94A3B8", flexShrink: 0 }} />

            <input
              type="text"
              dir="rtl"
              placeholder="עיר, אזור..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: 14,
                color: "#0F172A",
                background: "transparent",
                fontFamily: "Assistant,sans-serif",
              }}
            />
          </div>

          {/* Domain */}
          <div
            style={{
              flex: 2,
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "0 18px",
              borderLeft: "1px solid rgba(108,77,255,0.1)",
              position: "relative",
            }}
          >
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              dir="rtl"
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: 14,
                color: "#64748B",
                background: "transparent",
                fontFamily: "Assistant,sans-serif",
                cursor: "pointer",
                appearance: "none",
              }}
            >
              {DOMAINS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>

            <ChevronDown
              style={{
                width: 13,
                height: 13,
                color: "#94A3B8",
                flexShrink: 0,
                pointerEvents: "none",
              }}
            />
          </div>

          {/* Type */}
          <div
            style={{
              flex: 1.5,
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "0 14px",
              position: "relative",
            }}
          >
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              dir="rtl"
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: 14,
                color: "#64748B",
                background: "transparent",
                fontFamily: "Assistant,sans-serif",
                cursor: "pointer",
                appearance: "none",
              }}
            >
              {TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>

            <ChevronDown
              style={{
                width: 13,
                height: 13,
                color: "#94A3B8",
                flexShrink: 0,
                pointerEvents: "none",
              }}
            />
          </div>

          {/* Button */}
          <button
            onClick={handleSearch}
            style={{
              height: 50,
              padding: "0 32px",
              borderRadius: 8,
              background: "linear-gradient(135deg, #7C4DFF 0%, #4F7CFF 100%)",
              color: "white",
              border: "none",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 700,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 4px 16px rgba(108,77,255,0.4)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)"
              e.currentTarget.style.boxShadow = "0 6px 24px rgba(108,77,255,0.5)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = ""
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(108,77,255,0.4)"
            }}
          >
            <Search style={{ width: 15, height: 15 }} />
            חיפוש משרות
          </button>
        </div>

        {/* Quick tags */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 12.5, color: "#94A3B8", fontWeight: 600 }}>
            חיפושים אחרונים:
          </span>

          {QUICK_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => {
                setKeyword(tag)
                handleSearch()
              }}
              style={{
                padding: "5px 14px",
                borderRadius: 8,
                background: "white",
                border: "1px solid rgba(108,77,255,0.15)",
                fontSize: 12.5,
                fontWeight: 600,
                color: "#6C4DFF",
                cursor: "pointer",
                transition: "all 0.15s",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(108,77,255,0.08)"
                e.currentTarget.style.borderColor = "#6C4DFF"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "white"
                e.currentTarget.style.borderColor = "rgba(108,77,255,0.15)"
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
