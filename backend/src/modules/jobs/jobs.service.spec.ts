import { JobsService } from './jobs.service';
import { UserRole } from '../../common/enums/user-role.enum';

describe('JobsService OA-2 state filters', () => {
  it('applies the route state as a server-side filter', async () => {
    const jobs = { findAndCount: jest.fn().mockResolvedValue([[], 0]) };
    const service = new JobsService(
      jobs as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    await service.findAll({ page: 1, limit: 20, sort: 'created_date', order: 'DESC', state: 'on_hold', is_deleted: false } as any, {
      id: 1,
      email: 'admin@agency.test',
      role: UserRole.ORG_ADMIN,
      organization_id: 12,
    } as any);

    expect(jobs.findAndCount).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ organization_id: 12, state: 'on_hold' }),
    }));
  });

  it('does not allow a public query to override the open state boundary', async () => {
    const jobs = { findAndCount: jest.fn().mockResolvedValue([[], 0]) };
    const service = new JobsService(jobs as any, {} as any, {} as any, {} as any, {} as any, {} as any);

    await service.findAll({ page: 1, limit: 20, sort: 'created_date', order: 'DESC', state: 'closed', is_deleted: false } as any);

    expect(jobs.findAndCount).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ state: 'open', is_deleted: false }),
    }));
  });
});
