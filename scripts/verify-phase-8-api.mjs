import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.PHASE8_API_URL || 'http://127.0.0.1:3011/api';
const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const password = 'Phase8-Strong-Pass-123!';
const adminEmail = process.env.PHASE8_ADMIN_EMAIL || 'phase8-admin@example.test';
const adminPassword = process.env.PHASE8_ADMIN_PASSWORD || 'Phase8-Admin-Pass-123!';
const mailUrl = process.env.PHASE8_MAIL_URL || 'http://127.0.0.1:2526/messages';

async function request(path, { method = 'GET', token, body, expected = [200] } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  const json = text ? JSON.parse(text) : null;
  if (!expected.includes(response.status)) {
    throw new Error(`${method} ${path}: expected ${expected.join('/')} but received ${response.status}: ${text}`);
  }
  assert.ok(response.headers.get('x-request-id'), `${method} ${path}: X-Request-Id missing`);
  return { response, body: json, data: json?.data };
}

async function register(email, role = 'candidate') {
  const result = await request('/auth/register', {
    method: 'POST',
    expected: [201],
    body: { email, password, full_name: `Phase 8 ${role}`, phone: '+972500000000', role },
  });
  assert.equal(result.data.user.email, email);
  assert.equal(result.data.user.role, role);
  assert.ok(result.data.access_token);
  assert.ok(result.data.refresh_token);
  assert.equal('password_hash' in result.data.user, false);
  return result.data;
}

async function login(email) {
  return (await request('/auth/login', {
    method: 'POST',
    body: { email, password },
  })).data;
}

async function waitForMail(predicate) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const response = await fetch(mailUrl);
    assert.equal(response.status, 200, 'SMTP fixture messages endpoint is unavailable');
    const { messages } = await response.json();
    const matched = messages.find(predicate);
    if (matched) return matched;
    await delay(200);
  }
  throw new Error('Expected transactional email was not delivered to the SMTP fixture');
}

const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

async function waitForJob(id, token, minimumAttempts) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const job = (await request(`/background-jobs/${id}`, { token })).data;
    if (job.attempts >= minimumAttempts && ['completed', 'failed', 'pending'].includes(job.status)) return job;
    await delay(500);
  }
  throw new Error(`Background job ${id} did not reach attempt ${minimumAttempts}`);
}

const openApiResponse = await fetch(`${baseUrl}/docs-json`);
assert.equal(openApiResponse.status, 200);
const openApi = await openApiResponse.json();
for (const path of [
  '/api/auth/register', '/api/auth/login', '/api/auth/refresh', '/api/auth/me',
  '/api/public/jobs', '/api/jobs', '/api/candidates', '/api/applications/submit',
  '/api/organizations/onboard-agency', '/api/auth/organizations/{id}/enter',
  '/api/files', '/api/health',
]) assert.ok(openApi.paths[path], `OpenAPI path missing: ${path}`);
assert.equal(openApi.paths['/api/functions/{name}'], undefined);
assert.equal(openApi.paths['/api/applications/pipeline/{employerId}'], undefined);
assert.deepEqual(openApi.components.schemas.RegisterDto.properties.role.enum, ['candidate', 'employer', 'org_admin']);
assert.ok(openApi.components.schemas.RegisterDto.required.includes('email'));
assert.ok(openApi.components.schemas.ChangeApplicationStatusDto.properties.status.enum.includes('hired'));
assert.equal(
  openApi.paths['/api/applications/{id}/status'].patch.requestBody.content['application/json'].schema.$ref,
  '#/components/schemas/ChangeApplicationStatusDto',
);
assert.ok(openApi.paths['/api/applications/{id}/status'].patch.security.some(item => 'bearer' in item));
console.log('PASS OpenAPI exposes required domain endpoints and no generic compatibility routes');

const health = await request('/health');
assert.equal(health.data.status, 'ok');
assert.equal(health.data.database, 'ok');
assert.equal(typeof health.data.background_jobs, 'object');
await request('/public/jobs');
await request('/auth/me', { expected: [401] });
await request('/auth/register', {
  method: 'POST', expected: [422],
  body: { email: `admin-${runId}@example.com`, password, full_name: 'No Admin', role: 'admin' },
});
await request('/auth/register', {
  method: 'POST', expected: [422],
  body: { email: `tenant-${runId}@example.com`, password, full_name: 'No Tenant', organization_id: 999 },
});
console.log('PASS unauthenticated and browser-authored privilege boundaries');

