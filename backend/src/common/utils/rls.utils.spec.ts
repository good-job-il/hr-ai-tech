import { UserRole } from '../enums/user-role.enum';
import { BLOCKED_FILTER, getRlsWhere, isBlocked, UserContext } from './rls.utils';

const user = (overrides: Partial<UserContext>): UserContext => ({
  id: 7,
  email: 'user@example.com',
  role: UserRole.CANDIDATE,
  organization_id: null,
  ...overrides,
});

describe('getRlsWhere', () => {
  it('prevents an organization admin from overriding tenant scope', () => {
    expect(getRlsWhere('Candidate', user({ role: UserRole.ORG_ADMIN, organization_id: 10 }), {
      organization_id: 99,
    })).toEqual({ is_deleted: false, organization_id: 10 });
  });

  it('confines recruiters to their tenant and own assignment', () => {
    expect(getRlsWhere('Application', user({ role: UserRole.RECRUITER, organization_id: 10 }), {
      organization_id: 99,
      recruiter_id: 123,
    })).toEqual({ is_deleted: false, organization_id: 10, recruiter_id: 7 });
  });

  it('confines an impersonating platform admin to the entered tenant', () => {
    expect(getRlsWhere('Job', user({
      role: UserRole.ADMIN,
      organization_id: 10,
      impersonating: true,
    }), { organization_id: 99 })).toEqual({ is_deleted: false, organization_id: 10 });
  });

  it('confines candidates to canonical user ownership', () => {
    expect(getRlsWhere('Application', user({ id: 55 }), { candidate_user_id: 99 }))
      .toEqual({ is_deleted: false, candidate_user_id: 55 });
  });

  it('blocks unsupported employer resources', () => {
    const filter = getRlsWhere('AuditLog', user({
      role: UserRole.EMPLOYER,
      employer_company_id: 21,
    }));
    expect(filter).toBe(BLOCKED_FILTER);
    expect(isBlocked(filter)).toBe(true);
  });

  it('blocks tenant roles without an organization', () => {
    expect(getRlsWhere('Job', user({ role: UserRole.ORG_ADMIN }))).toBe(BLOCKED_FILTER);
  });
});
