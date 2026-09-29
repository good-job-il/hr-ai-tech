import { useQuery } from "@tanstack/react-query"
import { Link, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { importSourceService } from "@/api/services/importSourceService"
import { BackIcon, ErrorPanel, PageHeading, PageShell, Panel, StatusPill } from "./JobImportUi"

export default function JobImportRunReviewPage() {
  const { runId } = useParams()

  const { t } = useTranslation()

  const run = useQuery({
    queryKey: ["job-import-run", runId],
    queryFn: () => importSourceService.getRun(Number(runId)),
    enabled: Boolean(runId),
  })

  const items = useQuery({
    queryKey: ["job-import-run-items", runId],
    queryFn: () => importSourceService.listRunItems(Number(runId), { page: 1, limit: 50 }),
    enabled: Boolean(runId),
  })

  if (run.isError || items.isError) {
    return (
      <PageShell>
        <ErrorPanel
          onRetry={() => {
            run.refetch()
            items.refetch()
          }}
        />
      </PageShell>
    )
  }

  if (!run.data) {
    return (
      <PageShell>
        <Panel className="text-center text-sm text-slate-500">{t("common.loading")}</Panel>
      </PageShell>
    )
  }

  const counters = ["create", "update", "close", "reopen", "review", "error"]

  return (
    <PageShell>
      <Link
        to={`/agency/import/jobs/${run.data.import_source_id}`}
        className="inline-flex items-center gap-2 text-sm font-bold text-violet-700"
      >
        <BackIcon />
        {t("jobImports.run.backToSource")}
      </Link>
      <PageHeading
        eyebrow={t("jobImports.run.eyebrow")}
        title={t("jobImports.run.title", { id: run.data.id })}
        description={t("jobImports.run.description")}
        actions={<StatusPill value={run.data.status} />}
      />
      <div className="grid grid-cols-3 gap-3 lg:grid-cols-6">
        {counters.map((key) => (
          <Panel key={key}>
            <p className="text-xs font-bold uppercase text-slate-500">
              {t(`jobImports.run.actions.${key}`)}
            </p>
            <p className="mt-2 text-xl font-black text-slate-900">
              {run.data[`${key}_count`] || 0}
            </p>
          </Panel>
        ))}
      </div>
      <Panel className="overflow-hidden p-0">
        <div className="border-b border-slate-100 p-5">
          <h2 className="font-black text-slate-900">{t("jobImports.run.items")}</h2>
          <p className="mt-1 text-sm text-slate-500">{t("jobImports.run.itemsDescription")}</p>
        </div>
        {items.isLoading ? (
          <div className="p-8 text-center text-sm text-slate-500">{t("common.loading")}</div>
        ) : !items.data?.data.length ? (
          <div className="p-8 text-center text-sm text-slate-500">
            {t("jobImports.run.noItems")}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.data.data.map((item) => (
              <div
                key={item.id}
                className="grid gap-3 p-4 sm:grid-cols-[minmax(0,2fr)_1fr_1fr_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-900">
                    {String(item.normalized_candidate.title || t("jobImports.run.untitled"))}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">#{item.id}</p>
                </div>
                <StatusPill value={item.proposed_action} />
                <p className="text-sm text-slate-600">
                  {t("jobImports.run.confidence", { value: Math.round(item.confidence * 100) })}
                </p>
                <StatusPill value={item.status} />
              </div>
            ))}
          </div>
        )}
      </Panel>
    </PageShell>
  )
}
