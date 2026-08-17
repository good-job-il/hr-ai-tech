import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserRole } from '../../common/enums/user-role.enum';
import { AgencyTeamsService } from './agency-teams.service';

describe('AgencyTeamsService OA-4 team lifecycle acceptance', () => {
  const organizationId = 71;
  const actor = {
    id: 1,
    email: 'owner@acceptance.test',
    full_name: 'Agency Owner',
    role: UserRole.ORG_ADMIN,
    organization_id: organizationId,
  } as any;

  let storedUsers: any[];
  let storedTeams: any[];
  let storedInvitations: any[];
  let service: AgencyTeamsService;

  beforeEach(() => {
    storedUsers = [actor];
    storedTeams = [];
    storedInvitations = [];

    const users = {
      findOne: jest.fn(async ({ where }) => storedUsers.find(item =>
        Object.entries(where).every(([key, value]) => item[key] === value),
      ) || null),
      save: jest.fn(async (value) => {
        const saved = { id: value.id || storedUsers.length + 1, ...value };
        storedUsers = [...storedUsers.filter(item => item.id !== saved.id), saved];
        return saved;
      }),
      create: jest.fn(value => value),
      update: jest.fn(async (criteria, patch) => {
        const where = typeof criteria === 'number' ? { id: criteria } : criteria;
        storedUsers = storedUsers.map(item => Object.entries(where).every(([key, value]) => item[key] === value)
          ? { ...item, ...patch }
          : item);
        return { affected: 1 };
      }),
      count: jest.fn(async ({ where }) => storedUsers.filter(item =>
        Object.entries(where).every(([key, value]) => item[key] === value),
      ).length),
      find: jest.fn(async () => storedUsers),
    };
    const teams = {
      findOne: jest.fn(async ({ where }) => storedTeams.find(item =>
        Object.entries(where).every(([key, value]) => item[key] === value),
      ) || null),
      save: jest.fn(async (value) => {
        const saved = { id: value.id || storedTeams.length + 101, is_active: true, ...value };
        storedTeams = [...storedTeams.filter(item => item.id !== saved.id), saved];
        return saved;
      }),
      create: jest.fn(value => value),
      count: jest.fn(async ({ where }) => storedTeams.filter(item =>
        Object.entries(where).every(([key, value]) => item[key] === value),
      ).length),
      find: jest.fn(async () => storedTeams),
    };
    const invitations = {
      findOne: jest.fn(async ({ where }) => storedInvitations.find(item =>
        Object.entries(where).every(([key, value]) => item[key] === value),
      ) || null),
      save: jest.fn(async (value) => {
        const saved = { id: value.id || storedInvitations.length + 201, ...value };
        storedInvitations = [...storedInvitations.filter(item => item.id !== saved.id), saved];
        return saved;
      }),
      create: jest.fn(() => ({})),
      find: jest.fn(async () => storedInvitations),
      createQueryBuilder: jest.fn(() => ({
        update: jest.fn().mockReturnThis(), set: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(), execute: jest.fn().mockResolvedValue({ affected: 0 }),
      })),
    };

    service = new AgencyTeamsService(users as any, teams as any, invitations as any, { log: jest.fn() } as any);
  });

  it('creates a team, invites a recruiter, accepts the invitation and manages access', async () => {
    const team = await service.createTeam({ name: 'North Team' } as any, actor);
    const invitation = await service.invite({
      full_name: 'New Recruiter',
      email: 'new.recruiter@acceptance.test',
      role: UserRole.RECRUITER,
      team_id: team.id,
    } as any, actor);

    const accepted = await service.accept(invitation.invite_token, 'StrongPass123!');
    expect(accepted).toEqual(expect.objectContaining({
      email: 'new.recruiter@acceptance.test',
      role: UserRole.RECRUITER,
    }));
    expect(storedInvitations[0].status).toBe('accepted');

    const deactivated = await service.updateMember(accepted.id, { is_active: false } as any, actor);
    expect(deactivated.is_active).toBe(false);
    expect((deactivated as any).password_hash).toBeUndefined();
  });

  it('does not expose a cross-tenant team or allow the last admin to be deactivated', async () => {
    storedTeams.push({ id: 999, organization_id: 999, name: 'Other tenant' });
    await expect(service.updateTeam(999, { name: 'Captured' } as any, actor))
      .rejects.toBeInstanceOf(NotFoundException);
    await expect(service.updateMember(actor.id, { is_active: false } as any, actor))
      .rejects.toBeInstanceOf(BadRequestException);
  });
});
