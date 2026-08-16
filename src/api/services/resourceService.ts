import { httpClient } from '@/api/client/httpClient';
import type { PaginatedResponse } from '@/types/api';

export type QueryValue = string | number | boolean | null | undefined;

export interface ResourceQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

export function buildQuery<Q extends object>(query: Q): string {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  });
  const value = params.toString();
  return value ? `?${value}` : '';
}

export function asList<T>(response: T[] | PaginatedResponse<T>): T[] {
  return Array.isArray(response) ? response : response.data;
}

export function asPage<T>(response: T[] | PaginatedResponse<T>): PaginatedResponse<T> {
  if (!Array.isArray(response)) return response;
  return {
    data: response,
    pagination: {
      page: 1,
      limit: response.length,
      total: response.length,
      totalPages: response.length ? 1 : 0,
      hasNextPage: false,
      hasPrevPage: false,
    },
  };
}

/** Explicit REST resource with separate entity, query, create and update contracts. */
export class ResourceService<
  TEntity,
  TQuery extends ResourceQuery = ResourceQuery,
  TCreate = never,
  TUpdate = never,
> {
  constructor(protected readonly endpoint: `/${string}`) {}

  async list(query: TQuery = {} as TQuery): Promise<TEntity[]> {
    return asList(await this.listPage(query));
  }

  async listPage(query: TQuery = {} as TQuery): Promise<PaginatedResponse<TEntity>> {
    const response = await httpClient.get<TEntity[] | PaginatedResponse<TEntity>>(
      `${this.endpoint}${buildQuery(query)}`,
      { cache: false },
    );
    return asPage(response);
  }

  get(id: string | number): Promise<TEntity> {
    return httpClient.get(`${this.endpoint}/${id}`, { cache: false });
  }

  create(payload: TCreate): Promise<TEntity> {
    return httpClient.post(this.endpoint, payload);
  }

  update(id: string | number, payload: TUpdate): Promise<TEntity> {
    return httpClient.patch(`${this.endpoint}/${id}`, payload);
  }

  async remove(id: string | number): Promise<void> {
    await httpClient.delete(`${this.endpoint}/${id}`);
  }
}
