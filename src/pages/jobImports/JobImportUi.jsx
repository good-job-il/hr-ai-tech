import { AlertTriangle, ArrowLeft, ArrowRight, RefreshCw } from "lucide-react"
import { useTranslation } from "react-i18next"
export {
  formatImportCurrency,
  formatImportDate,
  formatImportNumber,
  formatImportPercent,
  formatImportRelativeTime,
  importErrorCode,
  localizedImportError,
  localizedImportIssue,
} from "@/domain/jobImports/presentation"

export function PageHeading({ eyebrow, title, description, actions }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        {eyebrow && (
          <p className="text-xs font-bold uppercase tracking-wider text-violet-600">{eyebrow}</p>
        )}
        <h1 dir="auto" className="mt-1 break-words text-2xl font-black text-slate-900 sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p dir="auto" className="mt-2 max-w-3xl break-words text-sm leading-6 text-slate-600">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:justify-end">{actions}</div>
      )}
    </div>
  )
}

export function PageShell({ children }) {
  const { i18n } = useTranslation()

  return (
    <main
      dir={i18n.dir()}
      className="job-import-workflow mx-auto w-full min-w-0 max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8"
    >
      {children}
    </main>
  )
}

export function Panel({ children, className = "" }) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {children}
    </section>
  )
}

export function StatusPill({ value = "unknown" }) {
  const { t, i18n } = useTranslation()

  const tone =
    {
      active: "bg-emerald-50 text-emerald-700",
      healthy: "bg-emerald-50 text-emerald-700",
      completed: "bg-emerald-50 text-emerald-700",
      running: "bg-blue-50 text-blue-700",
      draft: "bg-slate-100 text-slate-700",
      pending: "bg-amber-50 text-amber-700",
      paused: "bg-amber-50 text-amber-700",
      partial: "bg-amber-50 text-amber-700",
      needs_attention: "bg-orange-50 text-orange-700",
      degraded: "bg-orange-50 text-orange-700",
      failed: "bg-red-50 text-red-700",
      dead_letter: "bg-red-50 text-red-700",
      error: "bg-red-50 text-red-700",
    }[value] || "bg-slate-100 text-slate-700"

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${tone}`}>
      {i18n.exists(`jobImports.statuses.${value}`)
        ? t(`jobImports.statuses.${value}`)
        : t("jobImports.statuses.unknown")}
    </span>
  )
}

export function ErrorPanel({ onRetry }) {
  const { t } = useTranslation()

  return (
    <Panel className="flex items-start gap-3 border-red-200 bg-red-50">
      <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
      <div className="flex-1">
        <p className="font-bold text-red-900">{t("jobImports.common.loadError")}</p>
        <p className="mt-1 text-sm text-red-700">{t("jobImports.common.loadErrorHint")}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-bold text-red-700 shadow-sm"
        >
          <RefreshCw className="h-4 w-4" /> {t("common.retry")}
        </button>
      )}
    </Panel>
  )
}

export function BackIcon() {
  const { i18n } = useTranslation()

  return i18n.dir() === "rtl" ? (
    <ArrowRight className="h-4 w-4" />
  ) : (
    <ArrowLeft className="h-4 w-4" />
  )
}
