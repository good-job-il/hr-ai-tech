/**
 * tokenStorage — JWT access/refresh token persistence for the NestJS backend.
 *
 * Application-owned JWT persistence for the NestJS backend.
 */

const ACCESS_TOKEN_KEY = "access_token"
const REFRESH_TOKEN_KEY = "refresh_token"
// Scoped admin "workspace" token — see AuthContext.enterOrganization().
// Kept in sessionStorage (not localStorage): it is short-lived, tab-scoped,
// and must NOT survive across new browser sessions or leak into other tabs.
const WORKSPACE_TOKEN_KEY = "admin_workspace_token"
const WORKSPACE_ORG_KEY = "admin_workspace_org"

export const tokenStorage = {
  getAccessToken(): string | null {
    if (typeof window === "undefined") return null
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  },

  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  },

  setTokens(accessToken: string, refreshToken?: string | null): void {
    if (typeof window === "undefined") return
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    }
  },

  setAccessToken(accessToken: string): void {
    if (typeof window === "undefined") return
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  },

  clearTokens(): void {
    if (typeof window === "undefined") return
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    this.clearWorkspaceToken()
  },

  hasToken(): boolean {
    return !!this.getAccessToken()
  },

  // ── Admin "acting as organization" workspace token ─────────────────────
  getWorkspaceToken(): string | null {
    if (typeof window === "undefined") return null
    return sessionStorage.getItem(WORKSPACE_TOKEN_KEY)
  },

  getWorkspaceOrganizationId(): number | null {
    if (typeof window === "undefined") return null
    const raw = sessionStorage.getItem(WORKSPACE_ORG_KEY)
    return raw ? Number(raw) : null
  },

  setWorkspaceToken(accessToken: string, organizationId: number): void {
    if (typeof window === "undefined") return
    sessionStorage.setItem(WORKSPACE_TOKEN_KEY, accessToken)
    sessionStorage.setItem(WORKSPACE_ORG_KEY, String(organizationId))
  },

  clearWorkspaceToken(): void {
    if (typeof window === "undefined") return
    sessionStorage.removeItem(WORKSPACE_TOKEN_KEY)
    sessionStorage.removeItem(WORKSPACE_ORG_KEY)
  },

  hasWorkspaceToken(): boolean {
    return !!this.getWorkspaceToken()
  },
}
