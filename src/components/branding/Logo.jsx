import { useNavigate } from "react-router-dom"
import { useAuth } from "@/lib/AuthContext"

const LOGO_URL = "/logo.png"

function getHomeRoute(role) {
  switch (role) {
    case "admin":
      return "/platform/dashboard"
    case "org_admin":
    case "recruitment_manager":
      return "/agency/dashboard"
    case "team_manager":
      return "/agency/team/dashboard"
    case "recruiter":
      return "/agency/recruiter/dashboard"
    case "employer":
      return "/employer/dashboard"
    case "candidate":
      return "/candidate/dashboard"
    default:
      return "/"
  }
}

export default function Logo({ size = "md", href, className = "" }) {
  const navigate = useNavigate()

  const { user } = useAuth()

  const destination = href !== undefined ? href : getHomeRoute(user?.role)

  const handleClick = (e) => {
    e.preventDefault()

    if (destination) {
      navigate(destination)
    }
  }

  return (
    <a
      href={destination || "/"}
      onClick={handleClick}
      className="inline-flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
      style={{ textDecoration: "none" }}
    >
      <div className="relative">
        <img
          src={LOGO_URL}
          alt="HeadHunter"
          style={{
            height: "60px",
            width: "auto",
            maxWidth: "100%",
            objectFit: "contain",
            objectPosition: "left center",
            imageRendering: "-webkit-optimize-contrast",
          }}
          className={className}
        />
      </div>

      {/*<span className="hidden md:block text-lg font-black bg-gradient-to-r from-[#7C3AED] to-[#2563EB] bg-clip-text text-transparent">*/}
      {/*  HeadHunter*/}
      {/*</span>*/}
    </a>
  )
}
