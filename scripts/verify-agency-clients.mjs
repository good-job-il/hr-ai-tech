import assert from 'node:assert/strict';
import {
  ACTIVE_RECRUITMENT_APPLICATION_STATUSES,
  AGENCY_CLIENT_STATUS_VALUES,
  canArchiveAgencyClient,
  isActiveAgencyClient,
} from '../src/domain/agency/contracts.js';

const agencyId = 10;
const otherAgencyId = 20;
const companyId = 100;
const client = { id: 1, organization_id: agencyId, company_id: companyId, status: 'active' };

assert.deepEqual(AGENCY_CLIENT_STATUS_VALUES, ['prospect', 'active', 'inactive', 'archived']);
assert.equal(isActiveAgencyClient(client, agencyId), true);
assert.equal(isActiveAgencyClient(client, otherAgencyId), false, 'cross-tenant client must be rejected');
assert.equal(isActiveAgencyClient({ ...client, status: 'inactive' }, agencyId), false);

const job = {
  id: 200,
  organization_id: agencyId,
  employer_company_id: client.company_id,
  company: 'Fixture Employer',
  is_closed: false,
};
const application = {
  id: 300,
  organization_id: job.organization_id,
  employer_company_id: job.employer_company_id,
  job_id: job.id,
  candidate_id: 400,
  status: 'new',
};

assert.equal(application.organization_id, client.organization_id);
assert.equal(application.employer_company_id, client.company_id);
assert.equal(application.job_id, job.id);
assert.equal(ACTIVE_RECRUITMENT_APPLICATION_STATUSES.includes(application.status), true);
assert.equal(canArchiveAgencyClient({ openJobs: 1, activeApplications: 0 }), false);
assert.equal(canArchiveAgencyClient({ openJobs: 0, activeApplications: 1 }), false);
assert.equal(canArchiveAgencyClient({ openJobs: 0, activeApplications: 0 }), true);

console.log('Agency client → job → application contract: all checks passed');
