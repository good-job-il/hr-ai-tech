import { agencyClientService } from '../../src/api/services/agencyClientService';
import { applicationService } from '../../src/api/services/applicationService';
import { candidateService } from '../../src/api/services/candidateService';
import { jobService } from '../../src/api/services/jobService';
import { queryKeys } from '../../src/api/queryKeys';
import { authService } from '../../src/api/services/authService';
import { organizationService } from '../../src/api/services/organizationService';
import { userService } from '../../src/api/services/userService';
import { auditService } from '../../src/api/services/auditService';
import { permissionMatrixService, roleTemplateService } from '../../src/api/services/permissionService';
import { taxonomyService } from '../../src/api/services/taxonomyService';
import { publicJobService } from '../../src/api/services/publicJobService';
import { publicWorkflowService } from '../../src/api/services/publicWorkflowService';
import { savedJobService } from '../../src/api/services/savedJobService';
import { candidateProfileService } from '../../src/api/services/candidateProfileService';
import { messageService } from '../../src/api/services/messageService';
import { notificationService } from '../../src/api/services/notificationService';
import { companyService } from '../../src/api/services/companyService';
import { compensationPlanService } from '../../src/api/services/compensationPlanService';
import { communicationService } from '../../src/api/services/communicationService';
import { interviewService } from '../../src/api/services/interviewService';
import { candidateImportService } from '../../src/api/services/candidateImportService';
import { importSourceService } from '../../src/api/services/importSourceService';
import { salaryService } from '../../src/api/services/salaryService';

jobService.list({ organization_id: 1, is_closed: false, order: 'DESC' });
candidateService.list({ recruiter_id: 2, review_required: true });
applicationService.list({ candidate_email: 'candidate@example.com', status: 'new' });
agencyClientService.list({ status: 'active', industry: 'technology' });

jobService.create({ title: 'Engineer', company: 'Example', type: 'full' });
candidateService.create({ full_name: 'Candidate', status: 'new' });
applicationService.create({ job_id: 1, candidate_name: 'Candidate', candidate_email: 'candidate@example.com' });
agencyClientService.create({ name: 'Client', status: 'active' });

authService.register({ email: 'candidate@example.com', password: 'password', full_name: 'Candidate', role: 'candidate' });
// @ts-expect-error public registration cannot mint a platform administrator
authService.register({ email: 'admin@example.com', password: 'password', full_name: 'Admin', role: 'admin' });
authService.updateMe({ org_type: 'staffing_agency', profile_completed: true });
organizationService.list({ org_type: 'organization', status: 'active', sort: 'name' });
organizationService.create({ name: 'Tenant', org_type: 'organization', plan: 'pro' });
userService.create({ email: 'user@example.com', password: 'password', full_name: 'User', role: 'candidate' });
permissionMatrixService.create({ role_key: 'recruiter', permissions: { view: true } });
roleTemplateService.update(1, { display_name: 'Recruiter' });
auditService.create({ entity_type: 'Organization', entity_id: 1, action: 'permission_update' });
taxonomyService.roles(1);
publicJobService.list({ search: 'engineer', sort: 'views' });
publicWorkflowService.searchJobs({ query: 'engineer', filters: { type: ['full'] } });
savedJobService.save({ job_id: 1, job_title: 'Engineer' });
candidateProfileService.create({ full_name: 'Candidate', is_open_to_work: true });
candidateProfileService.update({ title: 'Engineer' });
applicationService.submit({ job_id: 1, candidate_name: 'Candidate', resume_url: '/files/resume.pdf' });
messageService.send(1, 'Hello');
notificationService.list({ type: 'message', is_read: false });
companyService.createReview(1, { rating_overall: 5, pros: 'Team' });
userService.invite({ email: 'recruiter@example.com', full_name: 'Recruiter', role: 'internal_recruiter' });
applicationService.assignCandidate(1, 2);
applicationService.updateStatus(1, 'reviewed');
interviewService.create({ application_id: 1, candidate_name: 'Candidate', date: '2026-08-14', time: '10:00' });
compensationPlanService.create({ client_name: 'Client', total_fee: 10_000 });
communicationService.create({ candidate_id: 2, channel: 'whatsapp', content: 'Follow-up' });
communicationService.presentCandidate(2, 1, 'Strong fit');
candidateImportService.create({ batch_name: 'August import', file_type: 'csv', source_file: 'candidates.csv' });
candidateImportService.queueFileImport(1, 'http://localhost:3001/uploads/candidates.csv', 'candidates.csv');
candidateImportService.createBulk([{ full_name: 'Candidate', email: 'candidate@example.com' }], 1);
importSourceService.queueRun(1);
salaryService.list({ category: 'Engineering' });

