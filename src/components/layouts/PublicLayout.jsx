import { useTranslation } from "react-i18next"

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
