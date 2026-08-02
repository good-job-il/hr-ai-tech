import { httpClient } from '@/api/client/httpClient';
import { tokenStorage } from '@/api/client/tokenStorage';

export interface AuthUser {
  id: number;
  email: string;
  full_name?: string;
  role: string;
  organization_id?: number | null;
  org_type?: 'staffing_agency' | 'organization' | null;
  [key: string]: unknown;
}

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
}

export const authService = {
  me: () => httpClient.get<AuthUser>('/auth/me', { cache: false }),

  async login(email: string, password: string) {
    const response = await httpClient.post<AuthResponse>('/auth/login', { email, password });
    tokenStorage.setTokens(response.access_token, response.refresh_token);
    return response.user;
  },

  async register(payload: Record<string, unknown>) {
    const response = await httpClient.post<AuthResponse>('/auth/register', payload);
    tokenStorage.setTokens(response.access_token, response.refresh_token);
    return response.user;
  },

  updateMe: (payload: Partial<AuthUser>) => httpClient.patch<AuthUser>('/auth/me', payload),
  requestPasswordReset: (email: string) => httpClient.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => httpClient.post('/auth/reset-password', { token, password }),

  async logout(redirectUrl = '/login') {
    try { await httpClient.post('/auth/logout'); } catch { /* local logout must still complete */ }
    tokenStorage.clearTokens();
    if (typeof window !== 'undefined') window.location.href = redirectUrl;
  },

  async enterOrganization(organizationId: number) {
    return httpClient.post<{ access_token: string; organization: Record<string, unknown> }>(
      `/auth/organizations/${organizationId}/enter`,
    );
  },

  exitOrganization: () => httpClient.post('/auth/organizations/exit'),
};
