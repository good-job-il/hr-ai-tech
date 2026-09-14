import { Link } from "react-router-dom"
import { Globe2 } from "lucide-react"
import { useTranslation } from "react-i18next"

const defaultContent = {
  en: {
    footerDescription:
      "Israel's smart recruitment platform. Connecting quality candidates with leading companies through AI.",
    footerColumns: [
      ["For Candidates", [["Search Jobs", "/jobs"], ["Personal Profile", "/register?type=candidate"], ["AI Matching", "/ai-career"], ["Resume", "/register?type=candidate"]]],
      ["For Companies", [["Post a Job", "/register?type=staffing_agency"], ["Find Candidates", "/register?type=staffing_agency"], ["AI Matching", "/ai-career"], ["Analytics", "/register?type=staffing_agency"]]],
      ["Company", [["About", "/about"], ["Careers", "/about"], ["Blog", "/blog"], ["Contact", "/contact"]]],
    ],
    support: "Support",
    supportLinks: [["Help Center", "/contact"], ["Guides", "/resources"], ["System Status", "/contact"], ["FAQ", "/resources"]],
    copyright: "© 2024 HeadHunter. All rights reserved.",
    terms: "Terms of Use",
    privacy: "Privacy Policy",
    language: "עברית",
  },
  he: {
    footerDescription:
      "פלטפורמת הגיוס החכמה של ישראל. מחברת מועמדים איכותיים עם חברות מובילות באמצעות AI.",
    footerColumns: [
      ["למועמדים", [["חיפוש משרות", "/jobs"], ["פרופיל אישי", "/register?type=candidate"], ["התאמות AI", "/ai-career"], ["קורות חיים", "/register?type=candidate"]]],
      ["לחברות", [["פרסום משרה", "/register?type=staffing_agency"], ["חיפוש מועמדים", "/register?type=staffing_agency"], ["התאמות AI", "/ai-career"], ["אנליטיקה", "/register?type=staffing_agency"]]],
      ["החברה", [["אודות", "/about"], ["קריירה", "/about"], ["בלוג", "/blog"], ["צור קשר", "/contact"]]],
    ],
    support: "תמיכה",
    supportLinks: [["מרכז עזרה", "/contact"], ["מדריכים", "/resources"], ["סטטוס המערכת", "/contact"], ["שאלות נפוצות", "/resources"]],
    copyright: "© 2024 HeadHunter. כל הזכויות שמורות.",
    terms: "תנאי שימוש",
    privacy: "מדיניות פרטיות",
    language: "English",
  },
}

function FooterLinks({ title, links, className = "" }) {
  return (
    <div className={`hh-footer-column ${className}`}>
      <h3>{title}</h3>
      {links.map(([label, href]) => (
        <Link key={label} to={href}>
          {label}
        </Link>
      ))}
    </div>
  )
}

export default function LandingFooter({
  copy: suppliedCopy,
  isEnglish: suppliedIsEnglish,
  changeLanguage: suppliedChangeLanguage,
}) {
  const { i18n } = useTranslation()

  const isEnglish = suppliedIsEnglish ?? i18n.language?.startsWith("en")

  const copy = suppliedCopy || defaultContent[isEnglish ? "en" : "he"]

  const changeLanguage =
    suppliedChangeLanguage || (() => i18n.changeLanguage(isEnglish ? "he" : "en"))

  return (
    <footer className="hh-footer" dir={isEnglish ? "ltr" : "rtl"}>
      <div className="hh-footer-shell">
        <div className="hh-footer-grid">
          <div className="hh-footer-intro">
            <img src="/logo.png" alt="HeadHunter" />
            <p>{copy.footerDescription}</p>
          </div>
          {copy.footerColumns.map(([title, links]) => (
            <FooterLinks key={title} title={title} links={links} />
          ))}
          <FooterLinks
            className="hh-footer-support"
            title={copy.support}
            links={copy.supportLinks}
          />
        </div>
        <div className="hh-footer-bottom">
          <span>{copy.copyright}</span>
          <nav aria-label="Footer">
            <button type="button" onClick={changeLanguage}>
              <Globe2 /> {copy.language}
            </button>
            <Link to="/terms">{copy.terms}</Link>
            <Link to="/privacy">{copy.privacy}</Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
