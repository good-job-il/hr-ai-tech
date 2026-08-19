import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { organizationService } from "@/api/services/organizationService"
import { useAuth } from "@/lib/AuthContext"
import { toast } from "@/components/ui/use-toast"
import { Building2 } from "lucide-react"

/**
 * AgencyOnboarding
 *
 * Landing step for an org_admin who has registered/logged in but doesn't
 * belong to an organization yet. They must create their staffing agency
 * here before they can reach any /agency/* route — ProtectedRoute redirects
 * here automatically (see `noOrgRedirect` on the agency route group in
 * App.jsx) instead of showing "unauthorized".
 */
export default function AgencyOnboarding() {
  const { i18n } = useTranslation()

  const isRtl = !i18n.language?.startsWith("en")

  const navigate = useNavigate()

  const { organization, isLoadingAuth, checkUserAuth } = useAuth()

  const [name, setName] = useState("")

  const [contactEmail, setContactEmail] = useState("")

  const [error, setError] = useState("")

  const [loading, setLoading] = useState(false)

  // Already onboarded (has an org) — nothing to do here, go straight in.
  useEffect(() => {
    if (!isLoadingAuth && organization) {
      navigate("/agency/dashboard", { replace: true })
    }
  }, [isLoadingAuth, organization, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (!name.trim()) {
      setError(isRtl ? "יש להזין שם לחברת ההשמה" : "Please enter your agency name")

      return
    }

    setLoading(true)

    try {
      await organizationService.onboardAgency({
        name: name.trim(),
        contact_email: contactEmail.trim() || undefined,
      })

      // Refresh auth context so `organization` / `orgType` reflect the new
      // agency before we navigate into the gated /agency/* routes.
      await checkUserAuth()
      navigate("/agency/dashboard", { replace: true })
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        (isRtl ? "שגיאה ביצירת הארגון" : "Error creating organization")

      setError(msg)
      toast({ title: msg, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  if (isLoadingAuth) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center bg-[#F7FBFF]"
        role="status"
        aria-live="polite"
      >
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-[#E4ECFF] border-t-[#7C3AED]"
          aria-hidden="true"
        />
        <span className="sr-only">{isRtl ? "טוען" : "Loading"}</span>
      </div>
    )
  }

  return (
    <PlatformPageShell
      dir={isRtl ? "rtl" : "ltr"}
      className="m-0 flex min-h-screen items-center justify-center p-4 sm:p-6"
    >
      <div className="w-full max-w-lg space-y-5">
        <PlatformPageHeader
          title={isRtl ? "הקמת חברת ההשמה שלך" : "Set up your staffing agency"}
          subtitle={
            isRtl
              ? "עוד צעד אחד קטן — הקם את הארגון שלך כדי להתחיל לגייס"
              : "One last step — create your organization to start recruiting"
          }
          icon={Building2}
          className="justify-center text-center sm:flex-col"
        />
        <PlatformCard className="p-6 sm:p-8">
          {error && (
            <div
              className="mb-6 flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700"
              role="alert"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label
                htmlFor="agency-name"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                {isRtl ? "שם חברת ההשמה" : "Agency name"}
              </Label>
              <Input
                id="agency-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-11 border-slate-200 focus-visible:ring-violet-200"
                placeholder={isRtl ? 'לדוגמה: השמה פרו בע"מ' : "e.g. Acme Staffing Ltd."}
              />
            </div>
            <div>
              <Label
                htmlFor="agency-contact-email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                {isRtl ? "אימייל ליצירת קשר (אופציונלי)" : "Contact email (optional)"}
              </Label>
              <Input
                id="agency-contact-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="h-11 border-slate-200 focus-visible:ring-violet-200"
                placeholder="agency@example.com"
                dir="ltr"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-xl bg-violet-600 text-base font-bold text-white hover:bg-violet-700"
            >
              {loading
                ? isRtl
                  ? "יוצר ארגון..."
                  : "Creating organization..."
                : isRtl
                  ? "צור את הארגון שלי"
                  : "Create my organization"}
            </Button>
          </form>
        </PlatformCard>
      </div>
    </PlatformPageShell>
  )
}
