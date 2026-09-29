import { Navigate, Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { usePermissionMatrix } from "@/hooks/usePermissionMatrix"
import { BackIcon, PageHeading, PageShell, Panel } from "./JobImportUi"

export default function JobImportNewPage() {
  const { t } = useTranslation()

  const { canResource, loading } = usePermissionMatrix()

  if (loading) {
    return (
      <PageShell>
        <Panel className="text-center text-sm text-slate-500">{t("common.loading")}</Panel>
      </PageShell>
    )
  }

  if (!loading && !canResource("job_imports", "create")) {
    return <Navigate to="/unauthorized" replace />
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
        eyebrow={t("jobImports.new.eyebrow")}
        title={t("jobImports.new.title")}
        description={t("jobImports.new.description")}
      />
      <Panel>
        <ol className="grid gap-4 md:grid-cols-3">
          {["source", "mapping", "preview"].map((step, index) => (
            <li key={step} className="rounded-xl bg-slate-50 p-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 text-xs font-black text-violet-700">
                {index + 1}
              </span>
              <h2 className="mt-3 font-black text-slate-900">
                {t(`jobImports.new.steps.${step}.title`)}
              </h2>
              <p className="mt-1 text-sm leading-5 text-slate-600">
                {t(`jobImports.new.steps.${step}.description`)}
              </p>
            </li>
          ))}
        </ol>
        <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {t("jobImports.new.readOnlyNotice")}
        </p>
      </Panel>
    </PageShell>
  )
}