const admin = (await request('/auth/login', {
  method: 'POST', body: { email: adminEmail, password: adminPassword },
})).data;
assert.equal(admin.user.role, 'admin');

const employerOrg = (await request('/organizations', {
  method: 'POST', token: admin.access_token, expected: [201],
  body: { name: `Phase 8 Employer Org ${runId}`, org_type: 'organization' },
})).data;
const employerCompany = (await request('/companies', {
  method: 'POST', token: admin.access_token, expected: [201],
  body: { name: `Phase 8 Employer Company ${runId}`, industry: 'Technology' },
})).data;
const unrelatedCompany = (await request('/companies', {
  method: 'POST', token: admin.access_token, expected: [201],
  body: { name: `Phase 8 Unrelated Company ${runId}`, industry: 'Finance' },
})).data;
const employerEmail = `employer-${runId}@example.com`;
const employerRecord = (await request('/users', {
  method: 'POST', token: admin.access_token, expected: [201],
  body: { email: employerEmail, password, full_name: 'Phase 8 Employer', role: 'employer', organization_id: employerOrg.id },
})).data;
await request(`/users/${employerRecord.id}`, {
  method: 'PATCH', token: admin.access_token,
  body: { employer_company_id: employerCompany.id, org_type: 'organization' },
});
const employer = await login(employerEmail);
assert.equal(employer.user.employer_company_id, employerCompany.id);
await request('/jobs', {
  method: 'POST', token: employer.access_token, expected: [403],
  body: { title: 'Cross-company spoof', company: 'Spoofed', employer_company_id: unrelatedCompany.id },
});
const employerJob = (await request('/jobs', {
  method: 'POST', token: employer.access_token, expected: [201],
  body: {
    title: `Phase 8 Employer Engineer ${runId}`,
    company: 'Browser supplied employer name', employer_company_id: employerCompany.id,
    location: 'Haifa', contact_email: employerEmail,
  },
})).data;
assert.equal(employerJob.employer_company_id, employerCompany.id);
assert.equal(employerJob.company, employerCompany.name);
await request('/users', { token: employer.access_token, expected: [403] });
console.log('PASS employer identity, company ownership and job workflow');

const agencyOneEmail = `agency-one-${runId}@example.com`;
let agencyOne = await register(agencyOneEmail, 'org_admin');
const orgOne = (await request('/organizations/onboard-agency', {
  method: 'POST', token: agencyOne.access_token, expected: [201],
  body: { name: `Phase 8 Agency One ${runId}`, contact_email: agencyOneEmail },
})).data;
agencyOne = await login(agencyOneEmail);
assert.equal(agencyOne.user.organization_id, orgOne.id);

const candidateRecord = (await request('/candidates', {
  method: 'POST', token: agencyOne.access_token, expected: [201],
  body: { full_name: 'Scoped Candidate One', email: `pool-${runId}@example.com`, source: 'manual' },
})).data;
const agencyClient = (await request('/agency-clients', {
  method: 'POST', token: agencyOne.access_token, expected: [201],
  body: { name: `Phase 8 Client ${runId}`, status: 'active', contact_email: `client-${runId}@example.com` },
})).data;
const clientEmployerEmail = `client-employer-${runId}@example.com`;
const clientEmployerRecord = (await request('/users', {
  method: 'POST', token: admin.access_token, expected: [201],
  body: { email: clientEmployerEmail, password, full_name: 'Phase 8 Client Employer', role: 'employer', organization_id: orgOne.id },
})).data;
await request(`/users/${clientEmployerRecord.id}`, {
  method: 'PATCH', token: admin.access_token,
  body: { employer_company_id: agencyClient.company_id, org_type: 'organization' },
});
const clientEmployer = await login(clientEmployerEmail);
const job = (await request('/jobs', {
  method: 'POST', token: agencyOne.access_token, expected: [201],
  body: {
    title: `Phase 8 Engineer ${runId}`,
    company: 'Browser supplied name must be replaced',
    employer_company_id: agencyClient.company_id,
    location: 'Tel Aviv',
  },
})).data;
assert.equal(job.organization_id, orgOne.id);
assert.equal(job.employer_company_id, agencyClient.company_id);
assert.notEqual(job.company, 'Browser supplied name must be replaced');

