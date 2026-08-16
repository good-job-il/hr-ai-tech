import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checks = [];
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const filesIn = relative => fs.readdirSync(path.join(root, relative), { withFileTypes: true })
  .flatMap(entry => entry.isDirectory() ? filesIn(path.join(relative, entry.name)) : [path.join(relative, entry.name)])
  .filter(file => /\.(js|jsx|ts|tsx)$/.test(file));
const assert = (label, condition, details = '') => checks.push({ label, passed: Boolean(condition), details });

const activeB2bUi = [
  ...filesIn('src/pages/agency'), ...filesIn('src/pages/company'), ...filesIn('src/pages/recruitment'),
  ...filesIn('src/pages/ai'), ...filesIn('src/pages/recruiter'), ...filesIn('src/components/ats'),
  ...filesIn('src/components/crm'), ...filesIn('src/components/employer'), ...filesIn('src/components/interviews'),
  'src/pages/admin/ManageJobsPage.jsx', 'src/pages/admin/CompensationPage.jsx', 'src/pages/admin/ImportDashboard.jsx',
  'src/pages/employer/EmployerDashboard.jsx', 'src/pages/employer/EmployerAnalyticsPage.jsx', 'src/pages/employer/EmployerSettingsPage.jsx',
  'src/hooks/usePipelineData.js', 'src/hooks/useCandidateCRM.js',
];
const violations = activeB2bUi.filter(file => {
  const source = read(file);
  return /api\/base44Client|client\/httpClient|\bbase44\.|\/functions\/|\b(?:fetch|axios)\s*\(/.test(source);
});
const hiddenErrors = activeB2bUi.filter(file => /\.catch\(\(\)\s*=>\s*\[\]\)/.test(read(file)));

const applicationController = read('backend/src/modules/applications/applications.controller.ts');
const applicationService = read('backend/src/modules/applications/applications.service.ts');
const userController = read('backend/src/modules/users/users.controller.ts');
const userService = read('backend/src/modules/users/users.service.ts');
const communicationDto = read('backend/src/modules/communication/dto/communication.dto.ts');
const communicationService = read('backend/src/modules/communication/communication.service.ts');
const candidateDto = read('backend/src/modules/candidates/dto/candidates.dto.ts');
const compensationDto = read('backend/src/modules/compensation/dto/compensation.dto.ts');
const pipelineHook = read('src/hooks/usePipelineData.js');

assert('active Employer/Agency/CRM UI uses domain services only', violations.length === 0, violations.join('\n'));
assert('B2B routes do not mask API failures with empty arrays', hiddenErrors.length === 0, hiddenErrors.join('\n'));
assert('pipeline uses an explicit backend status transition', applicationController.includes("@Patch(':id/status')") && pipelineHook.includes('applicationService.updateStatus'));
assert('AI matching assigns by canonical job/candidate IDs', applicationController.includes("@Post('assign-candidate')") && applicationService.includes('assignCandidate'));
assert('organization members use a scoped invite action', userController.includes("@Post('invite')") && userService.includes('organization_id: organizationId'));
assert('organization admins cannot create platform identities', userService.includes("dto.role === UserRole.ADMIN") && userService.includes("dto.role === UserRole.ORG_ADMIN"));
assert('organization member updates are administrator-scoped',
  /@Patch\(':id'\)[\s\S]*?@Roles\(UserRole\.ADMIN, UserRole\.ORG_ADMIN\)/.test(userController) &&
  userService.includes('Organization administrators cannot manage administrator accounts'));
const communicationCreate = communicationDto.slice(communicationDto.indexOf('CreateCommunicationLogSchema'), communicationDto.indexOf('QueryCommunicationLogsSchema'));
assert('communication sender and tenant are backend-owned', !/sender_email|sender_name|organization_id|candidate_email/.test(communicationCreate) && communicationService.includes('sender_email: user.email'));
const candidateNote = candidateDto.slice(candidateDto.indexOf('CreateCandidateNoteSchema'), candidateDto.indexOf('UpdateCandidateNoteSchema'));
assert('candidate CRM author identity is backend-owned', !/author_email|author_name|author_role|candidate_email/.test(candidateNote));
const compensationCreate = compensationDto.slice(compensationDto.indexOf('CreateCompensationPlanSchema'), compensationDto.indexOf('UpdateCompensationPlanSchema'));
assert('compensation tenant ownership is backend-owned', !compensationCreate.includes('organization_id'));

for (const check of checks) {
  console.log(`${check.passed ? 'PASS' : 'FAIL'} ${check.label}`);
  if (!check.passed && check.details) console.error(check.details);
}
if (checks.some(check => !check.passed)) process.exitCode = 1;
