import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checks = [];
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const assert = (label, condition, details = '') => checks.push({ label, passed: Boolean(condition), details });

const sourceFiles = [];
const walk = directory => {
  for (const entry of fs.readdirSync(path.join(root, directory), { withFileTypes: true })) {
    const relative = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(relative);
    else if (/\.(?:js|jsx|ts|tsx)$/.test(entry.name)) sourceFiles.push(relative);
  }
};
walk('src');

const forbidden = [];
for (const file of sourceFiles) {
  const source = read(file);
  if (/functions\.invoke|integrations\.Core|\/functions\/|\/integrations\/(?:upload|invoke-llm)|InvokeLLM/.test(source)) forbidden.push(file);
}

const operations = read('backend/src/modules/functions/domain-operations.controller.ts');
const jobs = read('backend/src/modules/functions/services/background-jobs.service.ts');
const jobEntity = read('backend/src/modules/functions/entities/background-job.entity.ts');
const migration = read('backend/src/migrations/1752500000000-BackgroundJobs.ts');
const crawler = read('backend/src/modules/functions/services/job-crawler.service.ts');
const ownedFiles = read('backend/src/common/utils/owned-file-url.util.ts');
const importService = read('backend/src/modules/functions/services/import.service.ts');
const resumeService = read('backend/src/modules/functions/services/resume-extraction.service.ts');
const importDto = read('backend/src/modules/functions/dto/functions.dto.ts');
const candidateController = read('backend/src/modules/candidates/candidates.controller.ts');
const candidateService = read('backend/src/modules/candidates/candidates.service.ts');
const integrationModule = read('backend/src/modules/integrations/integrations.module.ts');

assert('frontend has no string-based RPC or compatibility integration calls', forbidden.length === 0, forbidden.join('\n'));
assert('legacy compatibility shim is physically absent', !fs.existsSync(path.join(root, 'src/api/base44Client.js')));
assert('compatibility controllers are physically removed',
  !fs.existsSync(path.join(root, 'backend/src/modules/functions/functions.controller.ts')) &&
  !fs.existsSync(path.join(root, 'backend/src/modules/integrations/integrations.controller.ts')));
assert('domain endpoints replace analytics, scoring, imports and source runs',
  ['analytics/dashboard', "applications/:id/score", 'candidate-imports/batches/:id/run', 'candidate-imports/batches/:id/retry', 'import-sources/:id/runs']
    .every(route => operations.includes(route)));
assert('background jobs persist lifecycle and idempotency',
  ['pending', 'running', 'completed', 'failed'].every(status => jobEntity.includes(`'${status}'`)) &&
  ['idempotency_key', 'max_attempts'].every(value => `${jobEntity}\n${jobs}`.includes(value)) &&
  migration.includes('UQ_background_jobs_idempotency'));
assert('worker provides retry backoff, interrupted-job recovery and scheduled imports',
  jobs.includes('2 ** job.attempts') && jobs.includes('recoverAbandonedJobs') && jobs.includes('scheduleDueImportSources'));
assert('crawler rejects private networks and controls redirects/timeouts',
  crawler.includes('Private network URLs are not allowed') && crawler.includes("redirect: 'manual'") && crawler.includes('AbortSignal.timeout'));
assert('resume and candidate imports accept application-owned files only',
  ownedFiles.includes("url.pathname.startsWith('/uploads/')") &&
  importService.includes('assertOwnedFileUrl') && resumeService.includes('assertOwnedFileUrl'));
assert('candidate import tenant/status identity is server-owned',
  !candidateController.includes("@Patch('import-batches/:id')") &&
  candidateService.includes('organization_id: user.organization_id') && candidateService.includes("status: 'pending'") &&
  candidateService.includes('assertOrganizationUsers'));
const bulkSchema = importDto.slice(importDto.indexOf('CreateBulkCandidatesSchema'), importDto.indexOf('ValidateImportBatchSchema'));
assert('bulk import has a closed typed payload', !/z\.record|z\.any/.test(bulkSchema) && bulkSchema.includes('.max(500)'));
assert('generic browser LLM endpoint is removed', !integrationModule.includes('LlmService') && !fs.existsSync(path.join(root, 'backend/src/modules/integrations/services/llm.service.ts')));

for (const check of checks) {
  console.log(`${check.passed ? 'PASS' : 'FAIL'} ${check.label}`);
  if (!check.passed && check.details) console.error(check.details);
}
if (checks.some(check => !check.passed)) process.exitCode = 1;