const assignedOnce = (await request('/applications/assign-candidate', {
  method: 'POST', token: agencyOne.access_token, expected: [201],
  body: { job_id: job.id, candidate_id: candidateRecord.id },
})).data;
const assignedTwice = (await request('/applications/assign-candidate', {
  method: 'POST', token: agencyOne.access_token, expected: [201],
  body: { job_id: job.id, candidate_id: candidateRecord.id },
})).data;
assert.equal(assignedOnce.id, assignedTwice.id);
const score = (await request(`/applications/${assignedOnce.id}/score`, {
  method: 'POST', token: agencyOne.access_token,
})).data;
assert.equal(typeof score.score, 'number');
const scoreAgain = (await request(`/applications/${assignedOnce.id}/score`, {
  method: 'POST', token: agencyOne.access_token,
})).data;
assert.equal(scoreAgain.score, score.score);
for (const status of ['reviewed', 'phone_interview', 'recommended', 'employer_interview', 'offer', 'hired']) {
  const transitioned = (await request(`/applications/${assignedOnce.id}/status`, {
    method: 'PATCH', token: agencyOne.access_token, body: { status },
  })).data;
  assert.equal(transitioned.status, status);
}
const clientApplications = await request(`/applications?job_id=${job.id}`, { token: clientEmployer.access_token });
assert.equal(clientApplications.data.find(item => item.id === assignedOnce.id)?.status, 'hired');
await request(`/applications/${assignedOnce.id}/status`, {
  method: 'PATCH', token: employer.access_token, expected: [404], body: { status: 'rejected' },
});
const timeline = await request(`/applications/${assignedOnce.id}/timeline`, { token: agencyOne.access_token });
assert.ok(timeline.data.some(item => item.new_value === 'hired'));
console.log('PASS agency client → job → candidate → pipeline → hire, duplicate assignment and stable AI score');

const workspace = (await request(`/auth/organizations/${orgOne.id}/enter`, {
  method: 'POST', token: admin.access_token,
})).data;
const workspaceMe = (await request('/auth/me', { token: workspace.access_token })).data;
assert.equal(workspaceMe.organization_id, orgOne.id);
assert.equal(workspaceMe.impersonating, true);
const workspaceCandidates = await request('/candidates', { token: workspace.access_token });
assert.ok(workspaceCandidates.data.some(item => item.id === candidateRecord.id));
await request('/organizations', {
  method: 'POST', token: workspace.access_token, expected: [403],
  body: { name: 'Forbidden from workspace', org_type: 'organization' },
});
await request('/auth/organizations/exit', { method: 'POST', token: workspace.access_token });
console.log('PASS platform admin enter/exit workspace is tenant-scoped and mutation-restricted');

const agencyTwoEmail = `agency-two-${runId}@example.com`;
let agencyTwo = await register(agencyTwoEmail, 'org_admin');
const orgTwo = (await request('/organizations/onboard-agency', {
  method: 'POST', token: agencyTwo.access_token, expected: [201],
  body: { name: `Phase 8 Agency Two ${runId}`, contact_email: agencyTwoEmail },
})).data;
agencyTwo = await login(agencyTwoEmail);
assert.notEqual(orgOne.id, orgTwo.id);

await request(`/organizations/${orgOne.id}`, { token: agencyTwo.access_token, expected: [403] });
await request(`/candidates/${candidateRecord.id}`, { token: agencyTwo.access_token, expected: [404] });
const crossTenantList = await request(`/candidates?organization_id=${orgOne.id}`, { token: agencyTwo.access_token });
assert.deepEqual(crossTenantList.data, []);
console.log('PASS organization and candidate cross-tenant isolation');

const candidateEmail = `candidate-${runId}@example.com`;
const candidate = await register(candidateEmail);
await request('/users', { token: candidate.access_token, expected: [403] });
await request('/jobs', {
  method: 'POST', token: candidate.access_token, expected: [403],
  body: { title: 'Forbidden job', company: 'Forbidden company' },
});
const publicJobs = await request(`/public/jobs?search=${encodeURIComponent(runId)}`);
assert.ok(publicJobs.data.some(item => item.id === job.id));

