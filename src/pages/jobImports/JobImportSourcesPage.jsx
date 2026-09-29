import { useQuery } from "@tanstack/react-query"
import { Plus, ServerCrash } from "lucide-react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { importSourceService } from "@/api/services/importSourceService"
import { usePermissionMatrix } from "@/hooks/usePermissionMatrix"
import {
  ErrorPanel,
  formatImportDate,
  PageHeading,
  PageShell,
  Panel,
  StatusPill,
} from "./JobImportUi"

export default function JobImportSourcesPage() {
  const { t, i18n } = useTranslation()

  const { canResource } = usePermissionMatrix()

  const sources = useQuery({
    queryKey: ["job-import-sources"],
    queryFn: () => importSourceService.listPage({ page: 1, limit: 50 }),
  })

  const health = useQuery({
    queryKey: ["job-import-health"],
    queryFn: () => importSourceService.getHealth(),
  })

  if (sources.isError) {
    return (
      <PageShell>
        <ErrorPanel onRetry={() => sources.refetch()} />
      </PageShell>
    )
  }

  const rows = sources.data?.data || []

  const metrics = health.data?.sources || {}

  return (
    <PageShell>
      <PageHeading
        eyebrow={t("jobImports.sources.eyebrow")}
        title={t("jobImports.sources.title")}
        description={t("jobImports.sources.description")}
        actions={
          canResource("job_imports", "create") && (
            <Link
              to="/agency/import/jobs/new"
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-violet-700"
            >
              <Plus className="h-4 w-4" />
              {t("jobImports.sources.add")}
            </Link>
          )
        }
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {["total", "active", "needs_attention", "error"].map((key) => (
          <Panel key={key}>
            <p className="text-xs font-bold uppercase text-slate-500">
              {t(`jobImports.sources.metrics.${key}`)}
            </p>
            <p className="mt-2 text-2xl font-black text-slate-900">
              {health.isLoading ? "—" : metrics[key] || 0}
            </p>
          </Panel>
        ))}
      </div>
      <Panel className="overflow-hidden p-0">
        {sources.isLoading ? (
          <div className="p-10 text-center text-sm text-slate-500">{t("common.loading")}</div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center p-12 text-center">
            <ServerCrash className="h-9 w-9 text-slate-300" />
            <h2 className="mt-4 font-black text-slate-900">{t("jobImports.sources.emptyTitle")}</h2>
            <p className="mt-2 max-w-md text-sm text-slate-600">
              {t("jobImports.sources.emptyDescription")}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {rows.map((source) => (
              <Link
                key={source.id}
                to={`/agency/import/jobs/${source.id}`}
                className="grid gap-3 p-4 transition hover:bg-slate-50 sm:grid-cols-[minmax(0,2fr)_1fr_1fr_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-900">{source.name}</p>
                  <p className="mt-1 truncate text-xs text-slate-500">{source.url}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">{t("jobImports.sources.connector")}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {source.connector_type}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">{t("jobImports.sources.lastSuccess")}</p>
                  <p className="mt-1 text-sm text-slate-700">
                    {formatImportDate(source.last_success_at, i18n.language)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <StatusPill value={source.state} />
                  <StatusPill value={source.health_state} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </PageShell>
  )
}
