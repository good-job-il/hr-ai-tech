import assert from 'node:assert/strict';
import {
  canAccessAgencyRecord,
  filterAgencyRecordsByScope,
  getAgencyScopeFilter,
  isAgencyUser,
} from '../src/domain/agency/access.js';
import {
  AGENCY_FIXTURE_IDS,
  agencyApplicationStatusFixtures,
  agencyRoleFixtures,
} from '../src/fixtures/agency/agencyFixtures.js';

const ownRecord = agencyApplicationStatusFixtures[0];
const otherRecruiterRecord = {
  ...ownRecord,
  id: '10000000-0000-4000-9000-000000000099',
  recruiter_id: AGENCY_FIXTURE_IDS.otherRecruiter,
  assigned_to: AGENCY_FIXTURE_IDS.otherRecruiter,
};
const otherTeamRecord = {
  ...otherRecruiterRecord,
  id: '10000000-0000-4000-9000-000000000098',
  team_manager_id: '10000000-0000-4000-8000-000000000099',
};
const otherTenantRecord = {
  ...ownRecord,
  id: '20000000-0000-4000-9000-000000000001',
  organization_id: AGENCY_FIXTURE_IDS.otherOrganization,
};

assert.equal(isAgencyUser(agencyRoleFixtures.orgAdmin), true);
assert.equal(isAgencyUser({ id: 'platform-admin', role: 'admin' }), false);

assert.equal(canAccessAgencyRecord(agencyRoleFixtures.orgAdmin, ownRecord), true);
assert.equal(canAccessAgencyRecord(agencyRoleFixtures.orgAdmin, otherTenantRecord), false);
assert.equal(canAccessAgencyRecord(agencyRoleFixtures.recruitmentManager, ownRecord), true);
assert.equal(canAccessAgencyRecord(agencyRoleFixtures.teamManager, ownRecord), true);
assert.equal(canAccessAgencyRecord(agencyRoleFixtures.teamManager, otherTeamRecord), false);
assert.equal(canAccessAgencyRecord(agencyRoleFixtures.recruiter, ownRecord), true);
assert.equal(canAccessAgencyRecord(agencyRoleFixtures.recruiter, otherRecruiterRecord), false);

assert.deepEqual(
  filterAgencyRecordsByScope(agencyRoleFixtures.recruiter, [ownRecord, otherRecruiterRecord, otherTenantRecord]),
  [ownRecord],
);
assert.deepEqual(getAgencyScopeFilter(agencyRoleFixtures.teamManager), {
  organization_id: AGENCY_FIXTURE_IDS.organization,
  team_manager_id: AGENCY_FIXTURE_IDS.teamManager,
});

console.log('Agency access contract: all checks passed');

