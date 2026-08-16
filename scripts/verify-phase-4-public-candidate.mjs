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

const uiFiles = [
  'src/pages/Home.jsx', 'src/pages/Jobs.jsx', 'src/pages/JobDetail.jsx',
  'src/pages/Companies.jsx', 'src/pages/CompanyProfile.jsx', 'src/pages/Notifications.jsx',
  'src/components/layouts/CandidateLayout.jsx', 'src/components/applications/ApplicationTimeline.jsx',
  ...filesIn('src/pages/candidate'), ...filesIn('src/components/home'), ...filesIn('src/components/jobs'),
];
const directLegacyOrTransport = uiFiles.filter(file => {
  const source = read(file);
  return /api\/base44Client|client\/httpClient|\bbase44\.|\b(?:fetch|axios)\s*\(/.test(source);
});
const phase4Services = [
  'publicJobService.ts', 'publicWorkflowService.ts', 'savedJobService.ts', 'candidateProfileService.ts',
  'applicationService.ts', 'interviewService.ts', 'messageService.ts', 'notificationService.ts', 'companyService.ts',
].map(file => `src/api/services/${file}`);
const compatibilityRpc = phase4Services.filter(file => read(file).includes('/functions/'));

const app = read('src/App.jsx');
const jobsController = read('backend/src/modules/jobs/jobs.controller.ts');
const applicationDto = read('backend/src/modules/applications/dto/applications.dto.ts');
const applicationController = read('backend/src/modules/applications/applications.controller.ts');
const rls = read('backend/src/common/utils/rls.utils.ts');
const migration = read('backend/src/migrations/1752400000000-CandidateCanonicalOwnership.ts');
const messageService = read('backend/src/modules/messages/messages.service.ts');
const notifications = read('src/pages/Notifications.jsx');
const messages = read('src/pages/candidate/CandidateMessages.jsx');

assert('Phase 4 UI uses domain services only', directLegacyOrTransport.length === 0, directLegacyOrTransport.join('\n'));
assert('Phase 4 services avoid compatibility RPC', compatibilityRpc.length === 0, compatibilityRpc.join('\n'));
assert('public jobs use a dedicated public controller', jobsController.includes("@Controller('public/jobs')") && jobsController.includes('@Public()'));
assert('candidate application has a typed identity-free submit action', applicationController.includes("@Post('submit')") && applicationDto.includes('SubmitApplicationSchema'));
const submitDto = applicationDto.slice(applicationDto.indexOf('SubmitApplicationSchema'), applicationDto.indexOf('export class SubmitApplicationDto'));
assert('candidate submit DTO excludes browser-authored ownership', !/candidate_email|candidate_id|organization_id|status|source/.test(submitDto));
assert('candidate ownership RLS uses canonical IDs', ['candidate_user_id: userId', 'user_id: userId'].every(value => rls.includes(value)) && !rls.includes('{ candidate_email: email }'));
assert('canonical ownership migration backfills all Phase 4 resources', ['saved_jobs', 'candidate_profiles', 'applications', 'interviews', 'notifications'].every(table => migration.includes(`UPDATE ${table}`)));
assert('messages authorize through application ownership', messageService.includes('applications.findById') || messageService.includes('applicationsService.findById'));
assert('message and notification refresh is explicit polling', /refetchInterval/.test(messages) && /setInterval/.test(notifications));
assert('candidate routes expose recommendations and notifications', app.includes('/candidate/jobs/recommended') && app.includes('/candidate/notifications'));

for (const check of checks) {
  console.log(`${check.passed ? 'PASS' : 'FAIL'} ${check.label}`);
  if (!check.passed && check.details) console.error(check.details);
}
if (checks.some(check => !check.passed)) process.exitCode = 1;
