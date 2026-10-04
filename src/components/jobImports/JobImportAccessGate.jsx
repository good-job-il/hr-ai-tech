import { Link, Outlet } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { isJobImportFeatureEnabled, JOB_IMPORT_FEATURE_FLAGS } from "@/config/jobImportFeatureFlags"
import { usePermissionMatrix } from "@/hooks/usePermissionMatrix"
import { useAuth } from "@/lib/AuthContext"
import { jobImportAccessState } from "@/domain/jobImports/permissions"

export function JobImportAccessGate() {
  const { user, organization } = useAuth()

  const { t, i18n } = useTranslation()

  const { canResource, loading } = usePermissionMatrix()

  const reason = jobImportAccessState({
    user,
    loading,
    enabled: isJobImportFeatureEnabled(organization, JOB_IMPORT_FEATURE_FLAGS.ENABLED),
    canView: canResource("job_imports", "view"),
  })

  if (reason === "loading") {
    return (
      <div className="flex min-h-[320px] items-center justify-center" aria-live="polite">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-100 border-t-violet-600" />
      </div>
    )
  }

  if (reason !== "allowed") {
    return (
      <section
        aria-labelledby="job-import-access-title"
        dir={i18n.dir()}
        className="mx-auto w-full max-w-2xl space-y-4 p-6"
      >
        <h1 id="job-import-access-title" className="text-2xl font-bold text-slate-900">
          {t(`jobImports.access.${reason}Title`)}
        </h1>
        <p role="status" className="text-sm leading-6 text-slate-700">
          {t(`jobImports.access.${reason}Description`)}
        </p>
        <Link
          to={reason === "organizationRequired" ? "/platform/organizations" : "/agency/dashboard"}
          className="inline-flex rounded-lg bg-violet-700 px-4 py-2 text-sm font-bold text-white focus-visible:ring-2 focus-visible:ring-violet-500"
        >
          {t(
            reason === "organizationRequired"
              ? "jobImports.access.openOrganizations"
              : "jobImports.access.back",
          )}
        </Link>
      </section>
    )
  }

  return <Outlet />
}
