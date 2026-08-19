import { useLocation } from "react-router-dom"
import { useAuth } from "@/lib/AuthContext"
import {
  agencyWorkspaceBase,
  agencyWorkspacePaths,
  isTeamWorkspace,
} from "@/domain/agency/workspace"

export function useAgencyWorkspace() {
  const location = useLocation()

  const { user } = useAuth()

  const base = agencyWorkspaceBase(location.pathname, user?.role)

  return {
    base,
    paths: agencyWorkspacePaths(base || "/agency"),
    isTeam: isTeamWorkspace(location.pathname, user?.role),
  }
}
