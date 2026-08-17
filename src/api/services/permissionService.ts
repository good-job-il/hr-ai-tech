import { httpClient } from '@/api/client/httpClient';
import { ResourceQuery, asList, buildQuery } from './resourceService';
import type { PaginatedResponse } from '@/types/api';

export type OrganizationType = 'staffing_agency' | 'organization';

export interface PermissionSet {
  view?: boolean;
  create?: boolean;
  update?: boolean;
  delete?: boolean;
  export?: boolean;
  download_cv?: boolean;
  view_compensation?: boolean;
  edit_compensation?: boolean;
  manage_users?: boolean;
  manage_settings?: boolean;
}

export interface PermissionMatrixRecord {
  id: number;
  organization_id: number | null;
  org_type: OrganizationType | null;
  role_key: string;
  is_template: boolean;
  permissions: PermissionSet;
}

export interface EffectivePermissionsResponse {
  organization_id: number | null;
  org_type: OrganizationType | null;
  role_key: string;
  source: 'organization' | 'template' | 'platform_admin' | 'none';
  permissions: Required<PermissionSet>;
}

export interface PermissionMatrixQuery extends ResourceQuery {
  organization_id?: number;
  org_type?: OrganizationType;
  role_key?: string;
  is_template?: boolean;
}

export interface CreatePermissionMatrixInput {
  organization_id?: number | null;
  org_type?: OrganizationType | null;
  role_key: string;
  is_template?: boolean;
  permissions: PermissionSet;
}

export type UpdatePermissionMatrixInput = Partial<CreatePermissionMatrixInput>;

export interface RoleTemplateRecord {
  id: number;
  organization_id: number | null;
  org_type: OrganizationType;
  system_role_key: string;
  display_name: string;
  parent_role_key: string | null;
  hierarchy_level: number | null;
  is_editable_name: boolean;
  is_system_required: boolean;
  permissions_template_id: number | null;
  is_active: boolean;
}

export interface RoleTemplateQuery extends ResourceQuery {
  // Sorting is performed client-side; the NestJS DTO exposes no sort field.
  sort?: never;
  organization_id?: number;
  org_type?: OrganizationType;
}

export interface CreateRoleTemplateInput {
  organization_id?: number | null;
  org_type: OrganizationType;
  system_role_key: string;
  display_name: string;
  parent_role_key?: string | null;
  hierarchy_level?: number | null;
  is_editable_name?: boolean;
  is_system_required?: boolean;
  permissions_template_id?: number | null;
  is_active?: boolean;
}

export type UpdateRoleTemplateInput = Partial<CreateRoleTemplateInput>;

export interface RoleAliasRecord {
  id: number;
  alias: string;
  canonical_role: string;
}

function mutableCollection<TEntity, TQuery extends object, TCreate, TUpdate>(endpoint: `/${string}`) {
  return {
    async list(query: TQuery = {} as TQuery): Promise<TEntity[]> {
      const response = await httpClient.get<TEntity[] | PaginatedResponse<TEntity>>(
        `${endpoint}${buildQuery(query)}`,
        { cache: false },
      );
      return asList(response);
    },
    create: (payload: TCreate) => httpClient.post<TEntity>(endpoint, payload),
    update: (id: number, payload: TUpdate) => httpClient.patch<TEntity>(`${endpoint}/${id}`, payload),
    remove: (id: number) => httpClient.delete<void>(`${endpoint}/${id}`),
  };
}

export const permissionMatrixService = mutableCollection<
  PermissionMatrixRecord, PermissionMatrixQuery, CreatePermissionMatrixInput, UpdatePermissionMatrixInput
>('/permission-matrices');

export const effectivePermissionService = {
  get: () => httpClient.get<EffectivePermissionsResponse>('/permissions/effective', { cache: false }),
};

export const roleTemplateService = mutableCollection<
  RoleTemplateRecord, RoleTemplateQuery, CreateRoleTemplateInput, UpdateRoleTemplateInput
>('/role-templates');

// The backend intentionally exposes aliases as list/create only. Do not
// inherit guessed get/update/delete routes from the generic CRUD service.
export const roleAliasService = {
  list: () => httpClient.get<RoleAliasRecord[]>('/role-aliases', { cache: false }),
  create: (payload: { alias: string; canonical_role: string }) =>
    httpClient.post<RoleAliasRecord>('/role-aliases', payload),
};
