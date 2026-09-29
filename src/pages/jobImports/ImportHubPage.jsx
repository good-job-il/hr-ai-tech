import { BriefcaseBusiness, UsersRound } from "lucide-react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { PageHeading, PageShell, Panel } from "./JobImportUi"
import { useAuth } from "@/lib/AuthContext"
import { usePermissionMatrix } from "@/hooks/usePermissionMatrix"
import { isJobImportFeatureEnabled, JOB_IMPORT_FEATURE_FLAGS } from "@/config/jobImportFeatureFlags"

export default function ImportHubPage() {
  const { t } = useTranslation()

  const { organization } = useAuth()

  const { canResource, loading } = usePermissionMatrix()

  const canViewJobs =
    !loading &&
    isJobImportFeatureEnabled(organization, JOB_IMPORT_FEATURE_FLAGS.ENABLED) &&
    canResource("job_imports", "view")

  const cards = [
    { key: "candidates", icon: UsersRound, to: "/agency/import/candidates" },
    ...(canViewJobs ? [{ key: "jobs", icon: BriefcaseBusiness, to: "/agency/import/jobs" }] : []),
  ]

  return (
    <PageShell>
      <PageHeading
        title={t("jobImports.hub.title")}
        description={t("jobImports.hub.description")}
      />
      <div className="grid gap-4 md:grid-cols-2">
        {cards.map(({ key, icon: Icon, to }) => (
          <Link key={key} to={to} className="group">
            <Panel className="h-full transition group-hover:-translate-y-0.5 group-hover:border-violet-300 group-hover:shadow-md">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-lg font-black text-slate-900">
                {t(`jobImports.hub.${key}.title`)}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {t(`jobImports.hub.${key}.description`)}
              </p>
              <p className="mt-5 text-sm font-bold text-violet-700">
                {t(`jobImports.hub.${key}.action`)}
              </p>
            </Panel>
          </Link>
        ))}
      </div>
    </PageShell>
  )
}
