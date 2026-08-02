import { ResourceService, ResourceQuery } from './resourceService';
export interface CompensationPlanRecord { id: number; [key: string]: unknown }
export const compensationPlanService = new ResourceService<CompensationPlanRecord, ResourceQuery>('/compensation-plans');
