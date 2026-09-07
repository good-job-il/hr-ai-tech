import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  FileUp,
  Sparkles,
  User,
} from "lucide-react"
import { authService } from "@/api/services/authService"
import { candidateProfileService } from "@/api/services/candidateProfileService"
import { fileService } from "@/api/services/fileService"
import { useAuth } from "@/lib/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"

const splitList = (value) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)

export default function CandidateOnboarding() {
  const { i18n } = useTranslation()

  const isRtl = !i18n.language?.startsWith("en")

  const navigate = useNavigate()

  const { user, checkUserAuth } = useAuth()

  const [step, setStep] = useState(0)

  const [loading, setLoading] = useState(false)

  const [uploading, setUploading] = useState(false)

  const [error, setError] = useState("")

  const [form, setForm] = useState({
    full_name: user?.full_name || "",
    phone: user?.phone || "",
    location: "",
    title: "",
    summary: "",
    skills: "",
    experience_years: "",
    education: "",
    company: "",
    role: "",
    years: "",
    categories: "",
    desired_salary_min: "",
    desired_salary_max: "",
    job_type: "any",
    resume_url: "",
    is_public: true,
    is_open_to_work: true,
  })

  useEffect(() => {
    if (user?.profile_completed) {
      navigate("/candidate/dashboard", { replace: true })
    }
  }, [navigate, user?.profile_completed])

  const steps = useMemo(
    () =>
      isRtl
        ? ["פרטים בסיסיים", "ניסיון וכישורים", "העדפות עבודה", "בדיקה וסיום"]
        : ["The basics", "Experience & skills", "Job preferences", "Review & finish"],
    [isRtl],
  )

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  const validateStep = () => {
    if (step === 0 && (!form.full_name.trim() || !form.location.trim() || !form.title.trim())) {
      setError(
        isRtl
          ? "יש למלא שם, מיקום ותפקיד מבוקש כדי להמשיך"
          : "Add your name, location and desired role to continue",
      )

      return false
    }

    if (step === 1 && !splitList(form.skills).length) {
      setError(isRtl ? "יש להוסיף לפחות מיומנות אחת" : "Add at least one skill")

      return false
    }

    setError("")

    return true
  }

  const next = () => {
    if (validateStep()) {
      setStep((current) => Math.min(current + 1, steps.length - 1))
    }
  }

  const uploadResume = async (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setUploading(true)
    setError("")

    try {
      const result = await fileService.upload(file)

      update("resume_url", result.file_url)
    } catch (uploadError) {
      setError(uploadError?.message || (isRtl ? "העלאת הקובץ נכשלה" : "Resume upload failed"))
    } finally {
      setUploading(false)
    }
  }

  const finish = async () => {
    setLoading(true)
    setError("")

    const experience =
      form.company.trim() || form.role.trim()
        ? [{ company: form.company.trim(), role: form.role.trim(), years: form.years.trim() }]
        : []

    const payload = {
      full_name: form.full_name.trim(),
      phone: form.phone.trim() || null,
      location: form.location.trim(),
      title: form.title.trim(),
      summary: form.summary.trim() || null,
      skills: splitList(form.skills),
      experience_years: form.experience_years === "" ? null : Number(form.experience_years),
      education: form.education.trim() || null,
      experience,
      desired_salary_min: form.desired_salary_min === "" ? null : Number(form.desired_salary_min),
      desired_salary_max: form.desired_salary_max === "" ? null : Number(form.desired_salary_max),
      job_type: form.job_type,
      categories: splitList(form.categories),
      is_public: form.is_public,
      is_open_to_work: form.is_open_to_work,
      resume_url: form.resume_url || null,
    }

    try {
      let existing = null

      try {
        existing = await candidateProfileService.me()
      } catch {
        existing = null
      }

      if (existing) {
        await candidateProfileService.update(payload)
      } else {
        await candidateProfileService.create(payload)
      }

      await authService.updateMe({
        full_name: payload.full_name,
        phone: form.phone.trim(),
        profile_completed: true,
      })
      await checkUserAuth()
      navigate("/candidate/dashboard", { replace: true })
    } catch (finishError) {
      setError(
        finishError?.message || (isRtl ? "שמירת הפרופיל נכשלה" : "Could not save your profile"),
      )
    } finally {
      setLoading(false)
    }
  }

  const BackIcon = isRtl ? ArrowRight : ArrowLeft

  const NextIcon = isRtl ? ArrowLeft : ArrowRight

  return (
    <main
      className="min-h-screen bg-[radial-gradient(circle_at_top,#EDE9FE_0%,#F7FBFF_38%,#EEF8FF_100%)] px-4 py-8 sm:py-12"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-7 text-center">
          <img src="/logo.png" alt="HeadHunter HR-Tech" className="mx-auto mb-5 h-14 w-auto" />
          <p className="mb-2 text-sm font-extrabold uppercase tracking-[0.14em] text-violet-600">
            {isRtl ? "בניית הפרופיל שלך" : "Build your profile"}
          </p>
          <h1 className="text-3xl font-black text-slate-950 sm:text-4xl">
            {isRtl ? "בוא נמצא את העבודה שמתאימה לך" : "Let’s find work that fits you"}
          </h1>
        </div>

        <section className="overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-[0_24px_80px_rgba(79,70,229,0.12)]">
          <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-5 sm:px-9">
            <div className="mb-3 flex items-center justify-between text-sm font-bold text-slate-600">
              <span>{steps[step]}</span>
              <span>
                {step + 1} / {steps.length}
              </span>
            </div>
            <Progress
              value={((step + 1) / steps.length) * 100}
              className="bg-violet-100 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-violet-600"
            />
          </div>

          <div className="p-6 sm:p-9">
            {error && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700"
              >
                {error}
              </div>
            )}

            {step === 0 && (
              <div className="space-y-5">
                <StepHeading
                  icon={User}
                  title={isRtl ? "הפרטים המקצועיים הבסיסיים" : "Your professional basics"}
                  text={
                    isRtl
                      ? "המידע הזה עוזר לנו להתחיל לבנות התאמות מדויקות."
                      : "This gives us enough context to start making relevant matches."
                  }
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label={isRtl ? "שם מלא" : "Full name"}
                    value={form.full_name}
                    onChange={(v) => update("full_name", v)}
                  />
                  <Field
                    label={isRtl ? "טלפון" : "Phone"}
                    value={form.phone}
                    onChange={(v) => update("phone", v)}
                    dir="ltr"
                  />
                  <Field
                    label={isRtl ? "מיקום" : "Location"}
                    value={form.location}
                    onChange={(v) => update("location", v)}
                    placeholder={isRtl ? "לדוגמה: תל אביב" : "e.g. Tel Aviv"}
                  />
                  <Field
                    label={isRtl ? "תפקיד מבוקש" : "Desired role"}
                    value={form.title}
                    onChange={(v) => update("title", v)}
                    placeholder="Full Stack Developer"
                  />
                </div>
                <label className="flex min-h-24 cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/50 p-5 transition hover:border-violet-400">
                  <FileUp className="h-7 w-7 text-violet-600" />
                  <span>
                    <span className="block font-extrabold text-slate-800">
                      {form.resume_url
                        ? isRtl
                          ? "קורות החיים הועלו"
                          : "Resume uploaded"
                        : uploading
                          ? isRtl
                            ? "מעלה קובץ..."
                            : "Uploading..."
                          : isRtl
                            ? "העלאת קורות חיים (אופציונלי)"
                            : "Upload a resume (optional)"}
                    </span>
                    <span className="text-sm text-slate-500">PDF, DOC or DOCX</span>
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="sr-only"
                    onChange={uploadResume}
                    disabled={uploading}
                  />
                </label>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <StepHeading
                  icon={BriefcaseBusiness}
                  title={isRtl ? "הניסיון והיכולות שלך" : "Your experience and skills"}
                  text={
                    isRtl
                      ? "אפשר להשאיר ניסיון מפורט להמשך, אבל הוסף לפחות מיומנות אחת."
                      : "You can add more detail later, but include at least one skill now."
                  }
                />
                <Field
                  label={isRtl ? "מיומנויות — מופרדות בפסיקים" : "Skills — separated by commas"}
                  value={form.skills}
                  onChange={(v) => update("skills", v)}
                  placeholder="React, TypeScript, Node.js"
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label={isRtl ? "שנות ניסיון" : "Years of experience"}
                    value={form.experience_years}
                    onChange={(v) => update("experience_years", v)}
                    type="number"
                  />
                  <Field
                    label={isRtl ? "השכלה" : "Education"}
                    value={form.education}
                    onChange={(v) => update("education", v)}
                  />
                  <Field
                    label={isRtl ? "חברה אחרונה" : "Most recent company"}
                    value={form.company}
                    onChange={(v) => update("company", v)}
                  />
                  <Field
                    label={isRtl ? "תפקיד אחרון" : "Most recent role"}
                    value={form.role}
                    onChange={(v) => update("role", v)}
                  />
                </div>
                <Field
                  label={isRtl ? "תקופת עבודה" : "Employment period"}
                  value={form.years}
                  onChange={(v) => update("years", v)}
                  placeholder="2022–2026"
                />
                <div>
                  <Label className="mb-2 block font-bold text-slate-700">
                    {isRtl ? "תקציר מקצועי" : "Professional summary"}
                  </Label>
                  <textarea
                    value={form.summary}
                    onChange={(e) => update("summary", e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <StepHeading
                  icon={Sparkles}
                  title={isRtl ? "איזו עבודה מתאימה לך?" : "What kind of work fits you?"}
                  text={
                    isRtl
                      ? "העדפות אלה ישמשו להתאמות ולהתראות."
                      : "We’ll use these preferences for matches and alerts."
                  }
                />
                <Field
                  label={isRtl ? "תחומים — מופרדים בפסיקים" : "Fields — separated by commas"}
                  value={form.categories}
                  onChange={(v) => update("categories", v)}
                  placeholder={isRtl ? "פיתוח תוכנה, מוצר" : "Software, Product"}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="mb-2 block font-bold text-slate-700">
                      {isRtl ? "סוג משרה" : "Job type"}
                    </Label>
                    <select
                      value={form.job_type}
                      onChange={(e) => update("job_type", e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 outline-none focus:border-violet-500"
                    >
                      <option value="any">{isRtl ? "פתוח להצעות" : "Open to any"}</option>
                      <option value="full">{isRtl ? "משרה מלאה" : "Full time"}</option>
                      <option value="part">{isRtl ? "משרה חלקית" : "Part time"}</option>
                      <option value="remote">Remote</option>
                    </select>
                  </div>
                  <div />
                  <Field
                    label={isRtl ? "שכר מינימלי" : "Minimum salary"}
                    value={form.desired_salary_min}
                    onChange={(v) => update("desired_salary_min", v)}
                    type="number"
                  />
                  <Field
                    label={isRtl ? "שכר מקסימלי" : "Maximum salary"}
                    value={form.desired_salary_max}
                    onChange={(v) => update("desired_salary_max", v)}
                    type="number"
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <StepHeading
                  icon={Check}
                  title={isRtl ? "הכול מוכן" : "You’re ready"}
                  text={
                    isRtl
                      ? "בחר איך מעסיקים יוכלו לראות ולפנות אליך."
                      : "Choose how employers can discover and contact you."
                  }
                />
                <ToggleRow
                  label={isRtl ? "הצגת הפרופיל למעסיקים" : "Show my profile to employers"}
                  description={
                    isRtl
                      ? "ארגונים מורשים יוכלו למצוא את הפרופיל שלך."
                      : "Verified organizations can discover your profile."
                  }
                  checked={form.is_public}
                  onCheckedChange={(v) => update("is_public", v)}
                />
                <ToggleRow
                  label={isRtl ? "אני פתוח להצעות עבודה" : "I’m open to work"}
                  description={
                    isRtl
                      ? "הצג למגייסים שאתה זמין להזדמנויות."
                      : "Let recruiters know you’re available for opportunities."
                  }
                  checked={form.is_open_to_work}
                  onCheckedChange={(v) => update("is_open_to_work", v)}
                />
                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="font-black text-slate-900">{form.full_name}</p>
                  <p className="mt-1 font-bold text-violet-600">
                    {form.title} · {form.location}
                  </p>
                  <p className="mt-3 text-sm text-slate-600">
                    {splitList(form.skills).join(" · ")}
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
                <BackIcon className="h-4 w-4" /> {isRtl ? "חזרה" : "Back"}
              </Button>
              {step < steps.length - 1 ? (
                <Button
                  type="button"
                  onClick={next}
                  className="h-12 rounded-xl bg-violet-600 px-7 font-bold text-white hover:bg-violet-700"
                >
                  {isRtl ? "המשך" : "Continue"} <NextIcon className="h-4 w-4" />
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
                      ? "שומר..."
                      : "Saving..."
                    : isRtl
                      ? "סיום וצפייה במשרות"
                      : "Finish and see my matches"}
                </Button>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
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

function Field({ label, value, onChange, type = "text", placeholder, dir }) {
  return (
    <div>
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

function ToggleRow({ label, description, checked, onCheckedChange }) {
  return (
    <div className="flex items-center justify-between gap-5 rounded-2xl border border-slate-200 p-5">
      <div>
        <p className="font-extrabold text-slate-900">{label}</p>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}
