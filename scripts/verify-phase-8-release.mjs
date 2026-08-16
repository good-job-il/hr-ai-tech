import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const assert = (label, condition, details = '') => checks.push({ label, passed: Boolean(condition), details });

const authDto = read('backend/src/auth/dto/auth.dto.ts');
const authService = read('backend/src/auth/auth.service.ts');
const applicationController = read('backend/src/modules/applications/applications.controller.ts');
const healthController = read('backend/src/common/controllers/health.controller.ts');
const exceptionFilter = read('backend/src/common/filters/http-exception.filter.ts');
const metricsService = read('backend/src/common/monitoring/operational-metrics.service.ts');
const backendPackage = JSON.parse(read('backend/package.json'));
const workflow = read('.github/workflows/legacy-api-boundary.yml');
const apiE2e = read('scripts/verify-phase-8-api.mjs');
const pollingSources = [
  read('src/pages/Notifications.jsx'),
  read('src/components/ats/NotificationCenter.jsx'),
  read('src/components/ats/ActivityTimeline.jsx'),
  read('src/components/admin/ImportProgressMonitor.jsx'),
];
const frontendRuntime = files => files.map(read).join('\n');
const trackedFiles = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' })
  .split('\0')
  .filter(Boolean);
const trackedEnvFiles = trackedFiles.filter(file => /(^|\/)\.env(?:\.|$)/.test(file) && !file.endsWith('.example'));
const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bgh[pousr]_[A-Za-z0-9]{36,}\b/,
  /\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}\b/,
  /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/,
];
const secretHits = trackedFiles.filter(file => {
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) return false;
  const contents = fs.readFileSync(absolute);
  if (contents.includes(0)) return false;
  const text = contents.toString('utf8');
  return secretPatterns.some(pattern => pattern.test(text));
});
const gitHistory = execFileSync('git', ['log', '-p', '--all', '--no-ext-diff', '--unified=0'], {
  cwd: root,
  encoding: 'utf8',
  maxBuffer: 100 * 1024 * 1024,
});
const historySecretHit = secretPatterns.some(pattern => pattern.test(gitHistory));

const registerBlock = authDto.slice(authDto.indexOf('RegisterSchema'), authDto.indexOf('RegisterDto'));
assert('public registration has a closed non-platform role contract',
  registerBlock.includes("'candidate'") && registerBlock.includes("'employer'") && registerBlock.includes("'org_admin'") &&
  !/recruiter|team_manager|admin'\s*,\s*'hr_manager|organization_id/.test(registerBlock) && registerBlock.includes('.strict()'));
assert('public registration derives tenant ownership server-side',
  authService.includes('organization_id: null') && authService.includes('sendPasswordReset') && !authService.includes('Password reset token for'));
assert('unused unscoped pipeline endpoint is absent', !/applications\/pipeline|getPipeline|createStage/.test(applicationController));
assert('health probe checks database and background jobs',
  healthController.includes('SELECT 1') && healthController.includes('background_jobs') && healthController.includes("status: 'ok'"));
assert('HTTP failures emit safe structured monitoring events',
  exceptionFilter.includes("event: 'http_error'") && exceptionFilter.includes('request_id') && !exceptionFilter.includes('request.body'));
assert('operational monitoring covers HTTP, auth, imports and queue retries',
  ['http_4xx', 'http_5xx', 'auth_failures', 'import_failures', 'imports_enqueued', 'queue_retries']
    .every(metric => metricsService.includes(metric)));
assert('backend test and lint runners are installed and non-mutating',
  Boolean(backendPackage.devDependencies?.jest) && Boolean(backendPackage.devDependencies?.['ts-jest']) &&
  backendPackage.scripts?.lint === 'eslint src --max-warnings=0');
assert('no local environment files or high-confidence credentials are tracked',
  trackedEnvFiles.length === 0 && secretHits.length === 0 && !historySecretHit,
  `env=${trackedEnvFiles.join(',')} secrets=${secretHits.join(',')} history=${historySecretHit}`);
assert('vulnerable spreadsheet parser is replaced and production audit is a release gate',
  !backendPackage.dependencies?.xlsx && Boolean(backendPackage.dependencies?.exceljs) &&
  workflow.includes('Production dependency security gate'));
assert('API E2E covers contracts, tenants, workflows, files, jobs and CORS',
  ['OpenAPI', 'cross-tenant', 'assign-candidate', "'hired'", 'organizations/${orgOne.id}/enter',
    'PHASE8_MAIL_URL', 'waitForJob(failingJob.id, agencyOne.access_token, 3)', 'monitoring.import_failures', 'FormData', 'access-control-allow-origin']
    .every(value => apiE2e.includes(value)));
assert('polling failure paths preserve the page, expose errors and clean up timers',
  pollingSources.every(source => source.includes('setInterval') && source.includes('clearInterval') && /\bcatch\b/.test(source)) &&
  pollingSources.every(source => !/catch\s*\([^)]*\)\s*=>\s*\{\s*\}/.test(source)));
assert('frontend runtime has no SSE or WebSocket dependency to fail over from',
  !/\b(?:EventSource|WebSocket)\s*\(/.test(frontendRuntime(trackedFiles.filter(file => /^src\/.*\.(?:js|jsx|ts|tsx)$/.test(file) && fs.existsSync(path.join(root, file))))));
assert('CI installs dependencies and runs fresh DB/API release gates',
  workflow.includes('npm ci') && workflow.includes('mysql:8.0') && workflow.includes('migration:run') &&
  workflow.includes('test:phase-8-upgrade') && workflow.includes('fake-smtp-server') &&
  workflow.includes('deny-legacy-platform-network') && workflow.includes('test:phase-8-api') && workflow.includes('backend test'));

for (const check of checks) {
  console.log(`${check.passed ? 'PASS' : 'FAIL'} ${check.label}`);
  if (!check.passed && check.details) console.error(check.details);
}
if (checks.some(check => !check.passed)) process.exitCode = 1;
