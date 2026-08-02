import { ResourceService, ResourceQuery } from './resourceService';
export interface CompanyRecord { id: number; name: string; [key: string]: unknown }
export const companyService = new ResourceService<CompanyRecord, ResourceQuery>('/companies');