const profile = (await request('/candidates/profiles', {
  method: 'POST', token: candidate.access_token, expected: [201],
  body: { full_name: 'Phase 8 Candidate', is_open_to_work: true },
})).data;
assert.equal(profile.user_id, candidate.user.id);

const application = (await request('/applications/submit', {
  method: 'POST', token: candidate.access_token, expected: [201],
  body: { job_id: job.id, candidate_name: 'Ignored browser candidate name' },
})).data;
assert.equal(application.candidate_user_id, candidate.user.id);
assert.equal(application.candidate_email, candidateEmail);
assert.equal(application.organization_id, orgOne.id);

const employerApplication = (await request('/applications/submit', {
  method: 'POST', token: candidate.access_token, expected: [201],
  body: { job_id: employerJob.id },
})).data;
const employerApplications = await request(`/applications?job_id=${employerJob.id}`, { token: employer.access_token });
assert.ok(employerApplications.data.some(item => item.id === employerApplication.id));
await request(`/applications/${employerApplication.id}/status`, {
  method: 'PATCH', token: employer.access_token, body: { status: 'reviewed' },
});
await request(`/applications/${employerApplication.id}`, { token: clientEmployer.access_token, expected: [404] });

const agencyApplications = await request(`/applications?job_id=${job.id}`, { token: agencyOne.access_token });
assert.ok(agencyApplications.data.some(item => item.id === application.id));
const otherAgencyApplications = await request(`/applications?job_id=${job.id}`, { token: agencyTwo.access_token });
assert.deepEqual(otherAgencyApplications.data, []);

await request(`/applications/${application.id}/status`, {
  method: 'PATCH', token: agencyOne.access_token,
  body: { status: 'reviewed' },
});
const candidateApplications = await request('/applications', { token: candidate.access_token });
assert.equal(candidateApplications.data.find(item => item.id === application.id)?.status, 'reviewed');

const saved = (await request('/jobs/saved', {
  method: 'POST', token: candidate.access_token, expected: [201],
  body: { job_id: job.id, job_title: job.title, company: job.company },
})).data;
assert.equal(saved.user_id, candidate.user.id);
await request('/jobs/alerts', {
  method: 'POST', token: candidate.access_token, expected: [201],
  body: { keywords: runId, frequency: 'weekly' },
});
await request('/applications/pipeline/arbitrary-employer', { token: candidate.access_token, expected: [404] });
console.log('PASS candidate workflow, canonical ownership and removed pipeline surface');

await request('/auth/forgot-password', {
  method: 'POST', body: { email: candidateEmail },
});
await waitForMail(message => message.includes(candidateEmail) && message.includes('Reset your Hire Israel password'));
await waitForMail(message => message.includes(employerEmail) && /New(?:_| )application/.test(message));
await waitForMail(message => message.includes(candidateEmail) && /Application(?:_| )received/.test(message));
console.log('PASS transactional application and password-reset email delivery through SMTP');

const form = new FormData();
form.set('file', new Blob([
  `full_name,email\nImported Phase 8 Candidate,imported-${runId}@example.com\n`,
], { type: 'text/csv' }), `phase8-${runId}.csv`);
const uploadResponse = await fetch(`${baseUrl}/files`, {
  method: 'POST',
  headers: { authorization: `Bearer ${agencyOne.access_token}` },
  body: form,
});
assert.equal(uploadResponse.status, 201);
const uploaded = (await uploadResponse.json()).data;
assert.ok(uploaded.file_url.startsWith('http://localhost:3011/uploads/'));
const downloaded = await fetch(uploaded.file_url);
assert.equal(downloaded.status, 200);
assert.ok((await downloaded.text()).includes('Imported Phase 8 Candidate'));

