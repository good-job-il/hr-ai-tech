import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { UserPlus } from "lucide-react"

import { candidateService } from "@/api/services/candidateService"
import {
  PlatformModal,
  platformFieldClassName,
} from "@/components/platform/PlatformUI"

const EMPTY_FORM = {
  full_name: "",
  email: "",
  phone: "",
  role_name: "",
  domain_name: "",
  location: "",
  experience_years: "",
  skills: "",
  notes: "",
}

function optionalText(value) {
  const trimmed = value.trim()

  return trimmed || undefined
}

export default function CreateCandidateModal({ isOpen, onClose, onSuccess }) {
  const { t, i18n } = useTranslation()

  const [form, setForm] = useState(EMPTY_FORM)

  const [saving, setSaving] = useState(false)

  const [error, setError] = useState("")

  useEffect(() => {
    if (isOpen) {
      setError("")
    }
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const handleClose = () => {
    if (!saving) {
      onClose()
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.full_name.trim()) {
      setError(t("crm.createCandidate.nameRequired"))

      return
    }

    setSaving(true)
    setError("")

    try {
      const candidate = await candidateService.create({
        full_name: form.full_name.trim(),
        email: optionalText(form.email),
        phone: optionalText(form.phone),
        role_name: optionalText(form.role_name),
        domain_name: optionalText(form.domain_name),
        location: optionalText(form.location),
        experience_years:
          form.experience_years === "" ? undefined : Number(form.experience_years),
        skills: form.skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
        notes: optionalText(form.notes),
        source: "manual",
        status: "new",
      })

      setForm(EMPTY_FORM)
      onSuccess(candidate)
    } catch (requestError) {
      setError(requestError?.message || t("crm.createCandidate.error"))
    } finally {
      setSaving(false)
    }
  }

  const dir = i18n.language?.startsWith("he") ? "rtl" : "ltr"

  return (
    <PlatformModal
      title={t("crm.createCandidate.title")}
      subtitle={t("crm.createCandidate.subtitle")}
      icon={UserPlus}
      onClose={handleClose}
      maxWidth="max-w-2xl"
      dir={dir}
    >
      <form
        onSubmit={handleSubmit}
        className="max-h-[calc(100vh-10rem)] space-y-5 overflow-y-auto px-1"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("crm.createCandidate.fullName")} required>
            <input
              autoFocus
              required
              value={form.full_name}
              onChange={(event) => set("full_name", event.target.value)}
              placeholder={t("crm.createCandidate.fullNamePlaceholder")}
              className={platformFieldClassName}
            />
          </Field>

          <Field label={t("crm.createCandidate.email")}>
            <input
              type="email"
              value={form.email}
              onChange={(event) => set("email", event.target.value)}
              placeholder="name@example.com"
              className={platformFieldClassName}
            />
          </Field>

          <Field label={t("crm.createCandidate.phone")}>
            <input
              type="tel"
              value={form.phone}
              onChange={(event) => set("phone", event.target.value)}
              placeholder="+972 50 000 0000"
              className={platformFieldClassName}
            />
          </Field>

          <Field label={t("crm.createCandidate.location")}>
            <input
              value={form.location}
              onChange={(event) => set("location", event.target.value)}
              placeholder={t("crm.createCandidate.locationPlaceholder")}
              className={platformFieldClassName}
            />
          </Field>

          <Field label={t("crm.createCandidate.role")}>
            <input
              value={form.role_name}
              onChange={(event) => set("role_name", event.target.value)}
              placeholder={t("crm.createCandidate.rolePlaceholder")}
              className={platformFieldClassName}
            />
          </Field>

          <Field label={t("crm.createCandidate.domain")}>
            <input
              value={form.domain_name}
              onChange={(event) => set("domain_name", event.target.value)}
              placeholder={t("crm.createCandidate.domainPlaceholder")}
              className={platformFieldClassName}
            />
          </Field>

          <Field label={t("crm.createCandidate.experience")}>
            <input
              type="number"
              min="0"
              max="80"
              step="0.5"
              value={form.experience_years}
              onChange={(event) => set("experience_years", event.target.value)}
              placeholder="0"
              className={platformFieldClassName}
            />
          </Field>

          <Field label={t("crm.createCandidate.skills")}>
            <input
              value={form.skills}
              onChange={(event) => set("skills", event.target.value)}
              placeholder={t("crm.createCandidate.skillsPlaceholder")}
              className={platformFieldClassName}
            />
          </Field>
        </div>

        <Field label={t("crm.createCandidate.notes")}>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(event) => set("notes", event.target.value)}
            placeholder={t("crm.createCandidate.notesPlaceholder")}
            className={`${platformFieldClassName} h-auto resize-y py-3`}
          />
        </Field>

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row">
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            {t("crm.createCandidate.cancel")}
          </button>

          <button
            type="submit"
            disabled={saving || !form.full_name.trim()}
            className="gradient-brand flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4" />
            {saving ? t("crm.createCandidate.saving") : t("crm.createCandidate.create")}
          </button>
        </div>
      </form>
    </PlatformModal>
  )
}

function Field({ label, required = false, children }) {
  return (
    <label className="block text-sm font-bold text-slate-700">
      <span className="mb-1.5 block">
        {label}
        {required ? " *" : ""}
      </span>
      {children}
    </label>
  )
}
