import React, { useState } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { authService } from "@/api/services/authService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import LanguageSwitcher from "@/components/ui/LanguageSwitcher"

export default function Login() {
  const { t, i18n } = useTranslation()
  const isRtl = !i18n.language?.startsWith("en")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await authService.login(email, password)

      const user = await authService.me()
      const role = user.role || user.user_type || ""
      const redirects = {
        candidate: "/candidate/dashboard",
        employer: "/employer/dashboard",
        recruiter: "/recruiter/dashboard",
        team_manager: "/recruitment/jobs",
        recruitment_manager: "/recruitment/jobs",
        admin: "/admin/dashboard",
        hr_manager: "/company/dashboard",
        internal_recruiter: "/company/recruiter/dashboard",
        // org_admin without an organization yet gets bounced to onboarding
        // automatically by ProtectedRoute; company-type admins go straight
        // to their dashboard.
        org_admin: user.org_type === "organization" ? "/company/dashboard" : "/agency/dashboard",
      }

      window.location.href = redirects[role] || "/"
    } catch (err) {
      setError(err.message || t("auth.login.loginError"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      dir={isRtl ? "rtl" : "ltr"}
      style={{ backgroundColor: "#eaf7fb" }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-6">
          <img
            src="/logo.png"
            alt="HeadHunter HR-Tech"
            className="h-16 w-auto object-contain mx-auto mb-3"
          />
          <h1 className="text-xl font-bold text-gray-900">{t("auth.login.title")}</h1>
          <p className="text-sm text-gray-500 mt-1">{t("auth.login.subtitle")}</p>
        </div>

        <div className="flex justify-center mb-4">
          <LanguageSwitcher variant="badge" />
        </div>

        {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3 mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-sm text-gray-700">{t("auth.login.email")}</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
              dir="ltr"
            />
          </div>
          <div>
            <Label className="text-sm text-gray-700">{t("auth.login.password")}</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1"
              dir="ltr"
            />
          </div>
          <div className={isRtl ? "text-left" : "text-right"}>
            <Link to="/forgot-password" className="text-hhblue text-sm hover:underline">
              {t("auth.login.forgotPassword")}
            </Link>
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white h-11 font-semibold"
          >
            {loading ? t("auth.login.loggingIn") : t("auth.login.loginButton")}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          {t("auth.login.noAccount")}{" "}
          <Link to="/register" className="text-hhblue font-semibold hover:underline">
            {t("auth.login.createFree")}
          </Link>
        </p>
      </div>
    </div>
  )
}
