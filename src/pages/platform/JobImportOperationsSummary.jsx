import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { platformJobImportService } from "@/api/services/importSourceService"
import { useAuth } from "@/lib/AuthContext"
import { formatImportDate, formatImportNumber, Panel } from "@/pages/jobImports/JobImportUi"

export default function JobImportOperationsSummary() {
  const { t, i18n } = useTranslation()

  const { user, isImpersonating } = useAuth()

  const nativeAdmin = user?.role === "admin" && !user.impersonating && !isImpersonating

  const contextKey = `${user?.id}:${user?.role}:${Boolean(user?.impersonating || isImpersonating)}`

  const [page, setPage] = useState(1)

  const metrics = useQuery({
    queryKey: ["job-import-operations-metrics", contextKey],
    queryFn: () => platformJobImportService.metrics(),
    refetchInterval: 60_000,
    retry: false,
    enabled: nativeAdmin,
  })

  const alerts = useQuery({
    queryKey: ["job-import-operations-alerts", contextKey, page],
    queryFn: () => platformJobImportService.alerts(page),
    refetchInterval: 60_000,
    retry: false,
    enabled: nativeAdmin,
  })

  const analytics = useQuery({
    queryKey: ["job-import-operations-analytics", contextKey],
    queryFn: () => platformJobImportService.analytics(),
    retry: false,
    enabled: nativeAdmin,
  })

  const n = (value) => (value == null ? "—" : formatImportNumber(Number(value), i18n.language))

  const label = (key) => t(`jobImports.operations.${key}`)

  if (!nativeAdmin || metrics.isError || alerts.isError || analytics.isError) {
    return (
      <Panel>
        <p role="alert">{label("accessError")}</p>
        <button
          type="button"
          className="mt-3 rounded border px-3 py-2"
          onClick={() => {
            metrics.refetch()
            alerts.refetch()
            analytics.refetch()
          }}
        >
          {t("common.retry")}
        </button>
      </Panel>
    )
  }

  if (metrics.isLoading || alerts.isLoading || analytics.isLoading) {
    return (
      <Panel>
        <p role="status">{t("common.loading")}</p>
      </Panel>
    )
  }

  return (
    <>
      <Panel>
        <h2 className="font-bold">{label("title")}</h2>
        <p className="mt-2">
          {label("lastScan")}: {formatImportDate(metrics.data?.monitor.last_scan_at, i18n.language)}
        </p>
        {(!metrics.data?.monitor.enabled || metrics.data?.monitor.stale) && (
          <p role="status" className="mt-2 font-semibold text-orange-800">
            {label("monitorInactive")}
          </p>
        )}
        <p className="mt-2">
          {label("stale")}: {n(metrics.data?.freshness.stale_sources)}
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {metrics.data?.runs.map((row, index) => (
            <div key={index} className="rounded border p-3">
              <p dir="ltr" className="break-all font-semibold">
                {row.connector_type} / {row.connector_version}
              </p>
              <p>{t(`jobImports.detail.runModes.${row.mode}`)}</p>
              <dl className="mt-2 grid grid-cols-2 gap-2">
                {[
                  "runs",
                  "success",
                  "failed",
                  "partial",
                  "retries",
                  "rate_limit_events",
                  "pages",
                  "items",
                  "bytes",
                  "duration_ms_avg",
                  "proposed_closes",
                  "circuit_breakers",
                ].map((field) => (
                  <div key={field}>
                    <dt className="text-sm text-slate-600">{label(field)}</dt>
                    <dd className="font-semibold">{n(row[field])}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
        {metrics.data?.quality.map((row, index) => (
          <details className="mt-3 rounded border p-3" key={index}>
            <summary className="cursor-pointer">
              {label("quality")}{" "}
              <bdi>
                {row.connector_type} / {row.connector_version}
              </bdi>
            </summary>
            <dl className="mt-2 grid grid-cols-2 gap-2">
              {[
                "staged_items",
                "quarantined_items",
                "duplicate_items",
                "manual_override_conflicts",
                "applied_closes",
              ].map((field) => (
                <div key={field}>
                  <dt>{label(field)}</dt>
                  <dd>{n(row[field])}</dd>
                </div>
              ))}
            </dl>
          </details>
        ))}
      </Panel>
      <Panel>
        <h2 className="font-bold">
          {label("alerts")} ({n(alerts.data?.pagination.total)})
        </h2>
        {!alerts.data?.data.length && <p className="mt-2">{label("noAlerts")}</p>}
        <ul className="mt-3 space-y-3">
          {alerts.data?.data.map((alert) => (
            <li key={alert.alert_key} className="rounded border p-3">
              <p className="font-semibold">
                {label(`codes.${alert.code}`)} — {label(alert.severity)}
              </p>
              <p>
                <bdi>
                  {alert.connector_type} / {alert.connector_version}
                </bdi>
              </p>
              <p>
                {t("jobImports.platform.organization")}: {alert.organization_id ?? "—"} ·{" "}
                {t("jobImports.platform.source")}: {alert.source_id ?? "—"}
              </p>
              <p>{formatImportDate(alert.last_seen_at, i18n.language)}</p>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex gap-3">
          <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)}>
            {label("previous")}
          </button>
          <span>{n(page)}</span>
          <button
            type="button"
            disabled={page * 25 >= (alerts.data?.pagination.total || 0)}
            onClick={() => setPage(page + 1)}
          >
            {label("next")}
          </button>
        </div>
      </Panel>
      <Panel>
        <details>
          <summary className="cursor-pointer font-bold">{label("analytics")}</summary>
          <p className="my-2 text-sm">{label("eventPolicy")}</p>
          <dl className="grid gap-2 sm:grid-cols-2">
            {analytics.data?.events.map((event) => (
              <div key={event.event}>
                <dt>{label(`events.${event.event}`)}</dt>
                <dd>{n(event.count)}</dd>
              </div>
            ))}
          </dl>
        </details>
      </Panel>
    </>
  )
}
