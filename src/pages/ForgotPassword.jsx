import React, { useState } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { authService } from "@/api/services/authService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import LanguageSwitcher from "@/components/ui/LanguageSwitcher"

export default function ForgotPassword() {
  const { t, i18n } = useTranslation()
  const isRtl = !i18n.language?.startsWith("en")
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authService.requestPasswordReset(email)
    } catch {}
    setSent(true)
    setLoading(false)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      dir={isRtl ? "rtl" : "ltr"}
      style={{ backgroundColor: "#eaf7fb" }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg mx-auto mb-3">
            HH
          </div>
          <h1 className="text-xl font-bold text-gray-900">{t("auth.forgotPassword.title")}</h1>
          <p className="text-sm text-gray-500 mt-1">{t("auth.forgotPassword.subtitle")}</p>
        </div>

        <div className="flex justify-center mb-4">
          <LanguageSwitcher variant="badge" />
        </div>

        {sent ? (
          <div className="text-center">
            <div className="text-4xl mb-4">📬</div>
            <p className="text-green-700 font-semibold mb-1">
              {isRtl ? "שלחנו לך אימייל!" : "Email sent!"}
            </p>
            <p className="text-gray-500 text-sm mb-5">
              {isRtl
                ? "אם הכתובת קיימת אצלנו — הקישור כבר בדרך. בדוק גם את תיקיית הספאם."
                : "If the address exists in our system — the link is on its way. Check spam too."}
            </p>
            <Link to="/login" className="text-blue-600 text-sm font-semibold hover:underline">
              {t("auth.forgotPassword.backToLogin")}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-sm text-gray-700">{t("auth.forgotPassword.email")}</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
                dir="ltr"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white h-11 font-semibold"
            >
              {loading ? t("auth.forgotPassword.sending") : t("auth.forgotPassword.sendButton")}
            </Button>
            <p className="text-center">
              <Link to="/login" className="text-blue-600 text-sm hover:underline">
                {isRtl ? "← " : ""}
                {t("auth.forgotPassword.backToLogin")}
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