queryKeys.jobs.list({ domain_id: 1 });
queryKeys.candidates.detail(1);

// @ts-expect-error unknown filters must be rejected
jobService.list({ arbitrary_backend_field: 'unsafe' });
// @ts-expect-error backend accepts uppercase order only
candidateService.list({ order: 'desc' });
// @ts-expect-error create contract requires title and company
jobService.create({ is_closed: false });
// @ts-expect-error candidate status is a closed enum
candidateService.updateStatus(1, 'screening');
// @ts-expect-error browser may not author tenant ownership
applicationService.create({ job_id: 1, candidate_name: 'Candidate', candidate_email: 'candidate@example.com', organization_id: 9 });
// @ts-expect-error archived is a backend-owned transition
agencyClientService.create({ name: 'Client', status: 'archived' });
// @ts-expect-error AgencyClient DTO does not accept arbitrary sorting
agencyClientService.list({ sort: 'name' });
// @ts-expect-error register roles mirror the backend enum
authService.register({ email: 'x@example.com', password: 'password', full_name: 'X', role: 'superadmin' });
// @ts-expect-error profile update cannot change authorization role
authService.updateMe({ role: 'admin' });
// @ts-expect-error organization filters are closed over the NestJS query DTO
organizationService.list({ owner_email: 'unsafe@example.com' });
// @ts-expect-error organization plan is a closed enum
organizationService.update(1, { plan: 'unlimited' });
// @ts-expect-error user creation requires password
userService.create({ email: 'user@example.com', full_name: 'User' });
// @ts-expect-error audit actor is derived from JWT on the backend
auditService.create({ entity_type: 'User', entity_id: 1, action: 'update', actor_email: 'spoof@example.com' });
// @ts-expect-error audit entity ID mirrors the integer backend column
auditService.create({ entity_type: 'Organization', entity_id: 'global', action: 'update' });
// @ts-expect-error role template endpoint has no sort query
roleTemplateService.list({ sort: 'hierarchy_level' });
// @ts-expect-error audit controller has no detail/update route
auditService.update(1, { action: 'update' });
// @ts-expect-error permission matrix controller has no detail route
permissionMatrixService.get(1);
// @ts-expect-error public job query cannot select a tenant
publicJobService.list({ organization_id: 9 });
// @ts-expect-error matching filters are a closed contract
publicWorkflowService.searchJobs({ query: 'engineer', filters: { arbitrary: true } });
// @ts-expect-error saved-job ownership is derived from JWT
savedJobService.save({ job_id: 1, user_email: 'spoof@example.com' });
// @ts-expect-error profile ownership is derived from JWT
candidateProfileService.create({ full_name: 'Candidate', user_email: 'spoof@example.com' });
// @ts-expect-error candidate submit identity is derived from JWT
applicationService.submit({ job_id: 1, candidate_name: 'Candidate', candidate_email: 'spoof@example.com' });
// @ts-expect-error message sender is derived from JWT
messageService.send(1, { content: 'Hello', sender_email: 'spoof@example.com' });
// @ts-expect-error notification recipient filters are forbidden
notificationService.list({ recipient_email: 'other@example.com' });
// @ts-expect-error review identity is derived from JWT
companyService.createReview(1, { rating_overall: 5, reviewer_email: 'spoof@example.com' });
// @ts-expect-error organization-member invite cannot assign platform roles
userService.invite({ email: 'admin2@example.com', full_name: 'Admin', role: 'admin' });
// @ts-expect-error assignment accepts canonical IDs only
applicationService.assignCandidate(1, 'candidate@example.com');
// @ts-expect-error application status is a closed workflow enum
applicationService.updateStatus(1, 'screening');
// @ts-expect-error interview candidate ownership is resolved from application
interviewService.create({ application_id: 1, candidate_name: 'Candidate', candidate_email: 'spoof@example.com', date: '2026-08-14', time: '10:00' });
// @ts-expect-error compensation tenant ownership is derived from JWT
compensationPlanService.create({ client_name: 'Client', organization_id: 9 });
// @ts-expect-error communication sender identity is derived from JWT
communicationService.create({ candidate_id: 2, channel: 'whatsapp', content: 'Hi', sender_email: 'spoof@example.com' });
// @ts-expect-error import batch tenant is derived from JWT
candidateImportService.create({ batch_name: 'Unsafe', file_type: 'csv', organization_id: 9 });
// @ts-expect-error background import accepts an uploaded URL, not an arbitrary payload
candidateImportService.queueFileImport(1, { file_url: 'https://example.com/file.csv' });
// @ts-expect-error bulk candidate ownership is server-owned
candidateImportService.createBulk([{ full_name: 'Candidate', organization_id: 9 }], 1);
