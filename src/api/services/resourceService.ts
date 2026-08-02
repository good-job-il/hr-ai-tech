import { httpClient } from '@/api/client/httpClient';

export type QueryValue = string | number | boolean | null | undefined;
export type ResourceQuery = Record<string, QueryValue>;

export function buildQuery(query: ResourceQuery = {}): string {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  });
  const value = params.toString();
  return value ? `?${value}` : '';
}

export function asList<T>(response: unknown): T[] {
  if (Array.isArray(response)) return response as T[];
  const value = response as { data?: T[]; items?: T[] } | null;
  return value?.data || value?.items || [];
}

/** Explicitly instantiated REST resource. No endpoint guessing or dynamic proxy. */
export class ResourceService<T, Q extends ResourceQuery = ResourceQuery> {
  constructor(protected readonly endpoint: string) {}

  async list(query: Q = {} as Q): Promise<T[]> {
    return asList<T>(await httpClient.get(`${this.endpoint}${buildQuery(query)}`, { cache: false }));
  }

  get(id: string | number): Promise<T> {
    return httpClient.get(`${this.endpoint}/${id}`, { cache: false });
  }

  create(payload: Partial<T> | Record<string, unknown>): Promise<T> {
    return httpClient.post(this.endpoint, payload);
  }

  update(id: string | number, payload: Partial<T> | Record<string, unknown>): Promise<T> {
    return httpClient.patch(`${this.endpoint}/${id}`, payload);
  }

  async remove(id: string | number): Promise<void> {
    await httpClient.delete(`${this.endpoint}/${id}`);
  }
}
