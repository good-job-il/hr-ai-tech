import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { base44 } from '@/api/base44Client';
import { MemoryCacheStore } from './cacheStore';
import { normalizeError } from '@/lib/errors/errorNormalizer';
import { AppError } from '@/lib/errors/AppError';
import { ApiResponse, RequestConfig } from '@/types/api';

export class HttpClient {
  private axiosInstance: AxiosInstance;
  private cache = new MemoryCacheStore();
  private pendingRequests = new Map<string, Promise<any>>();

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: '/api',
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const token = await base44.auth.me().then(u => u?.id).catch(() => null);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await base44.auth.logout();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  private generateCacheKey(method: string, url: string, params?: any): string {
    return `${method}:${url}:${JSON.stringify(params || {})}`;
  }

  private async retryWithBackoff(
    fn: () => Promise<any>,
    retries: number = 3,
    delay: number = 1000
  ): Promise<any> {
    try {
      return await fn();
    } catch (error: any) {
      if (retries <= 0 || !error.retryable) {
        throw error;
      }

      await new Promise(resolve => setTimeout(resolve, delay));
      return this.retryWithBackoff(fn, retries - 1, delay * 2);
    }
  }

  async get<T = any>(
    url: string,
    config?: AxiosRequestConfig & RequestConfig
  ): Promise<T> {
    const cacheKey = this.generateCacheKey('GET', url, config?.params);

    // Check cache
    if (config?.cache !== false) {
      const cached = this.cache.get<T>(cacheKey);
      if (cached) return cached;
    }

    // Request deduplication
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey)!;
    }

    const request = this.retryWithBackoff(
      () => this.axiosInstance.get<ApiResponse<T>>(url, config),
      config?.retryCount || 3,
      config?.retryDelay || 1000
    ).then((response) => {
      const data = response.data?.data || response.data;

      // Cache successful response
      if (config?.cache !== false) {
        this.cache.set(data, cacheKey, config?.cacheDuration || 300000);
      }

      return data;
    }).finally(() => {
      this.pendingRequests.delete(cacheKey);
    });

    this.pendingRequests.set(cacheKey, request);
    return request;
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig & RequestConfig
  ): Promise<T> {
    try {
      const response = await this.axiosInstance.post<ApiResponse<T>>(url, data, config);
      return response.data?.data || response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig & RequestConfig
  ): Promise<T> {
    try {
      const response = await this.axiosInstance.put<ApiResponse<T>>(url, data, config);
      this.cache.clear();
      return response.data?.data || response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig & RequestConfig
  ): Promise<T> {
    try {
      const response = await this.axiosInstance.patch<ApiResponse<T>>(url, data, config);
      this.cache.clear();
      return response.data?.data || response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig & RequestConfig
  ): Promise<T> {
    try {
      const response = await this.axiosInstance.delete<ApiResponse<T>>(url, config);
      this.cache.clear();
      return response.data?.data || response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  invalidateCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
    } else {
      this.cache.clear(); // Simple implementation - would need Map iteration for partial invalidation
    }
  }
}

export const httpClient = new HttpClient();