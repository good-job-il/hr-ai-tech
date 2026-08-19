import { useTranslation } from "react-i18next"
import { Linkedin, Facebook, Instagram, Youtube } from "lucide-react"

const LOGO = "/logo.png"

export default function Footer() {
  const { t, i18n } = useTranslation()

  const isRtl = !i18n.language?.startsWith("en")

  const LINKS = {
    [isRtl ? "למועמדים" : "For Candidates"]: [
      { label: isRtl ? "חיפוש משרות" : "Search Jobs", to: "/jobs" },
      { label: isRtl ? "הרשמה כמועמד" : "Register as Candidate", to: "/register" },
      { label: isRtl ? "התאמות AI" : "AI Matching", to: "/ai-career" },
      { label: isRtl ? "קורות חיים" : "Resume", to: "/resources" },
      { label: isRtl ? "שאלות נפוצות" : "FAQ", to: "/how-it-works" },
    ],
    [isRtl ? "למעסיקים" : "For Employers"]: [
      { label: isRtl ? "פרסם משרה" : "Post a Job", to: "/register" },
      { label: isRtl ? "חיפוש מועמדים" : "Search Candidates", to: "/jobs" },
      { label: isRtl ? "התאמת AI" : "AI Matching", to: "/ai-career" },
      { label: isRtl ? "אנליטיקה" : "Analytics", to: "/about" },
      { label: isRtl ? "תמחור" : "Pricing", to: "/pricing" },
    ],
    [isRtl ? "חברה" : "Company"]: [
      { label: isRtl ? "אודות" : "About", to: "/about" },
      { label: isRtl ? "AI לקריירה" : "AI Career", to: "/ai-career" },
      { label: isRtl ? "בלוג" : "Blog", to: "/blog" },
      { label: isRtl ? "משאבים" : "Resources", to: "/resources" },
      { label: isRtl ? "איך זה עובד?" : "How it works?", to: "/how-it-works" },
    ],
    [isRtl ? "תמיכה" : "Support"]: [
      { label: isRtl ? "צור קשר" : "Contact", to: "/contact" },
      { label: isRtl ? "תמחור" : "Pricing", to: "/pricing" },
      { label: isRtl ? "מדריכים" : "Guides", to: "/resources" },
    ],
  }

  return (
    <footer dir={isRtl ? "rtl" : "ltr"} style={{ background: "#0F172A", color: "white" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "56px 24px 32px" }}>
        {/* Top grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1fr",
            gap: 40,
            marginBottom: 48,
          }}
        >
          {/* Brand */}
          <div>
            <img
              src={LOGO}
              alt="HeadHunter HR-Tech"
              style={{ height: 44, width: "auto", objectFit: "contain", marginBottom: 16 }}
            />
            <p
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.5)",
                lineHeight: 1.7,
                margin: "0 0 20px",
                maxWidth: 220,
              }}
            >
              {isRtl
                ? "פלטפורמת גיוס AI המובילה בישראל — מחברים מועמדים ומעסיקים בצורה חכמה ויעילה."
                : "Israel's leading AI recruitment platform — connecting candidates and employers smartly and efficiently."}
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { Icon: Linkedin, href: "#" },
                { Icon: Facebook, href: "#" },
                { Icon: Instagram, href: "#" },
                { Icon: Youtube, href: "#" },
              ].map(({ Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.07)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(255,255,255,0.5)",
                    textDecoration: "none",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(124,58,237,0.3)"
                    e.currentTarget.style.color = "white"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.07)"
                    e.currentTarget.style.color = "rgba(255,255,255,0.5)"
                  }}
                >
                  <Icon style={{ width: 15, height: 15 }} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(LINKS).map(([category, links]) => (
            <div key={category}>
              <h4
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: "white",
                  margin: "0 0 16px",
                  letterSpacing: "0.02em",
                }}
              >
                {category}
              </h4>
              <ul
                style={{
                  listStyle: "none",
                  margin: 0,
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      style={{
                        fontSize: 13,
                        color: "rgba(255,255,255,0.45)",
                        textDecoration: "none",
                        transition: "color 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.85)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.07)",
            paddingTop: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: 0 }}>
            {t("home.footer.allRightsReserved")}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <LanguageSwitcher variant="minimal" className="text-white/40 hover:text-white/70" />
            <Link
              to="/terms"
              style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textDecoration: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
            >
              {t("home.footer.terms")}
            </Link>
            <Link
              to="/privacy"
              style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textDecoration: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
            >
              {t("home.footer.privacy")}
            </Link>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
              Made with ❤ in Israel
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
