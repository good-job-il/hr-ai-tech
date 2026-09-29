import { useEffect, useRef, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  AlertTriangle,
  Archive,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Play,
  Save,
} from "lucide-react"
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { agencyClientService } from "@/api/services/agencyClientService"
import { agencyTeamsService } from "@/api/services/agencyTeamsService"
import { importSourceService } from "@/api/services/importSourceService"
import {
  importErrorAction,
  isValidImportUrl,
  JOB_IMPORT_WIZARD_STEPS,
  mergeOnboardingState,
  previewReadiness,
  sourceNameFromUrl,
  summarizeImportRun,
} from "@/domain/jobImports/onboardingWizard"
import { usePermissionMatrix } from "@/hooks/usePermissionMatrix"
import { BackIcon, PageHeading, PageShell, Panel, StatusPill } from "./JobImportUi"

const EMPTY_FORM = {
  name: "",
  url: "",
  connector_type: "",
  employer_company_id: "",
  collection_path: "",
  employment_type: "full_time",
  work_mode: "unspecified",
  category: "",
  default_team_id: "",
  default_team_manager_id: "",
  default_recruiter_id: "",
  default_recruitment_manager_id: "",
  interval_hours: "24",
  publish_policy: "draft",
  closing_policy: "disabled",
  missing_grace_runs: "2",
  overwrite_policy: "source_until_edited",
}

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"

const asNullableNumber = (value) => (value ? Number(value) : null)

const EMPTY_LIST = Object.freeze([])

const idempotencyKey = (prefix, id) => `${prefix}-${id}-${Date.now()}-${crypto.randomUUID()}`

