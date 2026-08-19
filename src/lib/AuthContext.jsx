import React, { createContext, useState, useContext, useEffect } from "react"
import { tokenStorage } from "@/api/client/tokenStorage"
import { authService } from "@/api/services/authService"
import { organizationService } from "@/api/services/organizationService"

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false)
  const [authError, setAuthError] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [appPublicSettings, setAppPublicSettings] = useState(null) // unused with NestJS backend, kept for API compat
  const [organization, setOrganization] = useState(null)
  const [orgType, setOrgType] = useState(null) // 'staffing_agency' | 'organization' | null (platform)
  // Raw org_type field stored on the user row itself — reflects the type of
  // organization they *intend* to belong to (chosen at registration), even
  // before an actual Organization row exists. Used only to decide which
  // onboarding flow to send them through; never used for access control.
  const [intendedOrgType, setIntendedOrgType] = useState(null)
  // True while a platform admin is "inside" a specific organization's
  // workspace via a scoped token (see tokenStorage workspace slot below).
  const [isImpersonating, setIsImpersonating] = useState(false)

  useEffect(() => {
    checkAppState()
  }, [])

  const checkAppState = async () => {
    // With the NestJS JWT backend there's no separate "app public settings"
    // handshake — we simply check whether a stored access token is valid.
    if (tokenStorage.hasToken()) {
      await checkUserAuth()
    } else {
      setIsLoadingAuth(false)
      setIsAuthenticated(false)
      setAuthChecked(true)
    }
  }

  const checkUserAuth = async () => {
    try {
      // Now check if the user is authenticated
      setIsLoadingAuth(true)
      const currentUser = await authService.me()

      // עדכן last_login
      if (currentUser.user_type) {
        authService.updateMe({ last_login: new Date().toISOString() }).catch(() => {})
      }

      setUser(currentUser)
      setIsAuthenticated(true)
      setIsImpersonating(tokenStorage.hasWorkspaceToken())

      // Load organization context synchronously before releasing loading state
      // This prevents ProtectedRoute from evaluating orgType before it's set
      if (currentUser?.organization_id) {
        try {
          const org = await organizationService.get(currentUser.organization_id)
          setOrganization(org)
          setOrgType(org?.org_type || null)
        } catch (_) {
          // org load failed — treat as no org (platform operator or orphaned user)
        }
      } else {
        setOrganization(null)
        // No organization row yet (e.g. org_admin who hasn't onboarded).
        // `orgType` reflects the REAL organization only — access gates
        // (ProtectedRoute) must never grant org-scoped access based on a
        // user's mere intent. Use `intendedOrgType` (below) for onboarding
        // redirect decisions instead.
        setOrgType(null)
      }
      setIntendedOrgType(currentUser.org_type || null)

      setIsLoadingAuth(false)
      setAuthChecked(true)
    } catch (error) {
      // 401 / 403 just means the stored token is stale — not an app-level error.
      // Clear the stale token from storage and treat the user as unauthenticated.
      if (error.status === 401 || error.status === 403) {
        tokenStorage.clearTokens()
      } else {
        console.error("User auth check failed:", error)
      }
      setIsLoadingAuth(false)
      setIsAuthenticated(false)
      setAuthChecked(true)
    }
  }

  // ── Admin: enter an organization's workspace ────────────────────────────
  // Exchanges the admin's real session for a short-lived, org-scoped
  // "workspace" token (kept separately — the admin's own access/refresh
  // tokens are never touched). All subsequent requests are transparently
  // scoped to that organization by the backend (see rls.utils.ts +
  // JwtStrategy `impersonating` handling). Re-runs checkUserAuth() so
  // `user`/`organization`/`orgType` reflect the entered organization,
  // exactly as that organization's own users would see it.
  const enterOrganization = async (organizationId) => {
    const { access_token, organization: org } = await authService.enterOrganization(organizationId)
    tokenStorage.setWorkspaceToken(access_token, organizationId)
    await checkUserAuth()
    return org
  }

  // ── Admin: exit the current organization workspace ──────────────────────
  const exitOrganization = async () => {
    try {
      await authService.exitOrganization()
    } catch (_) {
      // best-effort — proceed to drop the workspace token regardless
    }
    tokenStorage.clearWorkspaceToken()
    await checkUserAuth()
  }

  const logout = (shouldRedirect = true) => {
    setUser(null)
    setIsAuthenticated(false)
    tokenStorage.clearWorkspaceToken()

    if (shouldRedirect) {
      const from = encodeURIComponent(window.location.pathname + window.location.search)
      authService.logout(`/login?from_url=${from}`)
    } else {
      // Just clear tokens, no navigation
      tokenStorage.clearTokens()
    }
  }

  const navigateToLogin = () => {
    const from = encodeURIComponent(window.location.pathname + window.location.search)
    window.location.href = `/login?from_url=${from}`
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        authChecked,
        organization,
        orgType, // 'staffing_agency' | 'organization' | null
        intendedOrgType, // user's declared org_type even without an org row yet
        isSuperAdmin: user?.role === "admin",
        isAgency: orgType === "staffing_agency",
        isCompany: orgType === "organization",
        // Admin-acting-inside-an-organization context switch
        isImpersonating,
        enterOrganization,
        exitOrganization,
        logout,
        navigateToLogin,
        checkUserAuth,
        checkAppState,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
