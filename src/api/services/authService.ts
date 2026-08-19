import { httpClient } from "@/api/client/httpClient"
import { tokenStorage } from "@/api/client/tokenStorage"

export interface AuthUser {
  id: number
  email: string
  full_name?: string
  role: UserRole
  organization_id?: number | null
  org_type?: "staffing_agency" | "organization" | null
  phone?: string | null
  display_role_name?: string | null
  last_login?: string | null
  is_active?: boolean
  company_culture?: string | null
  benefits?: string[] | null
  gallery_urls?: string[] | null
  video_url?: string | null
  testimonials?: Array<Record<string, unknown>> | null
  profile_completed?: boolean
  user_type?: UserRole
}

export type UserRole =
  | "candidate"
  | "employer"
  | "recruiter"
  | "team_manager"
  | "recruitment_manager"
  | "org_admin"
  | "admin"
  | "hr_manager"
  | "internal_recruiter"

export type PublicRegistrationRole = "candidate" | "employer" | "org_admin"

export interface RegisterInput {
  email: string
  password: string
  full_name: string
  phone?: string
  role?: PublicRegistrationRole
}

export interface UpdateMeInput {
  full_name?: string
  phone?: string
  display_role_name?: string
  last_login?: string
  org_type?: "organization" | "staffing_agency" | null
  profile_completed?: boolean
  is_active?: boolean
}

interface AuthResponse {
  access_token: string
  refresh_token: string
  user: AuthUser
}

export const authService = {
  me: () => httpClient.get<AuthUser>("/auth/me", { cache: false }),

  async login(email: string, password: string) {
    const response = await httpClient.post<AuthResponse>("/auth/login", { email, password })
    tokenStorage.setTokens(response.access_token, response.refresh_token)
    return response.user
  },

  async register(payload: RegisterInput) {
    const response = await httpClient.post<AuthResponse>("/auth/register", payload)
    tokenStorage.setTokens(response.access_token, response.refresh_token)
    return response.user
  },

  updateMe: (payload: UpdateMeInput) => httpClient.patch<AuthUser>("/auth/me", payload),
  requestPasswordReset: (email: string) =>
    httpClient.post<{ message: string }>("/auth/forgot-password", { email }),
  resetPassword: (token: string, password: string) =>
    httpClient.post<{ message: string }>("/auth/reset-password", { token, password }),

  async refresh(refreshToken = tokenStorage.getRefreshToken()) {
    if (!refreshToken) throw new Error("Refresh token is not available")
    const response = await httpClient.post<Pick<AuthResponse, "access_token" | "refresh_token">>(
      "/auth/refresh",
      { refresh_token: refreshToken },
    )
    tokenStorage.setTokens(response.access_token, response.refresh_token)
    return response
  },

  async logout(redirectUrl = "/login") {
    try {
      await httpClient.post("/auth/logout")
    } catch {
      /* local logout must still complete */
    }
    tokenStorage.clearTokens()
    if (typeof window !== "undefined") window.location.href = redirectUrl
  },

  async enterOrganization(organizationId: number) {
    return httpClient.post<{ access_token: string; organization: Record<string, unknown> }>(
      `/auth/organizations/${organizationId}/enter`,
    )
  },

  exitOrganization: () => httpClient.post<{ message: string }>("/auth/organizations/exit"),
}
