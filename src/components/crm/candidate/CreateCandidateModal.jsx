import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Save, UserPen, UserPlus } from "lucide-react"

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
  languages: "",
  desired_salary_min: "",
  desired_salary_max: "",
  summary: "",
  notes: "",
}

function optionalText(value) {
  const trimmed = value.trim()

  return trimmed || undefined
}

function listValue(value) {
  return Array.isArray(value) ? value.join(", ") : ""
}

function formFromCandidate(candidate) {
  if (!candidate) {
    return EMPTY_FORM
  }

  return {
    full_name: candidate.full_name || "",
    email: candidate.email || "",
    phone: candidate.phone || "",
    role_name: candidate.role_name || "",
    domain_name: candidate.domain_name || "",
    location: candidate.location || "",
    experience_years: candidate.experience_years ?? "",
    skills: listValue(candidate.skills),
    languages: listValue(candidate.languages),
    desired_salary_min: candidate.desired_salary_min ?? "",
    desired_salary_max: candidate.desired_salary_max ?? "",
    summary: candidate.summary || "",
    notes: candidate.notes || "",
  }
}

function splitList(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

export default function CreateCandidateModal({ isOpen, candidate = null, onClose, onSuccess }) {
  const { t, i18n } = useTranslation()

  const [form, setForm] = useState(EMPTY_FORM)

  const [saving, setSaving] = useState(false)

  const [error, setError] = useState("")

  useEffect(() => {
    if (isOpen) {
      setError("")
      setForm(formFromCandidate(candidate))
    }
  }, [isOpen, candidate])

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

    if (
      form.desired_salary_min !== "" &&
      form.desired_salary_max !== "" &&
      Number(form.desired_salary_min) > Number(form.desired_salary_max)
    ) {
      setError(t("candidateCRM.editCandidate.salaryRangeError"))

      return
    }

    setSaving(true)
    setError("")

    try {
      const emptyValue = candidate ? null : undefined

      const payload = {
        full_name: form.full_name.trim(),
        email: optionalText(form.email) ?? emptyValue,
        phone: optionalText(form.phone) ?? emptyValue,
        role_name: optionalText(form.role_name) ?? emptyValue,
        domain_name: optionalText(form.domain_name) ?? emptyValue,
        location: optionalText(form.location) ?? emptyValue,
        experience_years:
          form.experience_years === "" ? emptyValue : Number(form.experience_years),
        desired_salary_min:
          form.desired_salary_min === "" ? emptyValue : Number(form.desired_salary_min),
        desired_salary_max:
          form.desired_salary_max === "" ? emptyValue : Number(form.desired_salary_max),
        skills: splitList(form.skills),
        languages: splitList(form.languages),
        summary: optionalText(form.summary) ?? emptyValue,
        notes: optionalText(form.notes) ?? emptyValue,
      }

      const savedCandidate = candidate
        ? await candidateService.update(candidate.id, payload)
        : await candidateService.create({ ...payload, source: "manual", status: "new" })

      setForm(EMPTY_FORM)
      onSuccess(savedCandidate)
    } catch (requestError) {
      setError(
        requestError?.message ||
          t(candidate ? "candidateCRM.editCandidate.error" : "crm.createCandidate.error"),
      )
    } finally {
      setSaving(false)
    }
  }

  const dir = i18n.language?.startsWith("he") ? "rtl" : "ltr"

  return (
    <PlatformModal
      title={t(candidate ? "candidateCRM.editCandidate.title" : "crm.createCandidate.title")}
      subtitle={t(
        candidate ? "candidateCRM.editCandidate.subtitle" : "crm.createCandidate.subtitle",
      )}
      icon={candidate ? UserPen : UserPlus}
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

          <Field label={t("candidateCRM.editCandidate.languages")}>
            <input
              value={form.languages}
              onChange={(event) => set("languages", event.target.value)}
              placeholder={t("candidateCRM.editCandidate.languagesPlaceholder")}
              className={platformFieldClassName}
            />
          </Field>

          <Field label={t("candidateCRM.editCandidate.salaryMin")}>
            <input
              type="number"
              min="0"
              step="100"
              value={form.desired_salary_min}
              onChange={(event) => set("desired_salary_min", event.target.value)}
              placeholder="0"
              className={platformFieldClassName}
            />
          </Field>

          <Field label={t("candidateCRM.editCandidate.salaryMax")}>
            <input
              type="number"
              min="0"
              step="100"
              value={form.desired_salary_max}
              onChange={(event) => set("desired_salary_max", event.target.value)}
              placeholder="0"
              className={platformFieldClassName}
            />
          </Field>
        </div>

        <Field label={t("candidateCRM.editCandidate.summary")}>
          <textarea
            rows={3}
            value={form.summary}
            onChange={(event) => set("summary", event.target.value)}
            placeholder={t("candidateCRM.editCandidate.summaryPlaceholder")}
            className={`${platformFieldClassName} h-auto resize-y py-3`}
          />
        </Field>

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
            {candidate ? <Save className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {saving
              ? t(candidate ? "candidateCRM.editCandidate.saving" : "crm.createCandidate.saving")
              : t(candidate ? "candidateCRM.editCandidate.save" : "crm.createCandidate.create")}
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
