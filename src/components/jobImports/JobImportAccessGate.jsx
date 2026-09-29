import { Navigate, Outlet } from "react-router-dom"
import { isJobImportFeatureEnabled, JOB_IMPORT_FEATURE_FLAGS } from "@/config/jobImportFeatureFlags"
import { usePermissionMatrix } from "@/hooks/usePermissionMatrix"
import { useAuth } from "@/lib/AuthContext"

export function JobImportAccessGate() {
  const { organization } = useAuth()

  const { canResource, loading } = usePermissionMatrix()

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center" aria-live="polite">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-100 border-t-violet-600" />
      </div>
    )
  }

  const enabled = isJobImportFeatureEnabled(organization, JOB_IMPORT_FEATURE_FLAGS.ENABLED)

  if (!enabled || !canResource("job_imports", "view")) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}
