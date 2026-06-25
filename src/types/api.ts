export interface ApiResponse<T = any> {
  data: T;
  status: number;
  message?: string;
  timestamp?: string;
}

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, any>;
  retryable?: boolean;
  timestamp?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface FilterParams {
  [key: string]: any;
}

export interface RequestConfig {
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
  cache?: boolean;
  cacheDuration?: number;
  signal?: AbortSignal;
}

export interface RepositoryOptions extends RequestConfig {
  filters?: FilterParams;
  pagination?: PaginationParams;
  select?: string[];
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface CacheStore {
  set<T>(key: string, value: T, ttl: number): void;
  get<T>(key: string): T | null;
  has(key: string): boolean;
  delete(key: string): void;
  clear(): void;
}