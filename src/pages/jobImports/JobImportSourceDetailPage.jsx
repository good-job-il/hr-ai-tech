import { useQuery } from "@tanstack/react-query"
import { Link, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { importSourceService } from "@/api/services/importSourceService"
import {
  BackIcon,
  ErrorPanel,
  formatImportDate,
  PageHeading,
  PageShell,
  Panel,
  StatusPill,
} from "./JobImportUi"

export default function JobImportSourceDetailPage() {
  const { sourceId } = useParams()

  const { t, i18n } = useTranslation()

  const source = useQuery({
    queryKey: ["job-import-source", sourceId],
    queryFn: () => importSourceService.get(sourceId),
    enabled: Boolean(sourceId),
  })

  const runs = useQuery({
    queryKey: ["job-import-source-runs", sourceId],
    queryFn: () => importSourceService.listRuns(Number(sourceId), { page: 1, limit: 25 }),
    enabled: Boolean(sourceId),
  })

  if (source.isError || runs.isError) {
    return (
      <PageShell>
        <ErrorPanel
          onRetry={() => {
            source.refetch()
            runs.refetch()
          }}
        />
      </PageShell>
    )
  }

  if (!source.data) {
    return (
      <PageShell>
        <Panel className="text-center text-sm text-slate-500">{t("common.loading")}</Panel>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <Link
        to="/agency/import/jobs"
        className="inline-flex items-center gap-2 text-sm font-bold text-violet-700"
      >
        <BackIcon />
        {t("jobImports.common.backToSources")}
      </Link>
      <PageHeading
        eyebrow={t("jobImports.detail.eyebrow")}
        title={source.data.name}
        description={source.data.url}
        actions={
          <div className="flex gap-2">
            <StatusPill value={source.data.state} />
            <StatusPill value={source.data.health_state} />
          </div>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "connector",
            value: `${source.data.connector_type} · v${source.data.connector_version}`,
          },
          { label: "client", value: source.data.employer_company_id },
          {
            label: "lastSuccess",
            value: formatImportDate(source.data.last_success_at, i18n.language),
          },
          { label: "nextRun", value: formatImportDate(source.data.next_run_at, i18n.language) },
        ].map((item) => (
          <Panel key={item.label}>
            <p className="text-xs font-bold uppercase text-slate-500">
              {t(`jobImports.detail.${item.label}`)}
            </p>
            <p className="mt-2 break-words text-sm font-bold text-slate-900">{item.value || "—"}</p>
          </Panel>
        ))}
      </div>
      <Panel className="overflow-hidden p-0">
        <div className="border-b border-slate-100 p-5">
          <h2 className="font-black text-slate-900">{t("jobImports.detail.runs")}</h2>
          <p className="mt-1 text-sm text-slate-500">{t("jobImports.detail.runsDescription")}</p>
        </div>
        {runs.isLoading ? (
          <div className="p-8 text-center text-sm text-slate-500">{t("common.loading")}</div>
        ) : !runs.data?.data.length ? (
          <div className="p-8 text-center text-sm text-slate-500">
            {t("jobImports.detail.noRuns")}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {runs.data.data.map((run) => (
              <Link
                key={run.id}
                to={`/agency/import/jobs/runs/${run.id}`}
                className="grid gap-3 p-4 hover:bg-slate-50 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-center"
              >
                <div>
                  <p className="text-xs text-slate-500">#{run.id}</p>
                  <p className="font-bold text-slate-900">{run.mode}</p>
                </div>
                <div className="text-sm text-slate-700">
                  {t("jobImports.detail.items", { count: run.items_fetched })}
                </div>
                <div className="text-sm text-slate-600">
                  {formatImportDate(run.completed_at || run.started_at, i18n.language)}
                </div>
                <StatusPill value={run.status} />
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </PageShell>
  )
}
