import { useTranslation } from "react-i18next"
import Navbar from "@/components/home/Navbar"
import Footer from "@/components/home/Footer"

export default function PublicLayout({ children }) {
  const { i18n } = useTranslation()
  const isRtl = !i18n.language?.startsWith("en")

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-white">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  )
}
