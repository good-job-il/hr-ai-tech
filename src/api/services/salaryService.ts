import { ResourceQuery, ResourceService } from './resourceService';

export interface SalaryRecord {
  id: number;
  category: string | null;
  job_title: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_avg: number | null;
}

export interface SalaryQuery extends ResourceQuery {
  category?: string;
  job_title?: string;
  location?: string;
}

class SalaryService extends ResourceService<SalaryRecord, SalaryQuery> {
  constructor() { super('/salary-data'); }
}

export const salaryService = new SalaryService();
