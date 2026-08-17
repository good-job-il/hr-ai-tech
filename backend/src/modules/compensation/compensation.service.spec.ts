import { NotFoundException } from '@nestjs/common';
import { UserRole } from '../../common/enums/user-role.enum';
import { OrgType } from '../../common/enums/org-type.enum';
import { CompensationService } from './compensation.service';

const repo = () => ({
  findOne: jest.fn(),
  create: jest.fn(value => value),
  save: jest.fn(async value => value),
});

describe('CompensationService OA-2 canonical relations', () => {
  it('resolves a job only inside the current organization', async () => {
    const plans = repo();
    const jobs = repo();
    const service = new CompensationService(
      plans as any,
      jobs as any,
      repo() as any,
      repo() as any,
      repo() as any,
      { log: jest.fn() } as any,
    );
    const actor = {
      id: 4,
      email: 'owner@agency.test',
      role: UserRole.ORG_ADMIN,
      org_type: OrgType.STAFFING_AGENCY,
      organization_id: 22,
    } as any;

    await expect(service.create({ job_id: 99, employer_company_id: 8 } as any, actor))
      .rejects.toBeInstanceOf(NotFoundException);
    expect(jobs.findOne).toHaveBeenCalledWith({ where: { id: 99, organization_id: 22 } });
    expect(plans.save).not.toHaveBeenCalled();
  });
});