function WizardProgress({ step, onStep }) {
  const { t } = useTranslation()

  return (
    <nav aria-label={t("jobImports.wizard.progressLabel")} className="overflow-x-auto">
      <ol className="flex min-w-max gap-2 pb-2">
        {JOB_IMPORT_WIZARD_STEPS.map((key, index) => {
          const number = index + 1

          const current = number === step

          const complete = number < step

          return (
            <li key={key}>
              <button
                type="button"
                onClick={() => complete && onStep(number)}
                disabled={!complete}
                aria-current={current ? "step" : undefined}
                className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold transition ${
                  current
                    ? "border-violet-600 bg-violet-600 text-white"
                    : complete
                      ? "border-violet-200 bg-violet-50 text-violet-700 hover:border-violet-400"
                      : "border-slate-200 bg-white text-slate-400"
                }`}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
                  {complete ? <Check className="h-3.5 w-3.5" /> : number}
                </span>
                {t(`jobImports.wizard.steps.${key}`)}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function Field({ label, hint, error, children }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-800">{label}</span>
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
      <span className="mt-2 block">{children}</span>
      {error && <span className="mt-1 block text-xs font-semibold text-red-600">{error}</span>}
    </label>
  )
}

function WizardError({ error, code, onRetry, onBack }) {
  const { t } = useTranslation()

  const action = importErrorAction(code)

  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
        <div className="flex-1">
          <p className="font-bold text-red-900">{error}</p>
          <p className="mt-1 text-sm text-red-700">
            {t(`jobImports.wizard.errorActions.${action}`)}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="rounded-lg bg-white px-3 py-2 text-sm font-bold text-red-700 shadow-sm"
              >
                {t("common.retry")}
              </button>
            )}
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="rounded-lg px-3 py-2 text-sm font-bold text-red-700"
              >
                {t("jobImports.wizard.changeSettings")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Footer({ step, busy, nextDisabled, onBack, onNext, nextLabel }) {
  const { t, i18n } = useTranslation()

  const NextIcon = i18n.dir() === "rtl" ? ChevronLeft : ChevronRight

  const PreviousIcon = i18n.dir() === "rtl" ? ChevronRight : ChevronLeft

  return (
    <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
      <button
        type="button"
        onClick={onBack}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
      >
        <PreviousIcon className="h-4 w-4" />
        {step === 1 ? t("common.cancel") : t("common.back")}
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={busy || nextDisabled}
        className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <NextIcon className="h-4 w-4" />}
        {nextLabel || t("common.continue")}
      </button>
    </div>
  )
}

function SampleTable({ items }) {
  const { t } = useTranslation()

  if (!items.length) {
    return (
      <p className="rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500">
        {t("jobImports.wizard.sample.empty")}
      </p>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="overflow-x-auto">
        <table className="min-w-full text-start text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 text-start">{t("jobImports.wizard.sample.sourceValue")}</th>
              <th className="px-4 py-3 text-start">{t("jobImports.wizard.sample.normalized")}</th>
              <th className="px-4 py-3 text-start">{t("jobImports.wizard.sample.action")}</th>
              <th className="px-4 py-3 text-start">{t("jobImports.wizard.sample.warnings")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={item.id} className="align-top">
                <td className="max-w-[260px] px-4 py-3">
                  <p className="font-bold text-slate-900">
                    {String(
                      item.source_payload?.title ||
                        item.source_payload?.jobTitle ||
                        item.normalized_candidate.title ||
                        "—",
                    )}
                  </p>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs font-bold text-violet-700">
                      {t("jobImports.wizard.sample.rawView")}
                    </summary>
                    <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-950 p-3 text-[11px] text-slate-100">
                      {JSON.stringify(item.source_payload, null, 2)}
                    </pre>
                  </details>
                </td>
                <td className="max-w-[260px] px-4 py-3">
                  <p className="font-semibold text-slate-800">
                    {String(item.normalized_candidate.title || "—")}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {String(item.normalized_candidate.source_company_label || "—")}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <StatusPill value={item.proposed_action} />
                </td>
                <td className="max-w-[280px] px-4 py-3">
                  {item.validation_issues?.length ? (
                    <ul className="space-y-1 text-xs text-amber-700">
                      {item.validation_issues.map((issue, index) => (
                        <li key={`${issue.code}-${index}`}>{issue.message}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-xs text-emerald-700">
                      {t("jobImports.wizard.sample.noWarnings")}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function JobImportNewPage() {
  const { t, i18n } = useTranslation()

  const navigate = useNavigate()

  const queryClient = useQueryClient()

  const [searchParams, setSearchParams] = useSearchParams()

  const sourceId = Number(searchParams.get("sourceId")) || null

  const { canResource, loading: permissionsLoading } = usePermissionMatrix()

  const [step, setStep] = useState(1)

  const [form, setForm] = useState(EMPTY_FORM)

  const [busy, setBusy] = useState(false)

  const [error, setError] = useState(null)

  const [errorCode, setErrorCode] = useState(null)

  const [previewRun, setPreviewRun] = useState(null)

  const [previewItems, setPreviewItems] = useState([])

  const [confirmed, setConfirmed] = useState(false)

  const [destructiveConfirmed, setDestructiveConfirmed] = useState(false)

  const [activateSchedule, setActivateSchedule] = useState(true)

  const [archivePrompt, setArchivePrompt] = useState(false)

  const [applyResult, setApplyResult] = useState(null)

  const hydratedSourceId = useRef(null)

  const sourceQuery = useQuery({
    queryKey: ["job-import-source", sourceId],
    queryFn: () => importSourceService.get(sourceId),
    enabled: Boolean(sourceId),
  })

  const catalogQuery = useQuery({
    queryKey: ["job-import-connectors"],
    queryFn: () => importSourceService.connectorCatalog(),
  })

  const clientsQuery = useQuery({
    queryKey: ["agency-clients", "active", "job-import-wizard"],
    queryFn: () => agencyClientService.list({ status: "active", limit: 300 }),
  })

  const teamsQuery = useQuery({
    queryKey: ["agency-teams", "job-import-wizard"],
    queryFn: agencyTeamsService.overview,
  })

  const source = sourceQuery.data

  const catalog = catalogQuery.data || EMPTY_LIST

  const clients = clientsQuery.data || EMPTY_LIST

  const teams = teamsQuery.data?.teams || EMPTY_LIST

  const members = teamsQuery.data?.members || EMPTY_LIST

  useEffect(() => {
    if (!source || hydratedSourceId.current === source.id) {
      return
    }

    const defaults = source.configuration?.defaults || {}

    setForm({
      ...EMPTY_FORM,
      name: source.name || "",
      url: source.url || "",
      connector_type: source.connector_type || "",
      employer_company_id: source.employer_company_id ? String(source.employer_company_id) : "",
      collection_path: source.configuration?.collection_path || "",
      employment_type: defaults.employment_type || "full_time",
      work_mode: defaults.work_mode || "unspecified",
      category: defaults.category || "",
      default_team_id: source.default_team_id ? String(source.default_team_id) : "",
      default_team_manager_id: source.default_team_manager_id
        ? String(source.default_team_manager_id)
        : "",
      default_recruiter_id: source.default_recruiter_id ? String(source.default_recruiter_id) : "",
      default_recruitment_manager_id: source.default_recruitment_manager_id
        ? String(source.default_recruitment_manager_id)
        : "",
      interval_hours: String(source.interval_hours ?? 24),
      publish_policy: source.publish_policy || "draft",
      closing_policy: source.closing_policy || "disabled",
      missing_grace_runs: String(source.missing_grace_runs ?? 2),
      overwrite_policy: source.onboarding_state?.overwrite_policy || "source_until_edited",
    })
    setStep(Math.min(Math.max(source.onboarding_step || 1, 1), 7))
    hydratedSourceId.current = source.id
  }, [source])

  useEffect(() => {
    if (!form.connector_type && catalog.length === 1) {
      setForm((current) => ({ ...current, connector_type: catalog[0].type }))
    }
  }, [catalog, form.connector_type])

  useEffect(() => {
    const runId = source?.onboarding_state?.preview_run_id

    if (!runId || previewRun?.id === runId) {
      return
    }

    let cancelled = false

    Promise.all([
      importSourceService.getRun(runId),
      importSourceService.listRunItems(runId, { page: 1, limit: 100 }),
    ])
      .then(([run, items]) => {
        if (!cancelled) {
          setPreviewRun(run)
          setPreviewItems(items.data)
        }
      })
      .catch((caught) => {
        if (!cancelled) {
          setError(caught?.message || "Preview result could not be restored")
          setErrorCode(caught?.code || null)
        }
      })

    return () => {
      cancelled = true
    }
  }, [source?.onboarding_state?.preview_run_id, previewRun?.id])

  const selectedConnector = catalog.find((item) => item.type === form.connector_type)

  const selectedTeam = teams.find((team) => String(team.id) === form.default_team_id)

  const teamMembers = form.default_team_id
    ? members.filter((member) => String(member.team_id) === form.default_team_id)
    : members

  const managers = members.filter((member) => member.role === "recruitment_manager")

  const recruiters = teamMembers.filter((member) => member.role === "recruiter")

  const teamManagers = teamMembers.filter((member) => member.role === "team_manager")

  const previewSummary = summarizeImportRun(previewRun)

  const readiness = previewReadiness(previewRun)

  const setField = (field) => (event) => {
    const value = event.target.value

    setForm((current) => ({ ...current, [field]: value }))
    setError(null)
  }

  const showError = (caught, fallbackCode = null) => {
    const typed = caught?.details?.code || caught?.details?.error?.code || caught?.code

    setError(caught?.message || t("jobImports.wizard.genericError"))
    setErrorCode(typed || fallbackCode)
  }

  const refreshSource = () =>
    queryClient.invalidateQueries({ queryKey: ["job-import-source", sourceId] })

  const persistProgress = async (nextStep, patch = {}, statePatch = {}) => {
    if (!sourceId) {
      return
    }

    await importSourceService.update(sourceId, {
      ...patch,
      onboarding_step: nextStep,
      onboarding_state: mergeOnboardingState(source?.onboarding_state, statePatch),
    })
    setStep(nextStep)
    await refreshSource()
  }

  const handleSource = async () => {
    if (!isValidImportUrl(form.url)) {
      setError(t("jobImports.wizard.errors.invalidUrl"))
      setErrorCode("UNSUPPORTED_FORMAT")

      return
    }

    if (!form.connector_type) {
      setError(t("jobImports.wizard.errors.connectorRequired"))
      setErrorCode("UNSUPPORTED_FORMAT")

      return
    }

    setBusy(true)
    setError(null)

    try {
      const payload = {
        name: form.name.trim() || sourceNameFromUrl(form.url),
        url: form.url.trim(),
        connector_type: form.connector_type,
        configuration: source?.configuration || {},
      }

      if (sourceId) {
        await persistProgress(2, payload)

        return
      }

      const draft = await importSourceService.createOnboardingDraft({
        ...payload,
        locale: i18n.language?.startsWith("he") ? "he" : "en",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      })

      setSearchParams({ sourceId: String(draft.id) }, { replace: true })
      hydratedSourceId.current = null
      setStep(2)
    } catch (caught) {
      showError(caught, "UNSUPPORTED_FORMAT")
    } finally {
      setBusy(false)
    }
  }

  const handleClient = async () => {
    if (!form.employer_company_id) {
      setError(t("jobImports.wizard.errors.clientRequired"))
      setErrorCode("CLIENT_UNAVAILABLE")

      return
    }

    setBusy(true)
    setError(null)

    try {
      await persistProgress(3, { employer_company_id: Number(form.employer_company_id) })
    } catch (caught) {
      showError(caught, "CLIENT_UNAVAILABLE")
    } finally {
      setBusy(false)
    }
  }

  const handleConnection = async () => {
    setBusy(true)
    setError(null)

    try {
      const discovery = await importSourceService.discover(sourceId)

      await persistProgress(4, {}, { discovery })
    } catch (caught) {
      showError(caught)
    } finally {
      setBusy(false)
    }
  }

  const executePreview = async () => {
    setBusy(true)
    setError(null)
    setPreviewRun(null)
    setPreviewItems([])

    try {
      const run = await importSourceService.preview(sourceId, idempotencyKey("preview", sourceId))

      const items = await importSourceService.listRunItems(run.id, { page: 1, limit: 100 })

      setPreviewRun(run)
      setPreviewItems(items.data)
      await persistProgress(
        step,
        {},
        {
          preview_run_id: run.id,
          preview_completed_at: new Date().toISOString(),
        },
      )
    } catch (caught) {
      showError(caught)
    } finally {
      setBusy(false)
    }
  }

  const handleMapping = async () => {
    setBusy(true)
    setError(null)

    try {
      await persistProgress(
        6,
        {
          configuration: {
            ...(form.collection_path ? { collection_path: form.collection_path } : {}),
            defaults: {
              employment_type: form.employment_type,
              work_mode: form.work_mode,
              category: form.category.trim() || null,
            },
          },
          default_team_id: asNullableNumber(form.default_team_id),
          default_team_manager_id: asNullableNumber(form.default_team_manager_id),
          default_recruiter_id: asNullableNumber(form.default_recruiter_id),
          default_recruitment_manager_id: asNullableNumber(form.default_recruitment_manager_id),
          interval_hours: Number(form.interval_hours),
          publish_policy: form.publish_policy,
          closing_policy: form.closing_policy,
          missing_grace_runs: Number(form.missing_grace_runs),
        },
        {
          overwrite_policy: form.overwrite_policy,
          preview_run_id: undefined,
          preview_completed_at: undefined,
        },
      )
      setPreviewRun(null)
      setPreviewItems([])
    } catch (caught) {
      showError(caught, "MAPPING_INVALID")
    } finally {
      setBusy(false)
    }
  }

  const handleDryRunContinue = async () => {
    if (!readiness.ready || (previewSummary.destructive > 0 && !destructiveConfirmed)) {
      return
    }

    setBusy(true)

    try {
      await persistProgress(
        7,
        {},
        {
          preview_run_id: previewRun.id,
          preview_completed_at: new Date().toISOString(),
        },
      )
    } catch (caught) {
      showError(caught)
    } finally {
      setBusy(false)
    }
  }

  const handleApply = async () => {
    if (!confirmed || !previewRun) {
      return
    }

    setBusy(true)
    setError(null)

    try {
      const result = await importSourceService.applyRun(
        previewRun.id,
        idempotencyKey("apply", previewRun.id),
      )

      setApplyResult(result)

      if (result.failed > 0) {
        setError(t("jobImports.wizard.errors.applyPartial", { count: result.failed }))
        setErrorCode("PARTIAL_SNAPSHOT")

        return
      }

      if (activateSchedule && Number(form.interval_hours) > 0) {
        await importSourceService.resume(sourceId)
      }

      toast.success(t("jobImports.wizard.completed"))
      navigate(`/agency/import/jobs/${sourceId}`, { replace: true })
    } catch (caught) {
      showError(caught)
    } finally {
      setBusy(false)
    }
  }

  const goBack = async () => {
    setError(null)

    if (step === 1) {
      navigate("/agency/import/jobs")

      return
    }

    try {
      await persistProgress(step - 1)
    } catch (caught) {
      showError(caught)
    }
  }

  const archiveDraft = async () => {
    setBusy(true)

    try {
      await importSourceService.remove(sourceId)
      toast.success(t("jobImports.wizard.draftArchived"))
      navigate("/agency/import/jobs", { replace: true })
    } catch (caught) {
      showError(caught)
    } finally {
      setBusy(false)
    }
  }

  if (permissionsLoading || (sourceId && sourceQuery.isLoading)) {
    return (
      <PageShell>
        <Panel className="text-center text-sm text-slate-500">{t("common.loading")}</Panel>
      </PageShell>
    )
  }

  if (!canResource("job_imports", "create")) {
    return <Navigate to="/unauthorized" replace />
  }

  if (sourceQuery.isError) {
    return (
      <PageShell>
        <WizardError
          error={sourceQuery.error?.message || t("jobImports.common.loadError")}
          onRetry={() => sourceQuery.refetch()}
        />
      </PageShell>
    )
  }

  const nextActions = {
    1: handleSource,
    2: handleClient,
    3: handleConnection,
    4: () => (previewRun ? persistProgress(5) : executePreview()),
    5: handleMapping,
    6: handleDryRunContinue,
    7: handleApply,
  }

  const nextDisabled =
    (step === 1 && (!form.url || !form.connector_type)) ||
    (step === 2 && !form.employer_company_id) ||
    (step === 4 && !previewRun) ||
    (step === 6 &&
      (!readiness.ready || (previewSummary.destructive > 0 && !destructiveConfirmed))) ||
    (step === 7 && !confirmed)

  const stepKey = JOB_IMPORT_WIZARD_STEPS[step - 1]

  return (
    <PageShell>
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/agency/import/jobs"
          className="inline-flex items-center gap-2 text-sm font-bold text-violet-700"
        >
          <BackIcon />
          {t("jobImports.common.backToSources")}
        </Link>
        {sourceId && (
          <button
            type="button"
            onClick={() => setArchivePrompt(true)}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100"
          >
            <Archive className="h-4 w-4" />
            {t("jobImports.wizard.cancelSetup")}
          </button>
        )}
      </div>
      <PageHeading
        eyebrow={t("jobImports.new.eyebrow")}
        title={t(`jobImports.wizard.titles.${stepKey}`)}
        description={t(`jobImports.wizard.descriptions.${stepKey}`)}
      />
      <WizardProgress step={step} onStep={(next) => persistProgress(next)} />
      {archivePrompt && (
        <Panel className="border-amber-200 bg-amber-50">
          <p className="font-black text-amber-950">{t("jobImports.wizard.cancelTitle")}</p>
          <p className="mt-1 text-sm text-amber-800">{t("jobImports.wizard.cancelDescription")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate("/agency/import/jobs")}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm"
            >
              <Save className="h-4 w-4" />
              {t("jobImports.wizard.keepDraft")}
            </button>
            <button
              type="button"
              onClick={archiveDraft}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white"
            >
              <Archive className="h-4 w-4" />
              {t("jobImports.wizard.archiveDraft")}
            </button>
            <button
              type="button"
              onClick={() => setArchivePrompt(false)}
              className="px-3 py-2 text-sm font-bold text-amber-800"
            >
              {t("common.continue")}
            </button>
          </div>
        </Panel>
      )}
      <Panel>
        {error && ![1, 2].includes(step) && (
          <div className="mb-5">
            <WizardError
              error={error}
              code={errorCode}
              onRetry={
                step === 3
                  ? handleConnection
                  : step === 4 || step === 6
                    ? executePreview
                    : undefined
              }
              onBack={step > 1 ? () => setStep(Math.max(1, step - 1)) : undefined}
            />
          </div>
        )}
        <WizardStep
          step={step}
          t={t}
          form={form}
          setField={setField}
          error={error}
          errorCode={errorCode}
          catalog={catalog}
          catalogLoading={catalogQuery.isLoading}
          selectedConnector={selectedConnector}
          clients={clients}
          clientsLoading={clientsQuery.isLoading}
          source={source}
          previewRun={previewRun}
          previewItems={previewItems}
          executePreview={executePreview}
          busy={busy}
          teams={teams}
          selectedTeam={selectedTeam}
          teamManagers={teamManagers}
          recruiters={recruiters}
          managers={managers}
          readiness={readiness}
          previewSummary={previewSummary}
          destructiveConfirmed={destructiveConfirmed}
          setDestructiveConfirmed={setDestructiveConfirmed}
          confirmed={confirmed}
          setConfirmed={setConfirmed}
          activateSchedule={activateSchedule}
          setActivateSchedule={setActivateSchedule}
          applyResult={applyResult}
          setStep={setStep}
        />
        <Footer
          step={step}
          busy={busy}
          nextDisabled={nextDisabled}
          onBack={goBack}
          onNext={nextActions[step]}
          nextLabel={step === 7 ? t("jobImports.wizard.confirmation.apply") : undefined}
        />
      </Panel>
    </PageShell>
  )
}

function WizardStep(props) {
  const {
    step,
    t,
    form,
    setField,
    error,
    errorCode,
    catalog,
    catalogLoading,
    selectedConnector,
    clients,
    clientsLoading,
    source,
    previewRun,
    previewItems,
    executePreview,
    busy,
    teams,
    selectedTeam,
    teamManagers,
    recruiters,
    managers,
    readiness,
    previewSummary,
    destructiveConfirmed,
    setDestructiveConfirmed,
    confirmed,
    setConfirmed,
    activateSchedule,
    setActivateSchedule,
    applyResult,
    setStep,
  } = props

  if (step === 1) {
    return (
      <div className="grid gap-5">
        <Field
          label={t("jobImports.wizard.source.url")}
          hint={t("jobImports.wizard.source.urlHint")}
          error={errorCode === "UNSUPPORTED_FORMAT" ? error : null}
        >
          <input
            autoFocus
            type="url"
            value={form.url}
            onChange={setField("url")}
            placeholder="https://company.example/jobs.json"
            className={inputClass}
          />
        </Field>
        <Field
          label={t("jobImports.wizard.source.name")}
          hint={t("jobImports.wizard.source.nameHint")}
        >
          <input
            value={form.name}
            onChange={setField("name")}
            placeholder={
              sourceNameFromUrl(form.url) || t("jobImports.wizard.source.namePlaceholder")
            }
            className={inputClass}
          />
        </Field>
        <Field
          label={t("jobImports.wizard.source.connector")}
          hint={t("jobImports.wizard.source.connectorHint")}
        >
          <select
            value={form.connector_type}
            onChange={setField("connector_type")}
            className={inputClass}
            disabled={catalogLoading}
          >
            <option value="">{t("jobImports.wizard.source.selectConnector")}</option>
            {catalog.map((connector) => (
              <option key={connector.type} value={connector.type}>
                {t(`jobImports.connectors.${connector.type}`, { defaultValue: connector.type })}
              </option>
            ))}
          </select>
        </Field>
        {selectedConnector && (
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-800">
              {t("jobImports.wizard.source.supportedCapabilities")}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedConnector.capabilities.map((capability) => (
                <StatusPill key={capability} value={capability} />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (step === 2) {
    return (
      <div className="space-y-5">
        <Field
          label={t("jobImports.wizard.client.label")}
          hint={t("jobImports.wizard.client.hint")}
          error={errorCode === "CLIENT_UNAVAILABLE" ? error : null}
        >
          <select
            autoFocus
            value={form.employer_company_id}
            onChange={setField("employer_company_id")}
            className={inputClass}
          >
            <option value="">{t("jobImports.wizard.client.select")}</option>
            {clients.map((client) => (
              <option key={client.id} value={client.company_id}>
                {client.company?.name || `#${client.company_id}`}
              </option>
            ))}
          </select>
        </Field>
        {!clientsLoading && clients.length === 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-bold">{t("jobImports.wizard.client.none")}</p>
            <Link
              to="/agency/clients"
              className="mt-2 inline-flex items-center gap-1 font-bold underline"
            >
              {t("jobImports.wizard.client.manage")}
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>
    )
  }

  if (step === 3) {
    const discovery = source?.onboarding_state?.discovery

    return (
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Panel className="bg-slate-50 shadow-none">
            <p className="text-xs font-bold uppercase text-slate-500">
              {t("jobImports.wizard.connection.connector")}
            </p>
            <p className="mt-2 font-black text-slate-900">
              {selectedConnector?.type || source?.connector_type}
            </p>
          </Panel>
          <Panel className="bg-slate-50 shadow-none">
            <p className="text-xs font-bold uppercase text-slate-500">
              {t("jobImports.wizard.connection.status")}
            </p>
            <p className="mt-2 font-black text-slate-900">
              {discovery
                ? t("jobImports.wizard.connection.validated")
                : t("jobImports.wizard.connection.notChecked")}
            </p>
          </Panel>
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-900">
            {t("jobImports.wizard.connection.capabilities")}
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedConnector?.capabilities.map((value) => (
              <StatusPill key={value} value={value} />
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-900">
            {t("jobImports.wizard.connection.limitations")}
          </h3>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-600">
            {selectedConnector?.limitations.length ? (
              selectedConnector.limitations.map((value) => (
                <li key={value}>
                  {t(`jobImports.capabilities.${value}`, { defaultValue: value })}
                </li>
              ))
            ) : (
              <li>{t("jobImports.wizard.connection.noLimitations")}</li>
            )}
          </ul>
        </div>
      </div>
    )
  }

  if (step === 4) {
    return (
      <div className="space-y-5">
        {!previewRun && (
          <div className="rounded-xl bg-violet-50 p-5 text-center">
            <Play className="mx-auto h-8 w-8 text-violet-600" />
            <p className="mt-3 font-black text-slate-900">{t("jobImports.wizard.sample.title")}</p>
            <p className="mt-1 text-sm text-slate-600">
              {t("jobImports.wizard.sample.description")}
            </p>
            <button
              type="button"
              onClick={executePreview}
              disabled={busy}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("jobImports.wizard.sample.run")}
            </button>
          </div>
        )}
        {previewRun && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-black text-slate-900">
                  {t("jobImports.wizard.sample.results", { count: previewRun.items_fetched })}
                </p>
                <p className="text-sm text-slate-500">{t("jobImports.wizard.sample.readOnly")}</p>
              </div>
              <StatusPill value={previewRun.status} />
            </div>
            <SampleTable items={previewItems.slice(0, 10)} />
          </>
        )}
      </div>
    )
  }

  if (step === 5) {
    const employmentTypes = [
      "full_time",
      "part_time",
      "contract",
      "temporary",
      "internship",
      "freelance",
    ]

    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t("jobImports.wizard.mapping.collectionPath")}>
            <select
              value={form.collection_path}
              onChange={setField("collection_path")}
              className={inputClass}
            >
              <option value="">{t("jobImports.wizard.mapping.auto")}</option>
              {["jobs", "data", "results", "root"].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("jobImports.wizard.mapping.employmentDefault")}>
            <select
              value={form.employment_type}
              onChange={setField("employment_type")}
              className={inputClass}
            >
              {employmentTypes.map((value) => (
                <option key={value} value={value}>
                  {t(`jobImports.employment.${value}`)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("jobImports.wizard.mapping.workModeDefault")}>
            <select value={form.work_mode} onChange={setField("work_mode")} className={inputClass}>
              {["unspecified", "onsite", "hybrid", "remote"].map((value) => (
                <option key={value} value={value}>
                  {t(`jobImports.workMode.${value}`)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label={t("jobImports.wizard.mapping.categoryDefault")}>
          <input value={form.category} onChange={setField("category")} className={inputClass} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("jobImports.wizard.mapping.team")}>
            <select
              value={form.default_team_id}
              onChange={setField("default_team_id")}
              className={inputClass}
            >
              <option value="">{t("jobImports.wizard.mapping.noAssignment")}</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("jobImports.wizard.mapping.teamManager")}>
            <select
              value={form.default_team_manager_id}
              onChange={setField("default_team_manager_id")}
              className={inputClass}
              disabled={!selectedTeam}
            >
              <option value="">{t("jobImports.wizard.mapping.noAssignment")}</option>
              {teamManagers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.full_name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("jobImports.wizard.mapping.recruiter")}>
            <select
              value={form.default_recruiter_id}
              onChange={setField("default_recruiter_id")}
              className={inputClass}
              disabled={!selectedTeam}
            >
              <option value="">{t("jobImports.wizard.mapping.noAssignment")}</option>
              {recruiters.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.full_name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("jobImports.wizard.mapping.recruitmentManager")}>
            <select
              value={form.default_recruitment_manager_id}
              onChange={setField("default_recruitment_manager_id")}
              className={inputClass}
            >
              <option value="">{t("jobImports.wizard.mapping.noAssignment")}</option>
              {managers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.full_name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label={t("jobImports.wizard.mapping.schedule")}>
            <select
              value={form.interval_hours}
              onChange={setField("interval_hours")}
              className={inputClass}
            >
              <option value="0">{t("jobImports.wizard.mapping.manual")}</option>
              <option value="6">6h</option>
              <option value="12">12h</option>
              <option value="24">24h</option>
              <option value="168">7d</option>
            </select>
          </Field>
          <Field label={t("jobImports.wizard.mapping.publishPolicy")}>
            <select
              value={form.publish_policy}
              onChange={setField("publish_policy")}
              className={inputClass}
            >
              <option value="draft">{t("jobImports.wizard.mapping.drafts")}</option>
              <option value="review">{t("jobImports.wizard.mapping.review")}</option>
            </select>
          </Field>
          <Field label={t("jobImports.wizard.mapping.closingPolicy")}>
            <select
              value={form.closing_policy}
              onChange={setField("closing_policy")}
              className={inputClass}
            >
              <option value="disabled">{t("jobImports.wizard.mapping.neverClose")}</option>
              <option value="explicit_only">{t("jobImports.wizard.mapping.explicitClose")}</option>
              <option value="missing_grace">{t("jobImports.wizard.mapping.missingGrace")}</option>
            </select>
          </Field>
          <Field label={t("jobImports.wizard.mapping.overwritePolicy")}>
            <select
              value={form.overwrite_policy}
              onChange={setField("overwrite_policy")}
              className={inputClass}
            >
              <option value="source_until_edited">
                {t("jobImports.wizard.mapping.protectEdits")}
              </option>
              <option value="review_on_conflict">
                {t("jobImports.wizard.mapping.reviewConflicts")}
              </option>
            </select>
          </Field>
        </div>
      </div>
    )
  }

  if (step === 6) {
    return (
      <div className="space-y-5">
        {!previewRun && (
          <div className="rounded-xl border border-violet-200 bg-violet-50 p-5 text-center">
            <p className="font-black text-slate-900">{t("jobImports.wizard.dryRun.title")}</p>
            <p className="mt-1 text-sm text-slate-600">
              {t("jobImports.wizard.dryRun.description")}
            </p>
            <button
              type="button"
              onClick={executePreview}
              disabled={busy}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {t("jobImports.wizard.dryRun.run")}
            </button>
          </div>
        )}
        {previewRun && (
          <>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {["create", "update", "close", "reopen", "skip", "review"].map((action) => (
                <div key={action} className="rounded-xl bg-slate-50 p-3 text-center">
                  <p className="text-xs font-bold uppercase text-slate-500">
                    {t(`jobImports.run.actions.${action}`)}
                  </p>
                  <p className="mt-1 text-xl font-black text-slate-900">
                    {previewRun[`${action}_count`] || 0}
                  </p>
                </div>
              ))}
            </div>
            {!readiness.ready && (
              <WizardError
                error={t(`jobImports.wizard.previewStates.${readiness.reason}`)}
                code={previewRun.error?.code}
                onRetry={executePreview}
                onBack={() => setStep(5)}
              />
            )}
            {previewSummary.destructive > 0 && (
              <label className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                <input
                  type="checkbox"
                  checked={destructiveConfirmed}
                  onChange={(event) => setDestructiveConfirmed(event.target.checked)}
                  className="mt-1 h-4 w-4"
                />
                <span className="text-sm text-red-900">
                  {t("jobImports.wizard.dryRun.confirmClose", {
                    count: previewSummary.destructive,
                  })}
                </span>
              </label>
            )}
            <SampleTable items={previewItems} />
          </>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <h3 className="font-black text-emerald-900">{t("jobImports.wizard.confirmation.title")}</h3>
        <p className="mt-2 text-sm text-emerald-800">
          {t("jobImports.wizard.confirmation.description", {
            count: previewRun?.items_fetched || 0,
          })}
        </p>
      </div>
      <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
        <input
          type="checkbox"
          checked={activateSchedule}
          onChange={(event) => setActivateSchedule(event.target.checked)}
          className="mt-1 h-4 w-4"
        />
        <span>
          <span className="block text-sm font-bold text-slate-900">
            {t("jobImports.wizard.confirmation.activate")}
          </span>
          <span className="mt-1 block text-xs text-slate-500">
            {t("jobImports.wizard.confirmation.activateHint", { hours: form.interval_hours })}
          </span>
        </span>
      </label>
      <label className="flex items-start gap-3 rounded-xl border border-violet-200 bg-violet-50 p-4">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
          className="mt-1 h-4 w-4"
        />
        <span className="text-sm font-bold text-violet-900">
          {t("jobImports.wizard.confirmation.confirm")}
        </span>
      </label>
      {applyResult && (
        <p className="text-sm text-slate-600">
          {t("jobImports.wizard.confirmation.applyResult", applyResult)}
        </p>
      )}
    </div>
  )
}
