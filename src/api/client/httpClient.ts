import axios, { AxiosInstance, AxiosRequestConfig } from "axios"
import { MemoryCacheStore } from "./cacheStore"
import { tokenStorage } from "./tokenStorage"
import { normalizeError } from "@/lib/errors/errorNormalizer"
import { AppError } from "@/lib/errors/AppError"
import { ErrorNormalizer } from "@/lib/errors/errorNormalizer"
import { ApiResponse, RequestConfig } from "@/types/api"

type ApiPayload<T> = ApiResponse<T> | T

const apiBaseUrl = (
  (import.meta as ImportMeta & { env: { VITE_API_BASE_URL?: string } }).env.VITE_API_BASE_URL ||
  "/api"
).replace(/\/+$/, "")

function isEnvelope<T>(payload: ApiPayload<T>): payload is ApiResponse<T> {
  return Boolean(
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    "status" in payload &&
    typeof (payload as ApiResponse<T>).status === "number" &&
    !("pagination" in payload),
  )
}

export function unwrapResponse<T>(payload: ApiPayload<T>): T {
  return isEnvelope(payload) ? payload.data : (payload as T)
}

export class HttpClient {
  private axiosInstance: AxiosInstance
  private cache = new MemoryCacheStore()
  private pendingRequests = new Map<string, Promise<unknown>>()
  private refreshPromise: Promise<string | null> | null = null

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: apiBaseUrl,
      timeout: 30000,
    })

    this.setupInterceptors()
  }

  private setupInterceptors(): void {
    // Request interceptor — attach JWT access token from storage.
    // While an admin is "inside" an organization workspace, the scoped
    // workspace token takes precedence over the admin's own access token —
    // this is what makes every subsequent request (list jobs, candidates,
    // users, ...) transparently scoped to that organization on the backend.
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = tokenStorage.getWorkspaceToken() || tokenStorage.getAccessToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error),
    )

    // Response interceptor — transparently refresh access token on 401 once,
    // then retry the original request. If refresh fails, clear tokens and
    // redirect to login.
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config

        if (
          error.response?.status === 401 &&
          !originalRequest?._retry &&
          !originalRequest?.url?.includes("/auth/")
        ) {
          originalRequest._retry = true

          // The scoped workspace token has no matching refresh token — if it
          // expired, drop it and reload so AuthContext falls back to the
          // admin's own session (and the user sees the platform view again)
          // instead of silently retrying with mismatched credentials.
          if (tokenStorage.hasWorkspaceToken()) {
            tokenStorage.clearWorkspaceToken()
            if (typeof window !== "undefined")
              window.location.href = "/platform/organizations/staffing"
            return Promise.reject(error)
          }

          const newToken = await this.refreshAccessToken()
          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            return this.axiosInstance(originalRequest)
          }

          tokenStorage.clearTokens()
          if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
            window.location.href = "/login"
          }
        }
        return Promise.reject(error)
      },
    )
  }

  /** Refresh access token using the stored refresh token. Deduplicates concurrent calls. */
  private async refreshAccessToken(): Promise<string | null> {
    const refreshToken = tokenStorage.getRefreshToken()
    if (!refreshToken) return null

    if (!this.refreshPromise) {
      this.refreshPromise = axios
        .post(`${apiBaseUrl}/auth/refresh`, { refresh_token: refreshToken })
        .then((res) => {
          const tokens = res.data?.data || res.data
          tokenStorage.setTokens(tokens.access_token, tokens.refresh_token)
          return tokens.access_token as string
        })
        .catch(() => null)
        .finally(() => {
          this.refreshPromise = null
        })
    }

    return this.refreshPromise
  }

  private generateCacheKey(method: string, url: string, params?: unknown): string {
    return `${method}:${url}:${JSON.stringify(params || {})}`
  }

  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    retries: number = 3,
    delay: number = 1000,
  ): Promise<T> {
    try {
      return await fn()
    } catch (error) {
      const normalized = error instanceof AppError ? error : normalizeError(error)
      if (retries <= 0 || !ErrorNormalizer.isRetryable(normalized)) {
        throw error
      }

      await new Promise((resolve) => setTimeout(resolve, delay))
      return this.retryWithBackoff(fn, retries - 1, delay * 2)
    }
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig & RequestConfig): Promise<T> {
    const cacheKey = this.generateCacheKey("GET", url, config?.params)

    // Check cache
    if (config?.cache !== false) {
      const cached = this.cache.get<T>(cacheKey)
      if (cached !== null) return cached
    }

    // Request deduplication
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey)! as Promise<T>
    }

    const request = this.retryWithBackoff(
      () => this.axiosInstance.get<ApiPayload<T>>(url, config),
      config?.retryCount ?? 3,
      config?.retryDelay ?? 1000,
    )
      .then((response) => {
        const data = unwrapResponse<T>(response.data)

        // Cache successful response
        if (config?.cache !== false) {
          this.cache.set(cacheKey, data, config?.cacheDuration ?? 300000)
        }

        return data
      })
      .catch((error) => {
        throw normalizeError(error)
      })
      .finally(() => {
        this.pendingRequests.delete(cacheKey)
      })

    this.pendingRequests.set(cacheKey, request)
    return request
  }

  async post<T = any>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig & RequestConfig,
  ): Promise<T> {
    try {
      const response = await this.axiosInstance.post<ApiPayload<T>>(url, data, config)
      return unwrapResponse<T>(response.data)
    } catch (error) {
      throw normalizeError(error)
    }
  }

  async put<T = any>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig & RequestConfig,
  ): Promise<T> {
    try {
      const response = await this.axiosInstance.put<ApiPayload<T>>(url, data, config)
      this.cache.clear()
      return unwrapResponse<T>(response.data)
    } catch (error) {
      throw normalizeError(error)
    }
  }

  async patch<T = any>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig & RequestConfig,
  ): Promise<T> {
    try {
      const response = await this.axiosInstance.patch<ApiPayload<T>>(url, data, config)
      this.cache.clear()
      return unwrapResponse<T>(response.data)
    } catch (error) {
      throw normalizeError(error)
    }
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig & RequestConfig): Promise<T> {
    try {
      const response = await this.axiosInstance.delete<ApiPayload<T>>(url, config)
      this.cache.clear()
      return unwrapResponse<T>(response.data)
    } catch (error) {
      throw normalizeError(error)
    }
  }

  clearCache(): void {
    this.cache.clear()
  }

  invalidateCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear()
    } else {
      this.cache.clear() // Simple implementation - would need Map iteration for partial invalidation
    }
  }
}

export const httpClient = new HttpClient()