const batch = (await request('/candidates/import-batches', {
  method: 'POST', token: agencyOne.access_token, expected: [201],
  body: { batch_name: `Phase 8 ${runId}`, source_file: uploaded.file_url, file_type: 'csv', total_records: 1 },
})).data;
const queuePayload = {
  file_url: uploaded.file_url,
  file_name: uploaded.filename,
  idempotency_key: `phase8-${runId}`,
};
const queuedOnce = (await request(`/candidate-imports/batches/${batch.id}/run`, {
  method: 'POST', token: agencyOne.access_token, expected: [202], body: queuePayload,
})).data;
const queuedTwice = (await request(`/candidate-imports/batches/${batch.id}/run`, {
  method: 'POST', token: agencyOne.access_token, expected: [202], body: queuePayload,
})).data;
assert.equal(queuedOnce.id, queuedTwice.id);
await request(`/background-jobs/${queuedOnce.id}`, { token: agencyTwo.access_token, expected: [404] });
const firstRun = await waitForJob(queuedOnce.id, agencyOne.access_token, 1);
assert.ok(['completed', 'failed', 'pending'].includes(firstRun.status));
const retried = (await request(`/candidate-imports/batches/${batch.id}/retry`, {
  method: 'POST', token: agencyOne.access_token, expected: [202],
})).data;
assert.equal(retried.id, queuedOnce.id);
const secondRun = await waitForJob(queuedOnce.id, agencyOne.access_token, 1);
assert.ok(['completed', 'failed', 'pending'].includes(secondRun.status));

const failingBatch = (await request('/candidates/import-batches', {
  method: 'POST', token: agencyOne.access_token, expected: [201],
  body: { batch_name: `Phase 8 failing ${runId}`, source_file: uploaded.file_url, file_type: 'csv', total_records: 1 },
})).data;
const missingFile = new URL(uploaded.file_url);
missingFile.pathname = `${missingFile.pathname.slice(0, missingFile.pathname.lastIndexOf('/') + 1)}missing-${runId}.csv`;
const missingFileUrl = missingFile.toString();
const failingJob = (await request(`/candidate-imports/batches/${failingBatch.id}/run`, {
  method: 'POST', token: agencyOne.access_token, expected: [202],
  body: { file_url: missingFileUrl, file_name: `missing-${runId}.csv`, idempotency_key: `phase8-failure-${runId}` },
})).data;
const exhausted = await waitForJob(failingJob.id, agencyOne.access_token, 3);
assert.equal(exhausted.status, 'failed');
assert.ok(exhausted.error);
const manuallyRetried = (await request(`/candidate-imports/batches/${failingBatch.id}/retry`, {
  method: 'POST', token: agencyOne.access_token, expected: [202],
})).data;
assert.equal(manuallyRetried.status, 'pending');
await waitForJob(failingJob.id, agencyOne.access_token, 1);
const uploadPath = path.join(process.cwd(), 'backend', 'uploads', new URL(uploaded.file_url).pathname.split('/').pop());
await fs.unlink(uploadPath);
console.log('PASS file upload/download, queue idempotency, tenant isolation and retry lifecycle');

const refreshed = (await request('/auth/refresh', {
  method: 'POST', body: { refresh_token: candidate.refresh_token },
})).data;
assert.ok(refreshed.access_token && refreshed.refresh_token);
await request('/auth/logout', { method: 'POST', token: refreshed.access_token });
await request('/auth/refresh', {
  method: 'POST', expected: [401], body: { refresh_token: refreshed.refresh_token },
});
await request('/auth/login', {
  method: 'POST', expected: [401], body: { email: candidateEmail, password: 'wrong-password' },
});
console.log('PASS login, refresh rotation and logout revocation');

const cors = await fetch(`${baseUrl}/public/jobs`, {
  method: 'OPTIONS',
  headers: { origin: 'https://attacker.invalid', 'access-control-request-method': 'GET' },
});
assert.equal(cors.headers.get('access-control-allow-origin'), null);
console.log('PASS untrusted browser origin is not granted CORS access');

const finalHealth = await request('/health');
assert.ok(finalHealth.data.monitoring.http_4xx >= 1);
assert.ok(finalHealth.data.monitoring.auth_failures >= 1);
assert.ok(finalHealth.data.monitoring.imports_enqueued >= 2);
assert.ok(finalHealth.data.monitoring.import_failures >= 1);
assert.ok(finalHealth.data.monitoring.queue_retries >= 1);
assert.equal(finalHealth.data.monitoring.http_5xx, 0);
console.log('PASS operational monitoring covers HTTP, auth, imports, queues and zero unexpected 5xx');

console.log('Phase 8 API E2E passed');
