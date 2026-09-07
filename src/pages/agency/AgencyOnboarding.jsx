import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Settings2,
  Users,
} from "lucide-react"
import { organizationService } from "@/api/services/organizationService"
import { agencyTeamsService } from "@/api/services/agencyTeamsService"
import { useAuth } from "@/lib/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  PlatformCard,
  PlatformPageHeader,
  PlatformPageShell,
} from "@/components/platform/PlatformUI"

const splitList = (value) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)

export default function AgencyOnboarding() {
  const { i18n } = useTranslation()

  const isRtl = !i18n.language?.startsWith("en")

  const navigate = useNavigate()

  const { organization, isLoadingAuth, checkUserAuth, user } = useAuth()

  const [step, setStep] = useState(0)

  const [form, setForm] = useState({
    name: "",
    contactEmail: user?.email || "",
    phone: user?.phone || "",
    website: "",
    city: "",
    specializations: "",
    teamSize: "1-5",
    regions: "",
    hiresMonthly: "",
    firstTeamName: "",
  })

  const [error, setError] = useState("")

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isLoadingAuth && organization) {
      navigate("/agency/dashboard", { replace: true })
    }
  }, [isLoadingAuth, organization, navigate])

  const steps = useMemo(
    () =>
      isRtl
        ? ["פרטי הארגון", "פעילות וגיוס", "הגדרת סביבת העבודה", "בדיקה וסיום"]
        : ["Organization", "Recruiting activity", "Workspace setup", "Review & finish"],
    [isRtl],
  )

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  const next = () => {
    if (step === 0 && (!form.name.trim() || !form.contactEmail.trim())) {
      setError(
        isRtl ? "יש למלא שם חברה ואימייל ליצירת קשר" : "Add an organization name and contact email",
      )

      return
    }

    if (step === 1 && !splitList(form.specializations).length) {
      setError(
        isRtl ? "יש להוסיף לפחות תחום התמחות אחד" : "Add at least one recruiting specialization",
      )

      return
    }

    setError("")
    setStep((current) => Math.min(current + 1, steps.length - 1))
  }

  const finish = async () => {
    setLoading(true)
    setError("")

    try {
      await organizationService.onboardAgency({
        name: form.name.trim(),
        contact_email: form.contactEmail.trim(),
        settings: {
          phone: form.phone.trim() || null,
          website: form.website.trim() || null,
          city: form.city.trim() || null,
          specializations: splitList(form.specializations),
          team_size: form.teamSize,
          regions: splitList(form.regions),
          expected_monthly_hires: form.hiresMonthly ? Number(form.hiresMonthly) : null,
          first_team_name: form.firstTeamName.trim() || null,
          onboarding_completed: true,
        },
      })
      await checkUserAuth()

      if (form.firstTeamName.trim()) {
        try {
          await agencyTeamsService.createTeam({ name: form.firstTeamName.trim() })
        } catch (teamError) {
          console.warn("[AgencyOnboarding] first team creation failed", teamError)
        }
      }

      navigate("/agency/dashboard", { replace: true })
    } catch (submitError) {
      setError(
        submitError?.message ||
          (isRtl ? "יצירת סביבת העבודה נכשלה" : "Could not create your workspace"),
      )
    } finally {
      setLoading(false)
    }
  }

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#F7FBFF]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E4ECFF] border-t-[#7C3AED]" />
      </div>
    )
  }

  const BackIcon = isRtl ? ArrowRight : ArrowLeft

  const NextIcon = isRtl ? ArrowLeft : ArrowRight

  return (
    <PlatformPageShell dir={isRtl ? "rtl" : "ltr"} className="m-0 min-h-screen p-4 sm:p-8">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <PlatformPageHeader
          title={isRtl ? "הקמת חברת ההשמה שלך" : "Set up your staffing organization"}
          subtitle={
            isRtl
              ? "כמה פרטים קצרים ונכין עבורך סביבת עבודה מלאה לגיוס"
              : "A few details and your recruiting workspace will be ready"
          }
          icon={Building2}
          className="justify-center text-center sm:flex-col"
        />
        <PlatformCard className="overflow-hidden p-0">
          <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-5 sm:px-8">
            <div className="mb-3 flex items-center justify-between text-sm font-bold text-slate-600">
              <span>{steps[step]}</span>
              <span>
                {step + 1} / {steps.length}
              </span>
            </div>
            <Progress
              value={((step + 1) / steps.length) * 100}
              className="bg-violet-100 [&>div]:bg-violet-600"
            />
          </div>
          <div className="p-6 sm:p-8">
            {error && (
              <div
                className="mb-6 flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700"
                role="alert"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {step === 0 && (
              <div className="space-y-5">
                <StepHeading
                  icon={Building2}
                  title={isRtl ? "ספר לנו על הארגון" : "Tell us about the organization"}
                  text={
                    isRtl
                      ? "פרטים אלה יופיעו בפרופיל הארגון ובתקשורת עם לקוחות."
                      : "These details identify your organization across the workspace."
                  }
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label={isRtl ? "שם חברת ההשמה" : "Organization name"}
                    value={form.name}
                    onChange={(v) => update("name", v)}
                    className="sm:col-span-2"
                  />
                  <Field
                    label={isRtl ? "אימייל ליצירת קשר" : "Contact email"}
                    value={form.contactEmail}
                    onChange={(v) => update("contactEmail", v)}
                    type="email"
                    dir="ltr"
                  />
                  <Field
                    label={isRtl ? "טלפון" : "Phone"}
                    value={form.phone}
                    onChange={(v) => update("phone", v)}
                    dir="ltr"
                  />
                  <Field
                    label={isRtl ? "אתר" : "Website"}
                    value={form.website}
                    onChange={(v) => update("website", v)}
                    placeholder="https://"
                    dir="ltr"
                  />
                  <Field
                    label={isRtl ? "עיר" : "City"}
                    value={form.city}
                    onChange={(v) => update("city", v)}
                  />
                </div>
              </div>
            )}
            {step === 1 && (
              <div className="space-y-5">
                <StepHeading
                  icon={Users}
                  title={isRtl ? "איך צוות הגיוס שלך עובד?" : "How does your recruiting team work?"}
                  text={
                    isRtl
                      ? "נשתמש במידע כדי להתאים את סביבת העבודה והדוחות."
                      : "We’ll tailor the workspace and reports to your recruiting activity."
                  }
                />
                <Field
                  label={
                    isRtl
                      ? "תחומי התמחות — מופרדים בפסיקים"
                      : "Specializations — separated by commas"
                  }
                  value={form.specializations}
                  onChange={(v) => update("specializations", v)}
                  placeholder={isRtl ? "הייטק, כספים, תפעול" : "Technology, Finance, Operations"}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="mb-2 block font-bold text-slate-700">
                      {isRtl ? "גודל צוות הגיוס" : "Recruiting team size"}
                    </Label>
                    <select
                      value={form.teamSize}
                      onChange={(e) => update("teamSize", e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3"
                    >
                      <option>1-5</option>
                      <option>6-15</option>
                      <option>16-50</option>
                      <option>50+</option>
                    </select>
                  </div>
                  <Field
                    label={isRtl ? "גיוסים צפויים בחודש" : "Expected hires per month"}
                    value={form.hiresMonthly}
                    onChange={(v) => update("hiresMonthly", v)}
                    type="number"
                  />
                </div>
                <Field
                  label={isRtl ? "אזורי פעילות — מופרדים בפסיקים" : "Regions — separated by commas"}
                  value={form.regions}
                  onChange={(v) => update("regions", v)}
                  placeholder={isRtl ? "מרכז, צפון, עבודה מרחוק" : "Central, North, Remote"}
                />
              </div>
            )}
            {step === 2 && (
              <div className="space-y-5">
                <StepHeading
                  icon={Settings2}
                  title={isRtl ? "הכן את סביבת העבודה" : "Prepare your workspace"}
                  text={
                    isRtl
                      ? "אפשר להוסיף חברי צוות והרשאות מיד לאחר הכניסה למערכת."
                      : "You can invite teammates and assign permissions once you enter the workspace."
                  }
                />
                <Field
                  label={isRtl ? "שם הצוות הראשון (אופציונלי)" : "First team name (optional)"}
                  value={form.firstTeamName}
                  onChange={(v) => update("firstTeamName", v)}
                  placeholder={isRtl ? "לדוגמה: צוות הייטק" : "e.g. Technology recruiting"}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    isRtl ? "הוספת לקוח ראשון" : "Add your first client",
                    isRtl ? "יצירת משרה" : "Create a job",
                    isRtl ? "הזמנת מגייסים" : "Invite recruiters",
                    isRtl ? "ייבוא מועמדים" : "Import candidates",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 font-bold text-slate-700"
                    >
                      <Check className="h-5 w-5 text-emerald-600" />
                      {item}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-slate-500">
                  {isRtl
                    ? "המשימות יופיעו כרשימת התחלה בדשבורד שלך."
                    : "These tasks will appear as a getting-started checklist on your dashboard."}
                </p>
              </div>
            )}
            {step === 3 && (
              <div className="space-y-5">
                <StepHeading
                  icon={Check}
                  title={isRtl ? "הארגון מוכן ליצירה" : "Your organization is ready"}
                  text={
                    isRtl
                      ? "בדוק את הפרטים העיקריים לפני יצירת סביבת העבודה."
                      : "Review the key details before creating the workspace."
                  }
                />
                <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-6">
                  <h3 className="text-2xl font-black text-slate-950">{form.name}</h3>
                  <p className="mt-1 text-slate-600">
                    {form.contactEmail}
                    {form.city ? ` · ${form.city}` : ""}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {splitList(form.specializations).map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-violet-700 shadow-sm"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                  <p className="mt-5 text-sm font-semibold text-slate-600">
                    {isRtl ? `גודל צוות: ${form.teamSize}` : `Team size: ${form.teamSize}`}
                  </p>
                </div>
              </div>
            )}
            <div className="mt-9 flex items-center justify-between gap-3 border-t border-slate-100 pt-6">
              <Button
                type="button"
                variant="outline"
                disabled={step === 0 || loading}
                onClick={() => setStep((current) => current - 1)}
                className="h-12 rounded-xl px-5"
              >
                <BackIcon className="h-4 w-4" />
                {isRtl ? "חזרה" : "Back"}
              </Button>
              {step < steps.length - 1 ? (
                <Button
                  type="button"
                  onClick={next}
                  className="h-12 rounded-xl bg-violet-600 px-7 font-bold text-white hover:bg-violet-700"
                >
                  {isRtl ? "המשך" : "Continue"}
                  <NextIcon className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={loading}
                  onClick={finish}
                  className="h-12 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-7 font-bold text-white"
                >
                  {loading
                    ? isRtl
                      ? "יוצר ארגון..."
                      : "Creating workspace..."
                    : isRtl
                      ? "יצירת סביבת העבודה"
                      : "Create my workspace"}
                </Button>
              )}
            </div>
          </div>
        </PlatformCard>
      </div>
    </PlatformPageShell>
  )
}

function StepHeading({ icon: Icon, title, text }) {
  return (
    <div className="mb-7 flex items-start gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-xl font-black text-slate-950">{title}</h2>
        <p className="mt-1 text-slate-600">{text}</p>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = "text", placeholder, dir, className = "" }) {
  return (
    <div className={className}>
      <Label className="mb-2 block font-bold text-slate-700">{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        dir={dir}
        className="h-11 rounded-xl border-slate-200"
      />
    </div>
  )
}
