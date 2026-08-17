import { ForbiddenException } from '@nestjs/common';
import { OrgType } from '../../common/enums/org-type.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import { OrgPlan, OrgStatus } from './organization.entity';
import { OrganizationsService } from './organizations.service';

describe('OrganizationsService OA-4 onboarding acceptance', () => {
  const repo = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({ id: 41, ...value })),
  };
  const users = { update: jest.fn().mockResolvedValue({ affected: 1 }) };
  const audit = { log: jest.fn() };
  let service: OrganizationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OrganizationsService(repo as any, users as any, audit as any);
  });

  it('creates a trial staffing agency and links the registering org admin', async () => {
    const actor = { id: 9, role: UserRole.ORG_ADMIN, organization_id: null } as any;

    const organization = await service.onboardAgency({
      name: 'Acceptance Staffing',
      contact_email: 'ops@acceptance.test',
    } as any, actor);

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Acceptance Staffing',
      org_type: OrgType.STAFFING_AGENCY,
      status: OrgStatus.ACTIVE,
      plan: OrgPlan.TRIAL,
    }));
    expect(users.update).toHaveBeenCalledWith(9, {
      organization_id: 41,
      org_type: OrgType.STAFFING_AGENCY,
    });
    expect(organization.id).toBe(41);
  });

  it('rejects repeated onboarding and non-admin onboarding', async () => {
    await expect(service.onboardAgency({ name: 'Again' } as any, {
      role: UserRole.ORG_ADMIN,
      organization_id: 7,
    } as any)).rejects.toBeInstanceOf(ForbiddenException);

    await expect(service.onboardAgency({ name: 'Recruiter agency' } as any, {
      role: UserRole.RECRUITER,
      organization_id: null,
    } as any)).rejects.toBeInstanceOf(ForbiddenException);
    expect(repo.save).not.toHaveBeenCalled();
  });
});
