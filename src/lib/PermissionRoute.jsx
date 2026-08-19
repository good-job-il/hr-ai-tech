import { Navigate, Outlet } from "react-router-dom"
import { usePermissionMatrix } from "@/hooks/usePermissionMatrix"

export default function PermissionRoute({
  required = [],
  unauthorizedElement = <Navigate to="/unauthorized" replace />,
}) {
  const { can, loading } = usePermissionMatrix()

  if (loading) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center bg-[#F7FBFF]"
        role="status"
        aria-live="polite"
      >
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-[#E4ECFF] border-t-[#7C3AED]"
          aria-hidden="true"
        />
        <span className="sr-only">Loading permissions</span>
      </div>
    )
  }

  if (!required.every(can)) return unauthorizedElement
  return <Outlet />
}
