import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
import { useAuth } from "@/lib/AuthContext"
import { jobService } from "@/api/services/jobService"
import { agencyClientService } from "@/api/services/agencyClientService"
import { compensationPlanService } from "@/api/services/compensationPlanService"
import { agencyTeamsService } from "@/api/services/agencyTeamsService"
import { taxonomyService } from "@/api/services/taxonomyService"
import { normalizeCompanyId, resolveJobClientSelection } from "@/domain/agency/jobClientSelection"
import { getEffectiveJobState } from "@/domain/agency/jobState"
import { getJobWorkflowDefaults, parseSkillsInput } from "@/domain/agency/jobWorkflow"
import { usePermissionMatrix } from "@/hooks/usePermissionMatrix"
import { copyText } from "@/domain/agency/clipboard"
import {
  changedImportManagedFields,
  importFieldState,
  safeExternalJobUrl,
} from "@/domain/agency/jobImportProvenance"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

function FieldSyncIndicator({ field, provenance }) {
  const { t } = useTranslation()

  const state = importFieldState(provenance, field)

  if (state === "none") {
    return null
  }

  return (
    <span
      className={`ms-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
        state === "manual" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
      }`}
      title={t(`jobs_management.form.fieldSync.${state}Help`)}
    >
      {state === "manual" ? (
        <LockKeyhole className="h-3 w-3" aria-hidden="true" />
      ) : (
        <RefreshCw className="h-3 w-3" aria-hidden="true" />
      )}
      {t(`jobs_management.form.fieldSync.${state}`)}
    </span>
  )
}

