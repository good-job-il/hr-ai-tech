import { useEffect, useMemo, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit3,
  ExternalLink,
  Link2,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  SkipForward,
  X,
} from "lucide-react"
import { Link, useParams, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { agencyClientService } from "@/api/services/agencyClientService"
import { importSourceService } from "@/api/services/importSourceService"
import { usePermissionMatrix } from "@/hooks/usePermissionMatrix"
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
import {
  BackIcon,
  ErrorPanel,
  formatImportCurrency,
  formatImportDate,
  formatImportNumber,
  formatImportPercent,
  localizedImportError,
  localizedImportIssue,
  PageHeading,
  PageShell,
  Panel,
  StatusPill,
} from "./JobImportUi"

const PAGE_SIZE = 25

const REVIEW_ACTIONS = ["create", "update", "close", "reopen", "skip"]

const ISSUE_CODES = [
  "INVALID_JOB_TITLE",
  "CURRENT_JOB_FIELD_CONFLICT",
  "FIELD_OWNERSHIP_REVIEW_REQUIRED",
  "PROBABLE_CROSS_SOURCE_DUPLICATE",
  "IDENTITY_CHANGE_REVIEW_REQUIRED",
  "MANUAL_TERMINAL_STATE_PROTECTED",
  "STALE_ITEM_CONFLICT",
]

const stringify = (value) => {
  if (value == null || value === "") {
    return "—"
  }

  if (typeof value === "string") {
    return value
  }

  return JSON.stringify(value, null, 2)
}

const displayValue = (value, field, locale, t) => {
  if (typeof value === "number") {
    return formatImportNumber(value, locale)
  }

  if (
    value &&
    typeof value === "object" &&
    value.currency &&
    (value.minimum != null || value.maximum != null)
  ) {
    return [value.minimum, value.maximum]
      .filter((amount) => amount != null)
      .map((amount) => formatImportCurrency(amount, value.currency, locale))
      .join(" – ")
  }

  if (
    typeof value === "string" &&
    /(?:_at|_date|valid_through)$/.test(field) &&
    !Number.isNaN(Date.parse(value))
  ) {
    return formatImportDate(value, locale)
  }

  if (typeof value === "string") {
    const namespace = {
      employment_type: "employment",
      work_mode: "workMode",
      source_status: "statuses",
      state: "statuses",
    }[field]

    if (namespace) {
      return t(`jobImports.${namespace}.${value}`, {
        defaultValue: t("jobImports.statuses.unknown"),
      })
    }
  }

  return stringify(value)
}

function DataPanel({ title, value, tone = "slate", raw = false }) {
  const { t, i18n } = useTranslation()

  const tones = {
    slate: "border-slate-200 bg-slate-50",
    violet: "border-violet-200 bg-violet-50",
    blue: "border-blue-200 bg-blue-50",
  }

  return (
    <section className={`min-w-0 rounded-xl border p-4 ${tones[tone]}`}>
      <h4 className="text-xs font-black uppercase tracking-wide text-slate-600">{title}</h4>
      <dl className="mt-3 max-h-80 space-y-2 overflow-auto text-xs">
        {value && typeof value === "object" ? (
          Object.entries(value)
            .filter(([key]) => !["field_provenance", "raw_checksum"].includes(key))
            .map(([key, entry]) => (
              <div key={key} className="grid gap-1 border-b border-black/5 pb-2 last:border-0">
                <dt className="font-bold text-slate-500">
                  {raw ? (
                    <code dir="ltr">{key}</code>
                  ) : (
                    t(`jobImports.fields.${key}`, { defaultValue: t("jobImports.fields.unknown") })
                  )}
                </dt>
                <dd
                  dir={raw ? "ltr" : "auto"}
                  className="whitespace-pre-wrap break-all text-slate-800"
                >
                  {raw ? stringify(entry) : displayValue(entry, key, i18n.language, t)}
                </dd>
              </div>
            ))
        ) : (
          <div className="text-slate-500">—</div>
        )}
      </dl>
    </section>
  )
}

function FieldDiff({ diff, t }) {
  const { i18n } = useTranslation()

  const rows = Object.entries(diff || {}).filter(([field]) => !field.startsWith("_"))

  if (!rows.length) {
    return <p className="text-sm text-slate-500">{t("jobImports.review.noFieldChanges")}</p>
  }

  return (
    <div className="grid min-w-0 gap-3">
      {rows.map(([field, raw]) => {
        const value = raw && typeof raw === "object" ? raw : {}

        return (
          <article key={field} className="min-w-0 rounded-xl border border-slate-200 p-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-bold text-slate-900">
                {t(`jobImports.fields.${field}`, { defaultValue: t("jobImports.fields.unknown") })}
              </h4>
              <StatusPill value={value.ownership || "unknown"} />
            </div>
            <dl className="mt-3 grid min-w-0 gap-2 md:grid-cols-3">
              {[
                ["sourceBefore", value.source_before],
                ["sourceAfter", value.source_after],
                ["currentJob", value.current_job],
              ].map(([key, entry]) => (
                <div key={key} className="min-w-0 rounded-lg bg-slate-50 p-3">
                  <dt className="font-bold text-slate-500">{t(`jobImports.review.${key}`)}</dt>
                  <dd dir="auto" className="mt-1 whitespace-pre-wrap break-all text-slate-800">
                    {displayValue(entry, field, i18n.language, t)}
                  </dd>
                </div>
              ))}
            </dl>
          </article>
        )
      })}
    </div>
  )
}

function CorrectionForm({ item, busy, onSave, t }) {
  const candidate = item.normalized_candidate || {}

  const [values, setValues] = useState({
    title: String(candidate.title || ""),
    source_company_label: String(candidate.source_company_label || ""),
    description: String(candidate.description || ""),
    category: String(candidate.category || ""),
  })

  const [reason, setReason] = useState("")

  const [ruleField, setRuleField] = useState("")

  const [transform, setTransform] = useState("trim")

  const submit = (event) => {
    event.preventDefault()

    const corrections = Object.fromEntries(
      Object.entries(values).filter(([field, value]) => value !== String(candidate[field] || "")),
    )

    if (!Object.keys(corrections).length) {
      toast.error(t("jobImports.review.correction.noChanges"))

      return
    }

    onSave({
      corrections,
      reason,
      ...(ruleField ? { mapping_rule: { field: ruleField, transform } } : {}),
    })
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-xl border border-violet-200 bg-violet-50 p-4"
    >
      <div className="flex items-center gap-2">
        <Edit3 className="h-4 w-4 text-violet-700" />
        <h4 className="font-black text-violet-950">{t("jobImports.review.correction.title")}</h4>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {["title", "source_company_label", "category"].map((field) => (
          <label key={field} className="text-xs font-bold text-slate-700">
            {t(`jobImports.review.correction.fields.${field}`)}
            <input
              value={values[field]}
              onChange={(event) =>
                setValues((current) => ({ ...current, [field]: event.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal"
            />
          </label>
        ))}
      </div>
      <label className="block text-xs font-bold text-slate-700">
        {t("jobImports.review.correction.fields.description")}
        <textarea
          value={values.description}
          onChange={(event) =>
            setValues((current) => ({ ...current, description: event.target.value }))
          }
          rows={5}
          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal"
        />
      </label>
      <label className="block text-xs font-bold text-slate-700">
        {t("jobImports.review.reason")}
        <input
          required
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-bold text-slate-700">
          {t("jobImports.review.correction.saveRule")}
          <select
            value={ruleField}
            onChange={(event) => setRuleField(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal"
          >
            <option value="">{t("jobImports.review.correction.noRule")}</option>
            {["title", "source_company_label", "description", "category"].map((field) => (
              <option key={field} value={field}>
                {t(`jobImports.review.correction.fields.${field}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-bold text-slate-700">
          {t("jobImports.review.correction.transform")}
          <select
            value={transform}
            onChange={(event) => setTransform(event.target.value)}
            disabled={!ruleField}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50"
          >
            {["trim", "strip_html", "decode_entities"].map((value) => (
              <option key={value} value={value}>
                {t(`jobImports.review.correction.transforms.${value}`)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="text-xs text-violet-800">{t("jobImports.review.correction.ruleHint")}</p>
      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-lg bg-violet-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {t("jobImports.review.correction.save")}
      </button>
    </form>
  )
}

function ReviewItemDetails({ item, busy, onCorrect, onLink, t }) {
  return (
    <div className="space-y-5 border-t border-slate-100 bg-white p-5">
      {item.stale && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{t("jobImports.review.stale")}</span>
        </div>
      )}
      <div className="grid gap-3 lg:grid-cols-3">
        <DataPanel title={t("jobImports.review.sourcePayload")} value={item.source_payload} raw />
        <DataPanel
          title={t("jobImports.review.normalized")}
          value={item.normalized_candidate}
          tone="violet"
        />
        <DataPanel title={t("jobImports.review.currentJob")} value={item.current_job} tone="blue" />
      </div>
      <section>
        <h3 className="mb-3 font-black text-slate-900">{t("jobImports.review.fieldDiff")}</h3>
        <FieldDiff diff={item.field_diff} t={t} />
      </section>
      <section>
        <h3 className="font-black text-slate-900">{t("jobImports.review.validationIssues")}</h3>
        <div className="mt-2 grid gap-2">
          {(item.validation_issues || []).map((issue, index) => (
            <div
              key={`${issue.code}-${index}`}
              className={`rounded-lg px-3 py-2 text-xs ${issue.severity === "error" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}
            >
              <p className="font-black">
                <code dir="ltr">
                  {issue.code}
                  {issue.field ? ` · ${issue.field}` : ""}
                </code>
              </p>
              <p className="mt-1 leading-5">{localizedImportIssue(issue, t)}</p>
            </div>
          ))}
          {!item.validation_issues?.length && (
            <span className="text-sm text-slate-500">{t("jobImports.review.noIssues")}</span>
          )}
        </div>
      </section>
      {item.probable_duplicates?.length ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="font-black text-amber-950">{t("jobImports.review.duplicates.title")}</h3>
          <p className="mt-1 text-sm text-amber-800">
            {t("jobImports.review.duplicates.description")}
          </p>
          <div className="mt-3 grid gap-2">
            {item.probable_duplicates.map((duplicate) => (
              <div
                key={duplicate.source_job_record_id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white p-3"
              >
                <div>
                  <p className="font-bold text-slate-900">{duplicate.title}</p>
                  <p className="text-xs text-slate-500">
                    {duplicate.company || "—"} · {duplicate.location || "—"} · #
                    {duplicate.job_id || "—"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onLink(duplicate)}
                  disabled={busy || !duplicate.job_id}
                  className="inline-flex items-center gap-2 rounded-lg border border-amber-300 px-3 py-2 text-xs font-bold text-amber-900 disabled:opacity-50"
                >
                  <Link2 className="h-3.5 w-3.5" />
                  {t("jobImports.review.duplicates.link")}
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}
      <CorrectionForm item={item} busy={busy} onSave={onCorrect} t={t} />
    </div>
  )
}

export default function JobImportRunReviewPage() {
  const { runId } = useParams()

  const numericRunId = runId ? Number(runId) : null

  const { t, i18n } = useTranslation()

  const { canResource } = usePermissionMatrix()

  const [searchParams, setSearchParams] = useSearchParams()

  const [search, setSearch] = useState(searchParams.get("q") || "")

  const [busy, setBusy] = useState("")

  const [reasons, setReasons] = useState({})

  const [actions, setActions] = useState({})

  const [bulkAction, setBulkAction] = useState("skip")

  const [bulkReason, setBulkReason] = useState("")

  const [closeConfirmation, setCloseConfirmation] = useState(null)

  const bulkApplyRef = useRef(null)

  const param = (key) => searchParams.get(key) || ""

  const page = Math.max(1, Number(param("page")) || 1)

  const selected = useMemo(
    () =>
      new Set(
        (searchParams.get("selected") || "").split(",").map(Number).filter(Number.isSafeInteger),
      ),
    [searchParams],
  )

  const expandedId = Number(param("open")) || null

  const setParam = (key, value, resetPage = false) => {
    const next = new URLSearchParams(searchParams)

    if (value == null || value === "") {
      next.delete(key)
    } else {
      next.set(key, String(value))
    }

    if (resetPage) {
      next.delete("page")
    }

    setSearchParams(next, { replace: true })
  }

  useEffect(() => {
    const timer = window.setTimeout(() => setParam("q", search.trim(), true), 350)

    return () => window.clearTimeout(timer)
    // searchParams is intentionally read at commit time so other URL filters survive.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const confidence = param("confidence")

  const query = {
    page,
    limit: PAGE_SIZE,
    run_id: numericRunId || undefined,
    source_id: Number(param("source")) || undefined,
    employer_company_id: Number(param("client")) || undefined,
    action: param("action") || undefined,
    issue_code: param("issue") || undefined,
    q: param("q") || undefined,
    ...(confidence === "low" ? { max_confidence: 0.59 } : {}),
    ...(confidence === "medium" ? { min_confidence: 0.6, max_confidence: 0.79 } : {}),
    ...(confidence === "high" ? { min_confidence: 0.8 } : {}),
  }

  const run = useQuery({
    queryKey: ["job-import-run", numericRunId],
    queryFn: () => importSourceService.getRun(numericRunId),
    enabled: Boolean(numericRunId),
    refetchInterval: (queryState) =>
      ["pending", "running"].includes(queryState.state.data?.status) ? 10_000 : false,
  })

  const items = useQuery({
    queryKey: ["job-import-review-items", query],
    queryFn: () => importSourceService.listReviewItems(query),
  })

  const sources = useQuery({
    queryKey: ["job-import-sources", "review-filter"],
    queryFn: () => importSourceService.listPage({ page: 1, limit: 200 }),
    enabled: !numericRunId,
  })

  const clients = useQuery({
    queryKey: ["agency-clients", "review-filter"],
    queryFn: () => agencyClientService.listPage({ page: 1, limit: 300 }),
    enabled: !numericRunId,
  })

  const refresh = () => Promise.all([items.refetch(), ...(numericRunId ? [run.refetch()] : [])])

  const rows = items.data?.data || []

  const pagination = items.data?.pagination

  const mutate = async (key, operation, successKey, processedIds = []) => {
    setBusy(key)

    try {
      await operation()
      toast.success(t(`jobImports.review.notifications.${successKey}`))

      if (processedIds.length) {
        const remaining = [...selected].filter((id) => !processedIds.includes(id))

        setParam("selected", remaining.join(","))
      }

      await refresh()
    } catch (error) {
      toast.error(localizedImportError(error, t, t("jobImports.review.notifications.failed")))
    } finally {
      setBusy("")
    }
  }

  const resolveItem = (item, resolution) => {
    const reason = String(reasons[item.id] || "").trim()

    if (["reject", "ignore"].includes(resolution) && !reason) {
      toast.error(t("jobImports.review.reasonRequired"))

      return
    }

    const action =
      actions[item.id] ||
      (REVIEW_ACTIONS.includes(item.proposed_action) ? item.proposed_action : "create")

    const operation =
      resolution === "approve"
        ? () => importSourceService.approveItem(item.id, action, reason || undefined)
        : resolution === "reject"
          ? () => importSourceService.rejectItem(item.id, reason)
          : () => importSourceService.ignoreItem(item.id, reason)

    mutate(
      `${resolution}-${item.id}`,
      operation,
      resolution === "approve" ? "approved" : resolution === "reject" ? "rejected" : "ignored",
      [item.id],
    )
  }

  const bulkResolve = async (confirmClose = false) => {
    const chosen = rows.filter((item) => selected.has(item.id))

    if (!chosen.length) {
      return
    }

    if (bulkAction === "close" && !confirmClose) {
      setCloseConfirmation(chosen)

      return
    }

    const grouped = chosen.reduce((result, item) => {
      const group = result.get(item.job_import_run_id) || []

      group.push(item)
      result.set(item.job_import_run_id, group)

      return result
    }, new Map())

    await mutate(
      "bulk",
      () =>
        Promise.all(
          [...grouped].map(([id, group]) =>
            importSourceService.batchResolve(id, {
              item_ids: group.map((item) => item.id),
              resolution: bulkAction === "reject" ? "reject" : "approve",
              reason:
                bulkReason ||
                (bulkAction === "reject" ? undefined : t("jobImports.review.bulk.defaultReason")),
              ...(bulkAction === "reject" ? {} : { resolved_action: bulkAction }),
              ...(bulkAction === "close" ? { confirm_bulk_close: true } : {}),
            }),
          ),
        ),
      "batchResolved",
      chosen.map((item) => item.id),
    )
    setCloseConfirmation(null)
  }

  if (items.isError || run.isError) {
    return (
      <PageShell>
        <ErrorPanel onRetry={refresh} />
      </PageShell>
    )
  }

  const canReview = canResource("job_imports", "review")

  const counters =
    numericRunId && run.data ? ["create", "update", "close", "reopen", "review", "error"] : []

  return (
    <PageShell>
      <Link
        to={
          numericRunId && run.data
            ? `/agency/import/jobs/${run.data.import_source_id}`
            : "/agency/import/jobs"
        }
        className="inline-flex items-center gap-2 text-sm font-bold text-violet-700"
      >
        <BackIcon />
        {numericRunId ? t("jobImports.run.backToSource") : t("jobImports.review.backToSources")}
      </Link>
      <PageHeading
        eyebrow={t("jobImports.review.eyebrow")}
        title={
          numericRunId
            ? t("jobImports.run.title", { id: numericRunId })
            : t("jobImports.review.title")
        }
        description={t("jobImports.review.description")}
        actions={
          <button
            type="button"
            onClick={refresh}
            aria-label={t("jobImports.review.refresh")}
            className="rounded-xl border border-slate-200 p-2.5"
          >
            <RefreshCw className={`h-4 w-4 ${items.isFetching ? "animate-spin" : ""}`} />
          </button>
        }
      />
      {numericRunId && run.data && (
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="flex items-center gap-2 text-sm text-slate-700"
        >
          <span>{t("jobImports.review.runStatus")}</span>
          <StatusPill value={run.data.status} />
        </div>
      )}
      {counters.length ? (
        <div className="grid grid-cols-3 gap-3 lg:grid-cols-6">
          {counters.map((key) => (
            <Panel key={key}>
              <p className="text-xs font-bold uppercase text-slate-500">
                {t(`jobImports.run.actions.${key}`)}
              </p>
              <p className="mt-2 text-xl font-black text-slate-900">
                {formatImportNumber(run.data?.[`${key}_count`] || 0, i18n.language)}
              </p>
            </Panel>
          ))}
        </div>
      ) : null}

      <Panel className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <label className="relative xl:col-span-2">
            <span className="mb-1 block text-xs font-bold text-slate-700">
              {t("jobImports.review.filters.search")}
            </span>
            <Search
              className="absolute bottom-3 start-3 h-4 w-4 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("jobImports.review.filters.searchPlaceholder")}
              className="w-full rounded-xl border border-slate-200 py-2.5 pe-3 ps-9 text-sm"
            />
          </label>
          {!numericRunId && (
            <label className="block text-xs font-bold text-slate-700">
              {t("jobImports.review.filters.source")}
              <select
                value={param("source")}
                onChange={(event) => setParam("source", event.target.value, true)}
                className="mt-1 w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              >
                <option value="">{t("jobImports.review.filters.allSources")}</option>
                {(sources.data?.data || []).map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {!numericRunId && (
            <label className="block text-xs font-bold text-slate-700">
              {t("jobImports.review.filters.client")}
              <select
                value={param("client")}
                onChange={(event) => setParam("client", event.target.value, true)}
                className="mt-1 w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              >
                <option value="">{t("jobImports.review.filters.allClients")}</option>
                {(clients.data?.data || []).map((client) => (
                  <option key={client.id} value={client.company_id}>
                    {client.company?.name || `#${client.company_id}`}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="block text-xs font-bold text-slate-700">
            {t("jobImports.review.filters.action")}
            <select
              value={param("action")}
              onChange={(event) => setParam("action", event.target.value, true)}
              className="mt-1 w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            >
              <option value="">{t("jobImports.review.filters.allActions")}</option>
              {[...REVIEW_ACTIONS, "review", "error"].map((value) => (
                <option key={value} value={value}>
                  {t(`jobImports.statuses.${value}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-bold text-slate-700">
            {t("jobImports.review.filters.issue")}
            <select
              value={param("issue")}
              onChange={(event) => setParam("issue", event.target.value, true)}
              className="mt-1 w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            >
              <option value="">{t("jobImports.review.filters.allIssues")}</option>
              {ISSUE_CODES.map((value) => (
                <option key={value} value={value}>
                  {t(`jobImports.issues.${value}`, {
                    defaultValue: t("jobImports.issues.generic"),
                  })}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-bold text-slate-700">
            {t("jobImports.review.filters.confidence")}
            <select
              value={confidence}
              onChange={(event) => setParam("confidence", event.target.value, true)}
              className="mt-1 w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            >
              <option value="">{t("jobImports.review.filters.allConfidence")}</option>
              {["low", "medium", "high"].map((value) => (
                <option key={value} value={value}>
                  {t(`jobImports.review.filters.confidenceLevels.${value}`)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Panel>

      {selected.size > 0 && canReview && (
        <div className="sticky top-3 z-20 flex flex-wrap items-center gap-3 rounded-2xl border border-violet-200 bg-white p-4 shadow-lg">
          <p className="font-black text-violet-950">
            {t("jobImports.review.bulk.selected", { count: selected.size })}
          </p>
          <label className="text-xs font-bold text-slate-700">
            {t("jobImports.review.bulk.action")}
            <select
              value={bulkAction}
              onChange={(event) => setBulkAction(event.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="skip">{t("jobImports.review.actions.ignore")}</option>
              {["create", "update", "close", "reopen"].map((value) => (
                <option key={value} value={value}>
                  {t(`jobImports.statuses.${value}`)}
                </option>
              ))}
              <option value="reject">{t("jobImports.review.actions.reject")}</option>
            </select>
          </label>
          <label className="min-w-0 flex-1 text-xs font-bold text-slate-700">
            {t("jobImports.review.bulk.reason")}
            <input
              value={bulkReason}
              onChange={(event) => setBulkReason(event.target.value)}
              placeholder={t("jobImports.review.bulk.reason")}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <button
            type="button"
            ref={bulkApplyRef}
            onClick={() => bulkResolve()}
            disabled={busy === "bulk" || (bulkAction === "reject" && !bulkReason.trim())}
            className="inline-flex items-center gap-2 rounded-lg bg-violet-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            {busy === "bulk" && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("jobImports.review.bulk.apply")}
          </button>
          <button
            type="button"
            onClick={() => setParam("selected", "")}
            className="p-2 text-slate-500"
            aria-label={t("jobImports.review.bulk.clear")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <Panel className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div>
            <h2 className="font-black text-slate-900">{t("jobImports.review.queue")}</h2>
            <p className="mt-1 text-sm text-slate-500">{t("jobImports.review.queueDescription")}</p>
          </div>
          {rows.length > 0 && canReview && (
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={rows.every((item) => selected.has(item.id))}
                onChange={(event) => {
                  const next = new Set(selected)

                  rows.forEach((item) =>
                    event.target.checked ? next.add(item.id) : next.delete(item.id),
                  )
                  setParam("selected", [...next].join(","))
                }}
                className="h-4 w-4"
              />
              {t("jobImports.review.selectPage")}
            </label>
          )}
        </div>
        {items.isLoading ? (
          <div className="p-10 text-center text-sm text-slate-500">{t("common.loading")}</div>
        ) : !rows.length ? (
          <div className="p-10 text-center">
            <Check className="mx-auto h-9 w-9 text-emerald-500" />
            <p className="mt-3 font-black text-slate-900">{t("jobImports.review.empty")}</p>
            <p className="mt-1 text-sm text-slate-500">{t("jobImports.review.emptyHint")}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {rows.map((item) => {
              const open = expandedId === item.id

              const reason = reasons[item.id] || ""

              const action =
                actions[item.id] ||
                (REVIEW_ACTIONS.includes(item.proposed_action) ? item.proposed_action : "create")

              return (
                <article key={item.id}>
                  <div className="grid gap-3 p-4 lg:grid-cols-[auto_minmax(220px,1.5fr)_130px_120px_minmax(310px,auto)] lg:items-center">
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      onChange={() => {
                        const next = new Set(selected)

                        if (next.has(item.id)) {
                          next.delete(item.id)
                        } else {
                          next.add(item.id)
                        }

                        setParam("selected", [...next].join(","))
                      }}
                      aria-label={t("jobImports.review.selectItem", {
                        title: item.normalized_candidate.title,
                      })}
                      className="h-4 w-4"
                    />
                    <button
                      type="button"
                      onClick={() => setParam("open", open ? "" : item.id)}
                      aria-expanded={open}
                      aria-controls={`job-import-review-${item.id}`}
                      className="min-w-0 text-start"
                    >
                      <span className="flex items-center gap-2">
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 transition ${open ? "rotate-180" : ""}`}
                        />
                        <strong dir="auto" className="break-words text-slate-900">
                          {String(item.normalized_candidate.title || t("jobImports.run.untitled"))}
                        </strong>
                        {item.stale && (
                          <>
                            <AlertTriangle aria-hidden="true" className="h-4 w-4 text-red-600" />
                            <span className="sr-only">{t("jobImports.review.stale")}</span>
                          </>
                        )}
                      </span>
                      <span dir="auto" className="mt-1 block break-words text-xs text-slate-500">
                        {item.source?.name || "—"} · #{item.id} ·{" "}
                        {item.current_job
                          ? `${t("jobImports.review.job")} #${item.current_job.id}`
                          : t("jobImports.review.newJob")}
                      </span>
                    </button>
                    <div>
                      <StatusPill value={item.proposed_action} />
                      <p className="mt-1 text-xs text-slate-500">
                        {t("jobImports.run.confidence", {
                          value: formatImportPercent(item.confidence, i18n.language),
                        })}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(item.validation_issues || []).slice(0, 2).map((issue) => (
                        <span
                          key={issue.code}
                          className="rounded bg-amber-50 px-1.5 py-1 text-[10px] font-bold text-amber-800"
                        >
                          {t(`jobImports.issues.${issue.code}`, {
                            defaultValue: t("jobImports.issues.generic"),
                          })}
                        </span>
                      ))}
                    </div>
                    {canReview && (
                      <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(110px,1fr)_minmax(120px,1fr)_auto_auto_auto]">
                        <label className="text-xs font-bold text-slate-700">
                          {t("jobImports.review.actionForItem")}
                          <select
                            value={action}
                            onChange={(event) =>
                              setActions((current) => ({
                                ...current,
                                [item.id]: event.target.value,
                              }))
                            }
                            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 text-xs"
                          >
                            {REVIEW_ACTIONS.map((value) => (
                              <option key={value} value={value}>
                                {t(`jobImports.statuses.${value}`)}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="text-xs font-bold text-slate-700">
                          {t("jobImports.review.reason")}
                          <input
                            value={reason}
                            onChange={(event) =>
                              setReasons((current) => ({
                                ...current,
                                [item.id]: event.target.value,
                              }))
                            }
                            placeholder={t("jobImports.review.reason")}
                            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 text-xs"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => resolveItem(item, "approve")}
                          disabled={Boolean(busy) || item.stale}
                          title={t("jobImports.review.actions.approve")}
                          aria-label={t("jobImports.review.actions.approve")}
                          className="rounded-lg bg-emerald-600 p-2 text-white disabled:opacity-40"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => resolveItem(item, "reject")}
                          disabled={Boolean(busy)}
                          title={t("jobImports.review.actions.reject")}
                          aria-label={t("jobImports.review.actions.reject")}
                          className="rounded-lg bg-red-50 p-2 text-red-700 disabled:opacity-40"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        {item.status === "failed" ? (
                          <button
                            type="button"
                            onClick={() =>
                              mutate(
                                `retry-${item.id}`,
                                () => importSourceService.retryItem(item.id),
                                "retried",
                                [item.id],
                              )
                            }
                            disabled={Boolean(busy)}
                            title={t("jobImports.review.actions.retry")}
                            aria-label={t("jobImports.review.actions.retry")}
                            className="rounded-lg bg-blue-50 p-2 text-blue-700"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => resolveItem(item, "ignore")}
                            disabled={Boolean(busy)}
                            title={t("jobImports.review.actions.ignore")}
                            aria-label={t("jobImports.review.actions.ignore")}
                            className="rounded-lg bg-slate-100 p-2 text-slate-700"
                          >
                            <SkipForward className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {open && (
                    <div id={`job-import-review-${item.id}`}>
                      <ReviewItemDetails
                        item={item}
                        busy={Boolean(busy)}
                        t={t}
                        onCorrect={(payload) =>
                          mutate(
                            `correct-${item.id}`,
                            () => importSourceService.correctItem(item.id, payload),
                            "corrected",
                          )
                        }
                        onLink={(duplicate) => {
                          const reasonValue = String(
                            reasons[item.id] || t("jobImports.review.duplicates.defaultReason"),
                          )

                          mutate(
                            `link-${item.id}`,
                            () =>
                              importSourceService.linkDuplicate(
                                item.id,
                                duplicate.source_job_record_id,
                                reasonValue,
                              ),
                            "linked",
                            [item.id],
                          )
                        }}
                      />
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </Panel>

      {pagination?.totalPages > 1 && (
        <nav
          aria-label={t("jobImports.review.pagination")}
          className="flex items-center justify-between"
        >
          <p className="text-sm text-slate-500">
            {t("jobImports.review.page", {
              page: pagination.page,
              pages: pagination.totalPages,
              total: pagination.total,
            })}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setParam("page", Math.max(1, page - 1))}
              disabled={!pagination.hasPrevPage}
              className="rounded-lg border p-2 disabled:opacity-40"
              aria-label={t("common.prev")}
            >
              {i18n.dir() === "rtl" ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setParam("page", page + 1)}
              disabled={!pagination.hasNextPage}
              className="rounded-lg border p-2 disabled:opacity-40"
              aria-label={t("common.next")}
            >
              {i18n.dir() === "rtl" ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          </div>
        </nav>
      )}

      <AlertDialog
        open={Boolean(closeConfirmation)}
        onOpenChange={(open) => !open && setCloseConfirmation(null)}
      >
        <AlertDialogContent
          onCloseAutoFocus={(event) => {
            if (bulkApplyRef.current?.isConnected) {
              event.preventDefault()
              bulkApplyRef.current.focus()
            }
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("jobImports.review.bulk.closeTitle", { count: closeConfirmation?.length || 0 })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("jobImports.review.bulk.closeDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-56 overflow-auto rounded-lg bg-slate-50 p-3">
            <ul className="space-y-2 text-sm">
              {(closeConfirmation || []).map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3">
                  <span>{item.current_job?.title || item.normalized_candidate.title}</span>
                  {item.current_job?.id && (
                    <Link
                      to={`/agency/jobs?jobId=${item.current_job.id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-violet-700"
                    >
                      #{item.current_job.id}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bulkResolve(true)}
              className="bg-red-600 hover:bg-red-700"
            >
              {t("jobImports.review.bulk.confirmClose")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  )
}
