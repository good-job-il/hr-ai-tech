import { UserRole } from '../../common/enums/user-role.enum';
import { ReportsService } from './reports.service';

const repo = () => ({ find: jest.fn().mockResolvedValue([]), findOne: jest.fn() });

describe('ReportsService OA-3', () => {
  it('builds metrics only from the current organization scope', async () => {
    const applications = repo();
    const created = new Date('2026-01-01T00:00:00Z');
    applications.find.mockResolvedValue([
      { id: 1, organization_id: 12, status: 'completed', source: 'pool_assignment', recruiter_id: 7, team_manager_id: 8, employer_company_id: 9, job_id: 10, company: 'Client', job_title: 'Engineer', created_date: created, updated_date: new Date('2026-01-11T00:00:00Z') },
    ]);
    const timelines = repo();
    timelines.find.mockResolvedValue([{ application_id: 1, event_type: 'status_changed', new_value: 'hired', created_date: new Date('2026-01-06T00:00:00Z') }]);
    const users = repo(); users.find.mockResolvedValue([{ id: 7, role: UserRole.RECRUITER, full_name: 'Recruiter', email: 'r@test' }]);
    const service = new ReportsService(applications as any, timelines as any, repo() as any, repo() as any, users as any);

    const result = await service.getManagementReport({ date_from: '2026-01-01', date_to: '2026-01-31' } as any, { id: 3, role: UserRole.ORG_ADMIN, organization_id: 12 } as any);

    expect(applications.find).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ organization_id: 12, is_deleted: false }) }));
    expect(result.summary).toEqual(expect.objectContaining({ applications: 1, placements: 1, average_time_to_hire_days: 5 }));
    expect(result.source_effectiveness[0]).toEqual(expect.objectContaining({ source: 'pool_assignment', conversion_rate: 100 }));
  });
});