function CopyInline({ text }) {
  const { t } = useTranslation()

  const [copyState, setCopyState] = useState("idle")

  const handleCopy = async () => {
    try {
      await copyText(text)
      setCopyState("copied")
      window.setTimeout(() => setCopyState("idle"), 2000)
    } catch {
      setCopyState("error")
      window.setTimeout(() => setCopyState("idle"), 3000)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={t(copyState === "error" ? "jobs_management.copyError" : "jobs_management.copyAddress")}
      aria-label={t(
        copyState === "error" ? "jobs_management.copyError" : "jobs_management.copyAddress",
      )}
      className={`flex-shrink-0 h-6 w-6 rounded flex items-center justify-center transition-all ${
        copyState === "copied"
          ? "text-green-600"
          : copyState === "error"
            ? "bg-red-50 text-red-600"
            : "text-[#7C3AED] hover:bg-[#F3EFFF]"
      }`}
    >
      {copyState === "copied" ? (
        <Check className="w-3.5 h-3.5" />
      ) : copyState === "error" ? (
        <X className="w-3.5 h-3.5" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
      <span className="sr-only" aria-live="polite">
        {copyState === "error" ? t("jobs_management.copyError") : null}
      </span>
    </button>
  )
}

const EMPTY_FORM = {
  title: "",
  company: "",
  employer_company_id: "",
  category: "",
  location: "",
  type: "full",
  employment_type_id: 1,
  work_mode_id: 2,
  source: "manual",
  state: "open",
  salary_min: "",
  salary_max: "",
  description: "",
  required_skills_text: "",
  preferred_skills_text: "",
  seniority: "any",
  years_experience_required: "",
  recruiter_id: "",
  team_manager_id: "",
  recruitment_manager_id: "",
  compensation_plan_id: "",
  is_anonymous: false,
  show_company_name: true,
  show_company_info: true,
  show_contact_details: false,
  contact_email: "",
  contact_phone: "",
}

const FALLBACK_TAXONOMY = {
  employmentTypes: [1, 2, 3, 4, 5, 6].map((type_id) => ({ type_id, name: "" })),
  workModes: [1, 2, 3].map((mode_id) => ({ mode_id, name: "" })),
}

export default function JobFormModal({ job, isOpen, onClose, onSave, preselectedClientId = null }) {
  const { user } = useAuth()

  const { can, canResource } = usePermissionMatrix()

  const { t, i18n } = useTranslation()

  const direction = i18n.dir()

  const locale = i18n.resolvedLanguage?.startsWith("he") ? "he-IL" : "en-US"

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "ILS",
        maximumFractionDigits: 0,
      }),
    [locale],
  )

  const percentFormatter = useMemo(
    () => new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 2 }),
    [locale],
  )

  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale])

  const titleId = useId()

  const titleInputRef = useRef(null)

  const [form, setForm] = useState(EMPTY_FORM)

  const [loading, setLoading] = useState(false)

  const [error, setError] = useState("")

  const [compensationPlan, setCompensationPlan] = useState(null)

  const [compensationPlans, setCompensationPlans] = useState([])

  const [members, setMembers] = useState([])

  const [workflowLoading, setWorkflowLoading] = useState(false)

  const [workflowError, setWorkflowError] = useState("")

  const [workflowRetryVersion, setWorkflowRetryVersion] = useState(0)

  const [taxonomy, setTaxonomy] = useState(FALLBACK_TAXONOMY)

  const [agencyClients, setAgencyClients] = useState([])

  const [clientsLoading, setClientsLoading] = useState(false)

  const [clientsError, setClientsError] = useState("")

  const [importProvenance, setImportProvenance] = useState(null)

  const [overrideResetting, setOverrideResetting] = useState(null)

  const [overrideResetError, setOverrideResetError] = useState("")

  const [overrideConfirmation, setOverrideConfirmation] = useState(null)

  const isAgency = user?.org_type === "staffing_agency"

  const canViewCompensation = can("view_compensation")

  const canEditCompensation = can("edit_compensation")

  const canChooseAssignments = [
    "admin",
    "org_admin",
    "recruitment_manager",
    "team_manager",
  ].includes(user?.role)

  useEffect(() => setError(""), [i18n.resolvedLanguage])

  useEffect(() => {
    let active = true

    if (!isOpen || !job?.id || (!job.source_job_record_id && job.source !== "import")) {
      setImportProvenance(null)

      return () => {
        active = false
      }
    }

    jobService
      .importProvenance(job.id)
      .then((provenance) => active && setImportProvenance(provenance.imported ? provenance : null))
      .catch(() => active && setImportProvenance(null))

    return () => {
      active = false
    }
  }, [isOpen, job?.id, job?.source, job?.source_job_record_id])

  const lockedFieldLabels = useMemo(() => {
    const labels = {
      title: t("jobs_management.form.title"),
      description: t("jobs_management.form.description"),
      location: t("jobs_management.form.location"),
      employment_type_id: t("jobs_management.form.employmentType"),
      work_mode_id: t("jobs_management.form.workMode"),
      required_skills: t("jobs_management.form.requiredSkills"),
      preferred_skills: t("jobs_management.form.preferredSkills"),
      state: t("jobs_management.form.status"),
      category: t("jobs_management.form.category"),
      seniority: t("jobs_management.form.seniority"),
    }

    return Object.keys(importProvenance?.manual_overrides || {}).map((field) => ({
      field,
      label: labels[field] || field,
    }))
  }, [importProvenance?.manual_overrides, t])

  const externalPostingUrl = safeExternalJobUrl(importProvenance?.source_posting_url)

  const handleResumeSourceSync = async (field) => {
    if (!job?.id || !field) {
      return
    }

    setOverrideResetting(field)
    setOverrideResetError("")

    try {
      const result = await jobService.resetImportOverrides(job.id, [field])

      setImportProvenance((current) =>
        current ? { ...current, manual_overrides: result.manual_overrides } : current,
      )
    } catch {
      setOverrideResetError(t("jobs_management.form.resumeSourceSyncError"))
    } finally {
      setOverrideResetting(null)
    }
  }

  const loadAgencyClients = useCallback(async () => {
    if (!isOpen || !isAgency) {
      return
    }

    setClientsLoading(true)
    setClientsError("")

    const currentCompanyId = job?.employer_company_id

    try {
      const [activeClients, currentClients] = await Promise.all([
        agencyClientService.list({ status: "active", limit: 500 }),
        currentCompanyId
          ? agencyClientService.list({ company_id: Number(currentCompanyId), limit: 1 })
          : Promise.resolve([]),
      ])

      const clientsById = new Map(
        [...activeClients, ...currentClients].map((client) => [client.id, client]),
      )

      setAgencyClients([...clientsById.values()])
    } catch {
      setClientsError("load_failed")
    } finally {
      setClientsLoading(false)
    }
  }, [isOpen, isAgency, job?.employer_company_id])

  useEffect(() => {
    loadAgencyClients()
  }, [loadAgencyClients])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setWorkflowLoading(true)
    setWorkflowError("")

    Promise.all([
      taxonomyService.load().catch(() => FALLBACK_TAXONOMY),
      isAgency && canChooseAssignments
        ? agencyTeamsService.overview().catch(() => {
            setWorkflowError("staff")

            return { members: [] }
          })
        : Promise.resolve({ members: [] }),
      isAgency && canViewCompensation
        ? compensationPlanService.list({ limit: 500 }).catch(() => {
            setWorkflowError((current) => current || "compensation")

            return []
          })
        : Promise.resolve([]),
    ])
      .then(([taxonomySnapshot, teamOverview, plans]) => {
        setTaxonomy({
          employmentTypes:
            taxonomySnapshot.employmentTypes?.length > 0
              ? taxonomySnapshot.employmentTypes
              : FALLBACK_TAXONOMY.employmentTypes,
          workModes:
            taxonomySnapshot.workModes?.length > 0
              ? taxonomySnapshot.workModes
              : FALLBACK_TAXONOMY.workModes,
        })
        setMembers(teamOverview.members || [])
        setCompensationPlans(plans)
      })
      .finally(() => setWorkflowLoading(false))
  }, [
    canChooseAssignments,
    canViewCompensation,
    isAgency,
    isOpen,
    user?.organization_id,
    workflowRetryVersion,
  ])

  useEffect(() => {
    if (job) {
      const workflow = getJobWorkflowDefaults(job)

      setForm({
        ...EMPTY_FORM,
        ...job,
        title: job.title ?? "",
        company: job.company ?? "",
        employer_company_id: normalizeCompanyId(job.employer_company_id),
        category: job.category ?? "",
        location: job.location ?? "",
        type: job.type === "remote" ? "full" : (job.type ?? "full"),
        ...workflow,
        source: job.source ?? (job.external_id ? "import" : "manual"),
        state: getEffectiveJobState(job),
        salary_min: job.salary_min ?? "",
        salary_max: job.salary_max ?? "",
        description: job.description ?? "",
        required_skills_text: (job.required_skills || []).join(", "),
        preferred_skills_text: (job.preferred_skills || []).join(", "),
        seniority: job.seniority ?? "any",
        years_experience_required: job.years_experience_required ?? "",
        recruiter_id: job.recruiter_id ?? "",
        team_manager_id: job.team_manager_id ?? "",
        recruitment_manager_id: job.recruitment_manager_id ?? "",
        compensation_plan_id: "",
        contact_email: job.contact_email ?? "",
        contact_phone: job.contact_phone ?? "",
      })

      setCompensationPlan(null)
    } else {
      const selectedClient = agencyClients.find(
        (client) => client.status === "active" && String(client.id) === String(preselectedClientId),
      )

      const createDefaults = {
        ...EMPTY_FORM,
        recruiter_id:
          user?.role === "recruiter" || user?.role === "internal_recruiter" ? user.id : "",
        team_manager_id: user?.role === "team_manager" ? user.id : (user?.team_manager_id ?? ""),
        recruitment_manager_id:
          user?.role === "recruitment_manager" ? user.id : (user?.recruitment_manager_id ?? ""),
      }

      setForm(
        selectedClient
          ? {
              ...createDefaults,
              employer_company_id: selectedClient.company_id,
              company: selectedClient.name,
              contact_email: selectedClient.contact_email || "",
              contact_phone: selectedClient.contact_phone || "",
            }
          : createDefaults,
      )
      setCompensationPlan(null)
    }

    setError("")
  }, [job, isOpen, preselectedClientId, agencyClients, user])

  useEffect(() => {
    if (!isOpen || !compensationPlans.length) {
      return
    }

    const jobPlan = job?.id
      ? compensationPlans.find((plan) => Number(plan.job_id) === Number(job.id))
      : null

    if (!jobPlan) {
      return
    }

    setCompensationPlan(jobPlan)
    setForm((current) => ({ ...current, compensation_plan_id: String(jobPlan.id) }))
  }, [compensationPlans, isOpen, job?.id])

  const {
    activeClients,
    currentClient,
    currentCompanyId,
    selectedActiveClient,
    issueKey,
    issueValues,
  } = useMemo(
    () =>
      resolveJobClientSelection({
        clients: agencyClients,
        job,
        selectedCompanyId: form.employer_company_id,
      }),
    [agencyClients, form.employer_company_id, job],
  )

  const activeAgencyClients = activeClients

  const clientSelectionIssue =
    !isAgency || clientsLoading || clientsError || !issueKey
      ? ""
      : t(`jobs_management.form.${issueKey}`, {
          ...issueValues,
          status: issueValues.status
            ? t(`jobs_management.clientStatus.${issueValues.status}`, {
                defaultValue: issueValues.status,
              })
            : undefined,
          company: issueValues.company || t("jobs_management.form.unknownCompany"),
        })

  const currentClientIsFallback =
    !!job && !!currentCompanyId && !selectedActiveClient && currentClient?.status !== "active"

  const activeMembers = useMemo(
    () => members.filter((member) => member.is_active !== false),
    [members],
  )

  const recruiters = activeMembers.filter((member) => member.role === "recruiter")

  const teamManagers = activeMembers.filter((member) => member.role === "team_manager")

  const selectedTeamManager = teamManagers.find(
    (member) => Number(member.id) === Number(form.team_manager_id),
  )

  const selectedRecruiter = recruiters.find(
    (member) => Number(member.id) === Number(form.recruiter_id),
  )

  const selectableRecruiters = selectedTeamManager?.team_id
    ? recruiters.filter((member) => member.team_id === selectedTeamManager.team_id)
    : recruiters

  const selectableTeamManagers = selectedRecruiter?.team_id
    ? teamManagers.filter((member) => member.team_id === selectedRecruiter.team_id)
    : teamManagers

  const recruitmentManagers = activeMembers.filter(
    (member) => member.role === "recruitment_manager",
  )

  const owner =
    members.find((member) => Number(member.id) === Number(job?.created_by_user_id)) ||
    (!job || Number(job?.created_by_user_id) === Number(user?.id) ? user : null)

  const availableCompensationPlans = compensationPlans.filter(
    (plan) =>
      Number(plan.job_id) === Number(job?.id) ||
      (Number(plan.employer_company_id) === Number(form.employer_company_id) && !plan.job_id),
  )

  const handleSubmit = async (e, manualOverrideConfirmed = false) => {
    e?.preventDefault()

    if (!form.title) {
      setError(t("jobs_management.form.titleRequired"))

      return
    }

    if (!form.company) {
      setError(t("jobs_management.form.companyRequired"))

      return
    }

    if (isAgency && !selectedActiveClient) {
      setError(clientSelectionIssue || t("jobs_management.form.selectActiveClient"))

      return
    }

    if (!form.category) {
      setError(t("jobs_management.form.categoryRequired"))

      return
    }

    const legacyTypeByEmploymentType = { 1: "full", 2: "part", 6: "daily" }

    const payload = {
      title: form.title,
      company: form.company,
      employer_company_id: Number(form.employer_company_id) || null,
      category: form.category,
      location: form.location || null,
      type: legacyTypeByEmploymentType[Number(form.employment_type_id)] || "full",
      employment_type_id: Number(form.employment_type_id),
      work_mode_id: Number(form.work_mode_id),
      source: form.source,
      state: form.state,
      salary_min: form.salary_min !== "" ? Number(form.salary_min) : null,
      salary_max: form.salary_max !== "" ? Number(form.salary_max) : null,
      description: form.description || null,
      required_skills: parseSkillsInput(form.required_skills_text),
      preferred_skills: parseSkillsInput(form.preferred_skills_text),
      seniority: form.seniority,
      years_experience_required:
        form.years_experience_required !== "" ? Number(form.years_experience_required) : null,
      is_anonymous: form.is_anonymous,
      show_company_name: form.show_company_name,
      show_company_info: form.show_company_info,
      show_contact_details: form.show_contact_details,
      contact_email: form.contact_email || null,
      contact_phone: form.contact_phone || null,
    }

    for (const field of ["recruiter_id", "team_manager_id", "recruitment_manager_id"]) {
      const selected = form[field] === "" ? null : Number(form[field])

      if (!job?.id || selected !== (job[field] ?? null)) {
        payload[field] = selected
      }
    }

    if (!job?.id && user) {
      if (user.role === "recruiter" || user.role === "internal_recruiter") {
        payload.recruiter_id = user.id
      }

      if (user.role === "team_manager") {
        payload.team_manager_id = user.id
      }

      if (user.team_manager_id) {
        payload.team_manager_id = user.team_manager_id
      }

      if (user.recruitment_manager_id) {
        payload.recruitment_manager_id = user.recruitment_manager_id
      }
    }

    const changedManagedFields = changedImportManagedFields(job, form, importProvenance)

    if (!manualOverrideConfirmed && changedManagedFields.length > 0) {
      setOverrideConfirmation(changedManagedFields)

      return
    }

    setOverrideConfirmation(null)

    setLoading(true)

    try {
      let savedJob

      if (job?.id) {
        savedJob = await jobService.update(job.id, payload)
      } else {
        savedJob = await jobService.create(payload)
      }

      if (canEditCompensation) {
        const previouslyLinked = compensationPlans.find(
          (plan) => Number(plan.job_id) === Number(savedJob.id),
        )

        const selectedPlan = compensationPlans.find(
          (plan) => String(plan.id) === String(form.compensation_plan_id),
        )

        try {
          if (previouslyLinked && previouslyLinked.id !== selectedPlan?.id) {
            await compensationPlanService.update(previouslyLinked.id, { job_id: null })
          }

          if (selectedPlan) {
            await compensationPlanService.update(selectedPlan.id, {
              job_id: Number(savedJob.id),
              employer_company_id: Number(form.employer_company_id),
              recruiter_id: payload.recruiter_id ?? job?.recruiter_id ?? null,
              team_manager_id: payload.team_manager_id ?? job?.team_manager_id ?? null,
              recruitment_manager_id:
                payload.recruitment_manager_id ?? job?.recruitment_manager_id ?? null,
              ...(compensationPlan?.id === selectedPlan.id &&
              compensationPlan.warranty_period_days != null
                ? { warranty_period_days: compensationPlan.warranty_period_days }
                : {}),
            })
          }
        } catch {
          setError(t("jobs_management.form.compensationLinkError"))
          onSave()

          return
        }
      }

      onSave()
      onClose()
    } catch {
      setError(t("jobs_management.form.saveError"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !loading && onClose()}>
      <DialogContent
        showClose={false}
        aria-labelledby={titleId}
        aria-describedby={undefined}
        dir={direction}
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          titleInputRef.current?.focus()
        }}
        onInteractOutside={(event) => loading && event.preventDefault()}
        overlayClassName="bg-black/50"
        className="block max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl border-0 bg-white p-0"
      >
        <DialogHeader className="sticky top-0 z-10 flex-row items-center justify-between space-y-0 border-b border-gray-200 bg-white px-6 py-4 text-start sm:text-start">
          <DialogTitle id={titleId} className="text-xl font-bold">
            {t(job ? "jobs_management.editJob" : "jobs_management.postNewJob")}
          </DialogTitle>

          <DialogClose asChild>
            <button
              type="button"
              disabled={loading}
              className="rounded-md text-gray-500 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:opacity-50"
              title={t("jobs_management.form.close")}
              aria-label={t("jobs_management.form.close")}
            >
              <X className="w-5 h-5" />
            </button>
          </DialogClose>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700"
            >
              ❌ {error}
            </div>
          )}

          {importProvenance && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
              <div className="flex items-center gap-2 font-semibold">
                <LockKeyhole className="h-4 w-4" aria-hidden="true" />
                {t("jobs_management.form.importProvenance")}
              </div>

              <p className="mt-1 text-xs text-blue-800">
                {lockedFieldLabels.length
                  ? t("jobs_management.form.importLockedFields", {
                      fields: lockedFieldLabels.map(({ label }) => label).join(", "),
                    })
                  : t("jobs_management.form.importSourceManaged")}
              </p>

              <dl className="mt-3 grid gap-2 rounded-lg border border-blue-100 bg-white/80 p-3 text-xs sm:grid-cols-2">
                <div>
                  <dt className="font-bold text-slate-500">{t("jobs_management.form.source")}</dt>
                  <dd className="mt-0.5 font-semibold text-slate-900">
                    {importProvenance.source?.name || t("jobs_management.form.sourceUnavailable")}
                    {importProvenance.source && (
                      <span className="ms-1 text-slate-500">
                        ·{" "}
                        {t(`jobImports.statuses.${importProvenance.source.state}`, {
                          defaultValue: importProvenance.source.state,
                        })}
                      </span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="font-bold text-slate-500">
                    {t("jobs_management.form.sourceClient")}
                  </dt>
                  <dd className="mt-0.5 font-semibold text-slate-900">
                    {importProvenance.client?.name || job?.company || "—"}
                    {importProvenance.client && !importProvenance.client.available && (
                      <span className="ms-1 text-amber-700">
                        · {t("jobs_management.form.clientUnavailable")}
                      </span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="font-bold text-slate-500">
                    {t("jobs_management.form.lastSuccessfulSync")}
                  </dt>
                  <dd className="mt-0.5 font-semibold text-slate-900">
                    {importProvenance.source?.last_success_at
                      ? new Intl.DateTimeFormat(locale, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(importProvenance.source.last_success_at))
                      : t("jobs_management.form.neverSynced")}
                  </dd>
                </div>
                <div>
                  <dt className="font-bold text-slate-500">
                    {t("jobs_management.form.sourceHealth")}
                  </dt>
                  <dd className="mt-0.5 font-semibold text-slate-900">
                    {t(
                      `jobs_management.form.health.${importProvenance.source?.health_state || "unknown"}`,
                    )}
                    {importProvenance.source?.health_error_code && (
                      <span className="ms-1 font-mono text-red-700">
                        ({importProvenance.source.health_error_code})
                      </span>
                    )}
                  </dd>
                </div>
              </dl>

              <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                {externalPostingUrl && (
                  <a
                    href={externalPostingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-white px-2.5 py-1.5 text-blue-800 hover:bg-blue-100"
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    {t("jobs_management.form.externalPosting")}
                  </a>
                )}
                {importProvenance.source?.available && (
                  <Link
                    to={`/agency/import/jobs/${importProvenance.source.id}`}
                    className="rounded-lg border border-blue-200 bg-white px-2.5 py-1.5 text-blue-800 hover:bg-blue-100"
                  >
                    {t("jobs_management.form.openImportSource")}
                  </Link>
                )}
                {importProvenance.last_successful_run_id && (
                  <Link
                    to={`/agency/import/jobs/runs/${importProvenance.last_successful_run_id}`}
                    className="rounded-lg border border-blue-200 bg-white px-2.5 py-1.5 text-blue-800 hover:bg-blue-100"
                  >
                    {t("jobs_management.form.openLastRun")}
                  </Link>
                )}
                {importProvenance.latest_run_item && (
                  <Link
                    to={`/agency/import/jobs/runs/${importProvenance.latest_run_item.run_id}?open=${importProvenance.latest_run_item.id}`}
                    className="rounded-lg border border-blue-200 bg-white px-2.5 py-1.5 text-blue-800 hover:bg-blue-100"
                  >
                    {t("jobs_management.form.openReviewItem")}
                  </Link>
                )}
              </div>

              {overrideResetError && (
                <p role="alert" className="mt-2 text-xs font-medium text-red-700">
                  {overrideResetError}
                </p>
              )}

              {lockedFieldLabels.length > 0 && canResource("job_imports", "review") && (
                <ul className="mt-2 space-y-1.5">
                  {lockedFieldLabels.map(({ field, label }) => (
                    <li key={field} className="flex items-center justify-between gap-3">
                      <span className="text-xs font-medium">{label}</span>
                      <button
                        type="button"
                        onClick={() => handleResumeSourceSync(field)}
                        disabled={Boolean(overrideResetting)}
                        aria-label={t("jobs_management.form.resumeFieldSync", { field: label })}
                        className="rounded-lg border border-blue-300 bg-white px-2.5 py-1 text-xs font-semibold text-blue-800 transition-colors hover:bg-blue-100 disabled:cursor-wait disabled:opacity-60"
                      >
                        {t(
                          overrideResetting === field
                            ? "jobs_management.form.resumingSourceSync"
                            : "jobs_management.form.resumeSourceSync",
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {(importProvenance.history || []).length > 0 && (
                <details className="mt-3 rounded-lg border border-blue-100 bg-white/80 p-3">
                  <summary className="cursor-pointer font-bold text-blue-900">
                    {t("jobs_management.form.importHistory")}
                  </summary>
                  <ol className="mt-3 space-y-2 border-s border-blue-200 ps-3">
                    {importProvenance.history.slice(0, 10).map((entry) => (
                      <li key={entry.id} className="text-xs text-slate-600">
                        <p className="font-bold text-slate-900">
                          {t(`jobs_management.form.history.${entry.origin || entry.action}`, {
                            defaultValue: entry.action,
                          })}
                        </p>
                        <p>
                          {new Intl.DateTimeFormat(locale, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(new Date(entry.created_at))}
                          {entry.actor_email ? ` · ${entry.actor_email}` : ""}
                        </p>
                      </li>
                    ))}
                  </ol>
                </details>
              )}
            </div>
          )}

          {/* job_code + apply_email — read only, only when editing */}
          {job?.job_code && (
            <div className="bg-[#F7FBFF] border border-[#E4ECFF] rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-[#64748B] w-24 flex-shrink-0">
                  {t("jobs_management.form.jobCode")}
                </span>

                <span
                  className="font-mono text-sm font-black text-[#7C3AED] bg-[#F3EFFF] px-2.5 py-0.5 rounded-lg"
                  dir="ltr"
                >
                  {job.job_code}
                </span>
              </div>

              {job.apply_email && (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[#64748B] w-24 flex-shrink-0">
                    {t("jobs_management.form.emailAlias")}
                  </span>

                  <span className="font-mono text-sm text-[#374151] break-all flex-1" dir="ltr">
                    {job.apply_email}
                  </span>

                  <CopyInline text={job.apply_email} />
                </div>
              )}

              <p className="text-xs text-[#94A3B8]">{t("jobs_management.form.aliasHelp")}</p>
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="job-form-title"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                {t("jobs_management.form.title")} *
                <FieldSyncIndicator field="title" provenance={importProvenance} />
              </label>

              <input
                id="job-form-title"
                ref={titleInputRef}
                required
                maxLength={160}
                placeholder={t("jobs_management.form.titlePlaceholder")}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30 text-gray-900 bg-white"
              />
            </div>

            <div>
              <label
                htmlFor="job-form-company"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                {t("jobs_management.form.company")} *
              </label>

              {isAgency ? (
                <select
                  id="job-form-company"
                  required
                  disabled={clientsLoading || !!clientsError}
                  value={String(form.employer_company_id || "")}
                  onChange={(e) => {
                    const client = activeAgencyClients.find(
                      (item) => String(item.company_id) === e.target.value,
                    )

                    setForm({
                      ...form,
                      employer_company_id: client?.company_id || "",
                      company: client?.name || "",
                      compensation_plan_id: "",
                      contact_email: client?.contact_email || form.contact_email,
                      contact_phone: client?.contact_phone || form.contact_phone,
                    })
                    setCompensationPlan(null)
                  }}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30 text-gray-900 bg-white"
                >
                  <option value="">
                    {clientsLoading
                      ? t("jobs_management.form.loadingClients")
                      : t("jobs_management.form.selectClient")}
                  </option>

                  {currentClientIsFallback && currentClient && (
                    <option value={currentClient.company_id} disabled>
                      {currentClient.name || job.company} (
                      {t(`jobs_management.clientStatus.${currentClient.status}`, {
                        defaultValue: currentClient.status,
                      })}
                      )
                    </option>
                  )}

                  {!!job && !!currentCompanyId && !currentClient && (
                    <option value={currentCompanyId} disabled>
                      {job.company || t("jobs_management.form.legacyCompany")} (
                      {t("jobs_management.form.unavailable")})
                    </option>
                  )}

                  {activeAgencyClients.map((client) => (
                    <option key={client.id} value={client.company_id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="job-form-company"
                  required
                  maxLength={160}
                  placeholder={t("jobs_management.form.companyPlaceholder")}
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30 text-gray-900 bg-white"
                />
              )}

              {isAgency && clientsError && (
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs font-semibold text-red-600">
                  <span role="alert">{t("jobs_management.form.clientsLoadError")}</span>
                  <button
                    type="button"
                    onClick={loadAgencyClients}
                    disabled={clientsLoading}
                    className="font-black underline disabled:opacity-50"
                  >
                    {clientsLoading
                      ? t("jobs_management.form.retrying")
                      : t("jobs_management.form.clientsRetry")}
                  </button>
                </div>
              )}

              {isAgency && !clientsError && clientSelectionIssue && (
                <p className="mt-1.5 text-xs font-semibold text-amber-700" role="alert">
                  {clientSelectionIssue}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label
                htmlFor="job-form-category"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                {t("jobs_management.form.category")} *
                <FieldSyncIndicator field="category" provenance={importProvenance} />
              </label>

              <select
                id="job-form-category"
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30 text-gray-900 bg-white"
              >
                <option value="">{t("jobs_management.form.selectCategory")}</option>

                <option value="תכנות">{t("jobs_management.form.categories.programming")}</option>

                <option value="עיצוב">{t("jobs_management.form.categories.design")}</option>

                <option value="בחסות">{t("jobs_management.form.categories.sponsored")}</option>

                <option value="מכירות">{t("jobs_management.form.categories.sales")}</option>

                <option value="ניהול">{t("jobs_management.form.categories.management")}</option>

                <option value="הנדסה">{t("jobs_management.form.categories.engineering")}</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="job-form-employment-type"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                {t("jobs_management.form.employmentType")} *
                <FieldSyncIndicator field="employment_type_id" provenance={importProvenance} />
              </label>

              <select
                id="job-form-employment-type"
                required
                value={String(form.employment_type_id)}
                onChange={(e) => setForm({ ...form, employment_type_id: Number(e.target.value) })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30 text-gray-900 bg-white"
              >
                {taxonomy.employmentTypes.map((employmentType) => (
                  <option key={employmentType.type_id} value={employmentType.type_id}>
                    {t(`jobs_management.form.employmentTypes.${employmentType.type_id}`, {
                      defaultValue: employmentType.name,
                    })}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="job-form-work-mode"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                {t("jobs_management.form.workMode")} *
                <FieldSyncIndicator field="work_mode_id" provenance={importProvenance} />
              </label>

              <select
                id="job-form-work-mode"
                required
                value={String(form.work_mode_id)}
                onChange={(e) => setForm({ ...form, work_mode_id: Number(e.target.value) })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30 text-gray-900 bg-white"
              >
                {taxonomy.workModes.map((workMode) => (
                  <option key={workMode.mode_id} value={workMode.mode_id}>
                    {t(`jobs_management.form.workModes.${workMode.mode_id}`, {
                      defaultValue: workMode.name,
                    })}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="job-form-state"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                {t(job ? "jobs_management.form.status" : "jobs_management.form.initialStatus")} *
                <FieldSyncIndicator field="state" provenance={importProvenance} />
              </label>

              <select
                id="job-form-state"
                required
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30 text-gray-900 bg-white"
              >
                <option value="draft">{t("jobs_management.status.draft")}</option>
                <option value="open">{t("jobs_management.status.open")}</option>
                <option value="on_hold">{t("jobs_management.status.on_hold")}</option>
                <option value="filled">{t("jobs_management.status.filled")}</option>
                <option value="closed">{t("jobs_management.status.closed")}</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="job-form-location"
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              {t("jobs_management.form.location")}
              <FieldSyncIndicator field="location" provenance={importProvenance} />
            </label>

            <input
              id="job-form-location"
              maxLength={160}
              placeholder={t("jobs_management.form.locationPlaceholder")}
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30 text-gray-900 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="job-form-salary-min"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                {t("jobs_management.form.salaryMin")}
                <FieldSyncIndicator field="salary_min" provenance={importProvenance} />
              </label>

              <input
                id="job-form-salary-min"
                type="number"
                placeholder="15000"
                value={form.salary_min}
                onChange={(e) => setForm({ ...form, salary_min: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30 text-gray-900 bg-white"
              />
            </div>

            <div>
              <label
                htmlFor="job-form-salary-max"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                {t("jobs_management.form.salaryMax")}
                <FieldSyncIndicator field="salary_max" provenance={importProvenance} />
              </label>

              <input
                id="job-form-salary-max"
                type="number"
                placeholder="25000"
                value={form.salary_max}
                onChange={(e) => setForm({ ...form, salary_max: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30 text-gray-900 bg-white"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="job-form-description"
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              {t("jobs_management.form.description")}
              <FieldSyncIndicator field="description" provenance={importProvenance} />
            </label>

            <textarea
              id="job-form-description"
              maxLength={20000}
              placeholder={t("jobs_management.form.descriptionPlaceholder")}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={5}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30 resize-none"
            />
          </div>

          <div className="border-t border-gray-100 pt-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">
              {t("jobs_management.form.requirementsAndExperience")}
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="job-form-required-skills"
                  className="block text-sm font-semibold text-gray-900 mb-2"
                >
                  {t("jobs_management.form.requiredSkills")}
                  <FieldSyncIndicator field="required_skills" provenance={importProvenance} />
                </label>
                <textarea
                  id="job-form-required-skills"
                  value={form.required_skills_text}
                  onChange={(event) =>
                    setForm({ ...form, required_skills_text: event.target.value })
                  }
                  placeholder={t("jobs_management.form.skillsPlaceholder")}
                  rows={3}
                  className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30"
                />
                <p className="mt-1 text-xs text-gray-500">{t("jobs_management.form.skillsHelp")}</p>
              </div>

              <div>
                <label
                  htmlFor="job-form-preferred-skills"
                  className="block text-sm font-semibold text-gray-900 mb-2"
                >
                  {t("jobs_management.form.preferredSkills")}
                  <FieldSyncIndicator field="preferred_skills" provenance={importProvenance} />
                </label>
                <textarea
                  id="job-form-preferred-skills"
                  value={form.preferred_skills_text}
                  onChange={(event) =>
                    setForm({ ...form, preferred_skills_text: event.target.value })
                  }
                  placeholder={t("jobs_management.form.skillsPlaceholder")}
                  rows={3}
                  className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="job-form-seniority"
                  className="block text-sm font-semibold text-gray-900 mb-2"
                >
                  {t("jobs_management.form.seniority")}
                  <FieldSyncIndicator field="seniority" provenance={importProvenance} />
                </label>
                <select
                  id="job-form-seniority"
                  value={form.seniority}
                  onChange={(event) => setForm({ ...form, seniority: event.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30"
                >
                  {["any", "junior", "mid", "senior", "lead", "manager", "director"].map(
                    (level) => (
                      <option key={level} value={level}>
                        {t(`jobs_management.form.seniorityLevels.${level}`)}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div>
                <label
                  htmlFor="job-form-experience-years"
                  className="block text-sm font-semibold text-gray-900 mb-2"
                >
                  {t("jobs_management.form.experienceYears")}
                  <FieldSyncIndicator
                    field="years_experience_required"
                    provenance={importProvenance}
                  />
                </label>
                <input
                  id="job-form-experience-years"
                  type="number"
                  min="0"
                  max="60"
                  value={form.years_experience_required}
                  onChange={(event) =>
                    setForm({ ...form, years_experience_required: event.target.value })
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {isAgency && (
            <div className="border-t border-gray-100 pt-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">
                {t("jobs_management.form.assignmentAndOwnership")}
              </h3>

              {workflowError === "staff" && (
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-amber-700">
                  <span role="alert">{t("jobs_management.form.staffLoadError")}</span>
                  <button
                    type="button"
                    className="font-black underline"
                    onClick={() => setWorkflowRetryVersion((current) => current + 1)}
                  >
                    {t("jobs_management.tryAgain")}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="job-form-team-manager"
                    className="block text-sm font-semibold text-gray-900 mb-2"
                  >
                    {t("jobs_management.form.teamManager")}
                  </label>
                  <select
                    id="job-form-team-manager"
                    disabled={!canChooseAssignments || workflowLoading || workflowError === "staff"}
                    value={String(form.team_manager_id || "")}
                    onChange={(event) => {
                      const manager = teamManagers.find(
                        (member) => String(member.id) === event.target.value,
                      )

                      const recruiter = recruiters.find(
                        (member) => Number(member.id) === Number(form.recruiter_id),
                      )

                      setForm({
                        ...form,
                        team_manager_id: event.target.value,
                        recruiter_id:
                          manager?.team_id &&
                          recruiter?.team_id &&
                          manager.team_id !== recruiter.team_id
                            ? ""
                            : form.recruiter_id,
                      })
                    }}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30 disabled:bg-gray-50"
                  >
                    <option value="">{t("jobs_management.form.unassigned")}</option>
                    {!!form.team_manager_id &&
                      !selectableTeamManagers.some(
                        (member) => Number(member.id) === Number(form.team_manager_id),
                      ) && (
                        <option value={form.team_manager_id} disabled>
                          {t("jobs_management.form.unavailableAssignee", {
                            id: form.team_manager_id,
                          })}
                        </option>
                      )}
                    {selectableTeamManagers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.full_name || member.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="job-form-recruiter"
                    className="block text-sm font-semibold text-gray-900 mb-2"
                  >
                    {t("jobs_management.form.recruiter")}
                  </label>
                  <select
                    id="job-form-recruiter"
                    disabled={!canChooseAssignments || workflowLoading || workflowError === "staff"}
                    value={String(form.recruiter_id || "")}
                    onChange={(event) => {
                      const recruiter = recruiters.find(
                        (member) => String(member.id) === event.target.value,
                      )

                      const manager = teamManagers.find(
                        (member) => Number(member.id) === Number(form.team_manager_id),
                      )

                      setForm({
                        ...form,
                        recruiter_id: event.target.value,
                        team_manager_id:
                          recruiter?.team_id &&
                          manager?.team_id &&
                          recruiter.team_id !== manager.team_id
                            ? ""
                            : form.team_manager_id,
                      })
                    }}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30 disabled:bg-gray-50"
                  >
                    <option value="">{t("jobs_management.form.unassigned")}</option>
                    {!!form.recruiter_id &&
                      !selectableRecruiters.some(
                        (member) => Number(member.id) === Number(form.recruiter_id),
                      ) && (
                        <option value={form.recruiter_id} disabled>
                          {t("jobs_management.form.unavailableAssignee", {
                            id: form.recruiter_id,
                          })}
                        </option>
                      )}
                    {selectableRecruiters.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.full_name || member.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="job-form-recruitment-manager"
                    className="block text-sm font-semibold text-gray-900 mb-2"
                  >
                    {t("jobs_management.form.recruitmentManager")}
                  </label>
                  <select
                    id="job-form-recruitment-manager"
                    disabled={!canChooseAssignments || workflowLoading || workflowError === "staff"}
                    value={String(form.recruitment_manager_id || "")}
                    onChange={(event) =>
                      setForm({ ...form, recruitment_manager_id: event.target.value })
                    }
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30 disabled:bg-gray-50"
                  >
                    <option value="">{t("jobs_management.form.unassigned")}</option>
                    {!!form.recruitment_manager_id &&
                      !recruitmentManagers.some(
                        (member) => Number(member.id) === Number(form.recruitment_manager_id),
                      ) && (
                        <option value={form.recruitment_manager_id} disabled>
                          {t("jobs_management.form.unavailableAssignee", {
                            id: form.recruitment_manager_id,
                          })}
                        </option>
                      )}
                    {recruitmentManagers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.full_name || member.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    {t("jobs_management.form.owner")}
                  </label>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                    {owner?.full_name ||
                      owner?.email ||
                      (job?.created_by_user_id
                        ? t("jobs_management.form.ownerId", { id: job.created_by_user_id })
                        : t("jobs_management.form.currentUser"))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    {t("jobs_management.form.source")}
                  </label>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                    {t(`jobs_management.form.sources.${form.source}`)}
                  </div>
                </div>

                {canViewCompensation && (
                  <div>
                    <label
                      htmlFor="job-form-compensation-plan"
                      className="block text-sm font-semibold text-gray-900 mb-2"
                    >
                      {t("jobs_management.form.compensationPlan")}
                    </label>
                    <select
                      id="job-form-compensation-plan"
                      disabled={!canEditCompensation || workflowLoading}
                      value={String(form.compensation_plan_id || "")}
                      onChange={(event) => {
                        const selected = compensationPlans.find(
                          (plan) => String(plan.id) === event.target.value,
                        )

                        setForm({ ...form, compensation_plan_id: event.target.value })
                        setCompensationPlan(selected || null)
                      }}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30 disabled:bg-gray-50"
                    >
                      <option value="">{t("jobs_management.form.noCompensationPlan")}</option>
                      {availableCompensationPlans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.client_name} · #{plan.id}
                        </option>
                      ))}
                    </select>
                    {workflowError === "compensation" && (
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-amber-700">
                        <span role="alert">{t("jobs_management.form.compensationLoadError")}</span>
                        <button
                          type="button"
                          className="font-black underline"
                          onClick={() => setWorkflowRetryVersion((current) => current + 1)}
                        >
                          {t("jobs_management.tryAgain")}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Visibility Settings */}
          <div className="border-t border-gray-100 pt-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4" /> {t("jobs_management.form.visibility")}
            </h3>

            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_anonymous}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      is_anonymous: e.target.checked,
                      show_company_name: !e.target.checked,
                      show_company_info: !e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded border-gray-300"
                />

                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {t("jobs_management.form.anonymous")}
                  </div>

                  <div className="text-xs text-gray-500">
                    {t("jobs_management.form.anonymousHelp")}
                  </div>
                </div>
              </label>

              {!form.is_anonymous && (
                <>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.show_company_name}
                      onChange={(e) => setForm({ ...form, show_company_name: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300"
                    />

                    <div className="text-sm font-medium text-gray-900">
                      {t("jobs_management.form.showCompanyName")}
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.show_company_info}
                      onChange={(e) => setForm({ ...form, show_company_info: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300"
                    />

                    <div className="text-sm font-medium text-gray-900">
                      {t("jobs_management.form.showCompanyInfo")}
                    </div>
                  </label>
                </>
              )}

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.show_contact_details}
                  onChange={(e) => setForm({ ...form, show_contact_details: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300"
                />

                <div className="text-sm font-medium text-gray-900">
                  {t("jobs_management.form.showContactDetails")}
                </div>
              </label>

              {form.show_contact_details && (
                <div className="space-y-3 mt-3 p-3 bg-gray-50 rounded-lg">
                  <input
                    type="email"
                    aria-label={t("jobs_management.form.contactEmail")}
                    placeholder={t("jobs_management.form.contactEmail")}
                    value={form.contact_email}
                    onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30 text-gray-900 bg-white"
                  />

                  <input
                    type="tel"
                    aria-label={t("jobs_management.form.contactPhone")}
                    placeholder={t("jobs_management.form.contactPhone")}
                    value={form.contact_phone}
                    onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30 text-gray-900 bg-white"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Compensation & Warranty Display - Role-based visibility */}
          {compensationPlan && (
            <div className="bg-gradient-to-l from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 space-y-2">
              {/* Warranty period — visible to all roles that can see this modal */}
              <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                <span className="text-xs font-bold text-blue-700">
                  {t("jobs_management.form.warrantyDays")}
                </span>

                {["admin", "recruitment_manager", "team_manager"].includes(user?.role) ? (
                  <input
                    type="number"
                    aria-label={t("jobs_management.form.warrantyDays")}
                    value={compensationPlan.warranty_period_days ?? ""}
                    onChange={(e) => {
                      const days = e.target.value ? Number(e.target.value) : null

                      setCompensationPlan((prev) =>
                        prev ? { ...prev, warranty_period_days: days } : null,
                      )
                    }}
                    placeholder="30"
                    className="w-24 border border-green-200 rounded-lg px-2 py-1 text-sm text-left font-bold text-blue-800 focus:ring-2 focus:ring-green-300"
                    dir="ltr"
                  />
                ) : (
                  <span className="text-sm font-black text-blue-800">
                    {compensationPlan.warranty_period_days
                      ? t("jobs_management.days", {
                          count: numberFormatter.format(compensationPlan.warranty_period_days),
                        })
                      : "—"}
                  </span>
                )}
              </div>

              {/* Compensation breakdown — employer cannot see internal compensation */}
              {(() => {
                const formatComp = (value, type, total) => {
                  if (!value) {
                    return null
                  }

                  if (type === "fixed") {
                    return currencyFormatter.format(value)
                  }

                  if (type === "percent" && total) {
                    return currencyFormatter.format((total * value) / 100)
                  }

                  return percentFormatter.format(value / 100)
                }

                const canSeeAll = ["recruitment_manager", "admin"].includes(user?.role)

                return (
                  <>
                    {compensationPlan.recruiter_compensation &&
                      (canSeeAll ||
                        user?.role === "recruiter" ||
                        user?.role === "team_manager") && (
                        <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                          <span className="text-xs font-bold text-green-700">
                            {t(
                              user?.role === "recruiter"
                                ? "jobs_management.form.myCompensation"
                                : "jobs_management.form.recruiter",
                            )}
                            :
                          </span>

                          <span className="text-sm font-black text-green-800">
                            {formatComp(
                              compensationPlan.recruiter_compensation,
                              compensationPlan.recruiter_compensation_type,
                              compensationPlan.total_fee,
                            )}
                          </span>
                        </div>
                      )}

                    {compensationPlan.team_manager_compensation &&
                      (canSeeAll || user?.role === "team_manager") && (
                        <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                          <span className="text-xs font-bold text-green-700">
                            {t(
                              user?.role === "team_manager"
                                ? "jobs_management.form.myCompensation"
                                : "jobs_management.form.teamManager",
                            )}
                            :
                          </span>

                          <span className="text-sm font-black text-green-800">
                            {formatComp(
                              compensationPlan.team_manager_compensation,
                              compensationPlan.team_manager_compensation_type,
                              compensationPlan.total_fee,
                            )}
                          </span>
                        </div>
                      )}

                    {compensationPlan.recruitment_manager_compensation && canSeeAll && (
                      <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                        <span className="text-xs font-bold text-green-700">
                          {user?.role === "recruitment_manager"
                            ? t("jobs_management.form.myCompensation")
                            : t("jobs_management.form.recruitmentManager")}
                          :
                        </span>

                        <span className="text-sm font-black text-green-800">
                          {formatComp(
                            compensationPlan.recruitment_manager_compensation,
                            compensationPlan.recruitment_manager_compensation_type,
                            compensationPlan.total_fee,
                          )}
                        </span>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end border-t border-gray-100 pt-5">
            <DialogClose asChild>
              <button
                type="button"
                disabled={loading}
                className="px-4 h-10 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95 disabled:opacity-50"
              >
                {t("jobs_management.form.cancel")}
              </button>
            </DialogClose>

            <button
              type="submit"
              disabled={
                loading || clientsLoading || !!clientsError || (isAgency && !selectedActiveClient)
              }
              className="px-6 h-10 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#2563EB] hover:from-[#6D28D9] hover:to-[#1D4ED8] text-white text-sm font-semibold disabled:opacity-50 shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              {loading ? t("jobs_management.form.saving") : t("jobs_management.form.save")}
            </button>
          </div>
        </form>
      </DialogContent>
      <AlertDialog
        open={Boolean(overrideConfirmation)}
        onOpenChange={(open) => !open && setOverrideConfirmation(null)}
      >
        <AlertDialogContent dir={direction}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("jobs_management.form.overrideConfirmation.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("jobs_management.form.overrideConfirmation.description", {
                fields: (overrideConfirmation || [])
                  .map((field) =>
                    t(`jobs_management.form.fieldNames.${field}`, { defaultValue: field }),
                  )
                  .join(", "),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("jobs_management.form.overrideConfirmation.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => handleSubmit(null, true)}>
              {t("jobs_management.form.overrideConfirmation.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
import { X, Eye, Copy, Check, ExternalLink, LockKeyhole, RefreshCw } from "lucide-react"
