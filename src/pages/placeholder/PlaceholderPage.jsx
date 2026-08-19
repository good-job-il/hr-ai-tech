import { useLocation } from "react-router-dom"
import { Construction } from "lucide-react"

/**
 * Generic placeholder for pages under construction.
 * Shows the current route path for easy identification.
 */
export default function PlaceholderPage({ title, description }) {
  const location = useLocation()
  const pageName =
    title ||
    location.pathname
      .split("/")
      .filter(Boolean)
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " "))
      .join(" › ")

  return (
    <div dir="rtl" className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md px-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F3EFFF] to-[#EAF8FF] flex items-center justify-center mx-auto mb-6">
          <Construction className="w-8 h-8 text-[#7C3AED]" />
        </div>
        <h1 className="text-2xl font-black text-[#0F172A] mb-2">{pageName}</h1>
        <p className="text-[#64748B] font-semibold mb-4">
          {description || "עמוד זה נמצא בפיתוח ויהיה זמין בקרוב."}
        </p>
        <div className="inline-block px-4 py-2 rounded-xl bg-[#F3EFFF] text-[#7C3AED] text-sm font-bold border border-[#E2D8FF]">
          {location.pathname}
        </div>
      </div>
    </div>
  )
}
