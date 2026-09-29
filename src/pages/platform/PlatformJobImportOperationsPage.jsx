import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { platformJobImportService } from "@/api/services/importSourceService"
import {
  ErrorPanel,
  formatImportDate,
  PageHeading,
  PageShell,
  Panel,
  StatusPill,
} from "@/pages/jobImports/JobImportUi"

export default function PlatformJobImportOperationsPage() {
  const { t, i18n } = useTranslation()

  const health = useQuery({
    queryKey: ["platform-job-import-health"],
    queryFn: () => platformJobImportService.listHealth({ page: 1, limit: 100 }),
  })

  if (health.isError) {
    return (
      <PageShell>
        <ErrorPanel onRetry={() => health.refetch()} />
      </PageShell>
    )
  }

  const rows = health.data?.data || []

  const failing = rows.filter((row) => ["degraded", "error"].includes(row.health_state)).length

  return (
    <PageShell>
      <PageHeading
        eyebrow={t("jobImports.platform.eyebrow")}
        title={t("jobImports.platform.title")}
        description={t("jobImports.platform.description")}
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <Panel>
          <p className="text-xs font-bold uppercase text-slate-500">
            {t("jobImports.platform.visibleSources")}
          </p>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {health.data?.pagination.total || 0}
          </p>
        </Panel>
        <Panel>
          <p className="text-xs font-bold uppercase text-slate-500">
            {t("jobImports.platform.attention")}
          </p>
          <p className="mt-2 text-2xl font-black text-orange-700">{failing}</p>
        </Panel>
        <Panel>
          <p className="text-xs font-bold uppercase text-slate-500">
            {t("jobImports.platform.payloadPolicy")}
          </p>
          <p className="mt-2 text-sm font-bold text-emerald-700">
            {t("jobImports.platform.metadataOnly")}
          </p>
        </Panel>
      </div>
      <Panel className="overflow-hidden p-0">
        {health.isLoading ? (
          <div className="p-10 text-center text-sm text-slate-500">{t("common.loading")}</div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            {t("jobImports.platform.empty")}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {rows.map((source) => (
              <div
                key={source.id}
                className="grid gap-3 p-4 sm:grid-cols-[1fr_1fr_1fr_1fr_auto] sm:items-center"
              >
                <div>
                  <p className="text-xs text-slate-500">{t("jobImports.platform.source")}</p>
                  <p className="font-bold text-slate-900">#{source.id}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">{t("jobImports.platform.organization")}</p>
                  <p className="font-semibold text-slate-700">#{source.organization_id}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">{t("jobImports.platform.connector")}</p>
                  <p className="font-semibold text-slate-700">{source.connector_type}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">{t("jobImports.platform.lastAttempt")}</p>
                  <p className="text-sm text-slate-700">
                    {formatImportDate(source.last_attempt_at, i18n.language)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <StatusPill value={source.state} />
                  <StatusPill value={source.health_state} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </PageShell>
  )
}
