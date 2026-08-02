import { ResourceService, ResourceQuery } from './resourceService';

export interface PermissionRecord { id: number; [key: string]: unknown }

export const permissionMatrixService = new ResourceService<PermissionRecord, ResourceQuery>('/permission-matrices');
export const roleTemplateService = new ResourceService<PermissionRecord, ResourceQuery>('/role-templates');
export const roleAliasService = new ResourceService<PermissionRecord, ResourceQuery>('/role-aliases');
export const positionService = new ResourceService<PermissionRecord, ResourceQuery>('/positions');
export const userPositionAccessService = new ResourceService<PermissionRecord, ResourceQuery>('/user-position-access');
