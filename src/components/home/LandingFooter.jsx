import { Link } from "react-router-dom"
import { Globe2 } from "lucide-react"

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

export default function LandingFooter({ copy, isEnglish, changeLanguage }) {
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
