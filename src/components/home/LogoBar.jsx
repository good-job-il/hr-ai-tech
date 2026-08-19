const COMPANIES = [
  { name: "WiX", color: "#0F172A", size: 20, weight: 900 },
  { name: "monday.com", color: "#F6543C", size: 15, weight: 800 },
  { name: "Microsoft", color: "#00A4EF", size: 15, weight: 600 },
  { name: "Check Point", color: "#CC0000", size: 14, weight: 700 },
  { name: "SimilarWeb", color: "#0099FF", size: 14, weight: 700 },
  { name: "PayPal", color: "#003087", size: 15, weight: 800 },
  { name: "paloalto", color: "#FA582D", size: 14, weight: 700 },
]

export default function LogoBar() {
  return (
    <section
      dir="rtl"
      style={{
        padding: "36px 0",
        background: "white",
        borderTop: "1px solid rgba(108,77,255,0.06)",
        borderBottom: "1px solid rgba(108,77,255,0.06)",
      }}
    >
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 32px" }}>
        <p
          style={{
            textAlign: "center",
            fontSize: 11.5,
            fontWeight: 700,
            color: "#94A3B8",
            marginBottom: 28,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          החברות המובילות בוחרות בנו
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 48,
            flexWrap: "wrap",
          }}
        >
          {COMPANIES.map((c, i) => (
            <span
              key={i}
              style={{
                fontFamily: "Assistant, sans-serif",
                fontSize: c.size,
                fontWeight: c.weight,
                color: c.color,
                opacity: 0.4,
                transition: "opacity 0.2s",
                cursor: "default",
                letterSpacing: "-0.3px",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.4")}
            >
              {c.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
