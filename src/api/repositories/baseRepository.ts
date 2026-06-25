import { httpClient } from '@/api/client/httpClient';
import { ApiResponse, PaginatedResponse, PaginationParams, RepositoryOptions } from '@/types/api';

export abstract class BaseRepository<T> {
  protected abstract endpoint: string;

  async list(options?: RepositoryOptions): Promise<PaginatedResponse<T>> {
    const params = new URLSearchParams();

    if (options?.pagination) {
      params.append('page', String(options.pagination.page));
      params.append('limit', String(options.pagination.limit));
      if (options.pagination.sort) {
        params.append('sort', options.pagination.sort);
        params.append('order', options.pagination.order || 'asc');
      }
    }

    if (options?.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        params.append(`filter[${key}]`, String(value));
      });
    }

    if (options?.select) {
      params.append('select', options.select.join(','));
    }

    return httpClient.get<PaginatedResponse<T>>(
      `${this.endpoint}?${params.toString()}`,
      { cache: true, cacheDuration: 300000, ...options }
    );
  }

  async getById(id: string | number, options?: RepositoryOptions): Promise<T> {
    return httpClient.get<T>(
      `${this.endpoint}/${id}`,
      { cache: true, cacheDuration: 600000, ...options }
    );
  }

  async create(data: Partial<T>, options?: RepositoryOptions): Promise<T> {
    return httpClient.post<T>(
      this.endpoint,
      data,
      { ...options }
    );
  }

  async update(id: string | number, data: Partial<T>, options?: RepositoryOptions): Promise<T> {
    return httpClient.put<T>(
      `${this.endpoint}/${id}`,
      data,
      { ...options }
    );
  }

  async patch(id: string | number, data: Partial<T>, options?: RepositoryOptions): Promise<T> {
    return httpClient.patch<T>(
      `${this.endpoint}/${id}`,
      data,
      { ...options }
    );
  }

  async delete(id: string | number, options?: RepositoryOptions): Promise<void> {
    await httpClient.delete(
      `${this.endpoint}/${id}`,
      { ...options }
    );
  }

  async bulkCreate(data: Partial<T>[], options?: RepositoryOptions): Promise<T[]> {
    return httpClient.post<T[]>(
      `${this.endpoint}/bulk`,
      { items: data },
      { ...options }
    );
  }

  async bulkUpdate(updates: Array<{ id: string | number; data: Partial<T> }>, options?: RepositoryOptions): Promise<T[]> {
    return httpClient.patch<T[]>(
      `${this.endpoint}/bulk`,
      { updates },
      { ...options }
    );
  }

  async bulkDelete(ids: (string | number)[], options?: RepositoryOptions): Promise<void> {
    await httpClient.delete(
      `${this.endpoint}/bulk`,
      { data: { ids }, ...options }
    );
  }
}