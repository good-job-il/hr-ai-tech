/**
 * tokenStorage — JWT access/refresh token persistence for the NestJS backend.
 *
 * Replaces Base44 SDK's internal token handling. Keeps the historical
 * localStorage key names (`base44_access_token`, `token`) for backward
 * compatibility with any code/bookmarks still referencing them.
 */

const ACCESS_TOKEN_KEY = 'base44_access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const tokenStorage = {
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setTokens(accessToken: string, refreshToken?: string | null): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem('token', accessToken); // legacy alias
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  },

  setAccessToken(accessToken: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem('token', accessToken);
  },

  clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem('token');
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  hasToken(): boolean {
    return !!this.getAccessToken();
  },
};

