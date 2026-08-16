import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function blockAfter(source, marker, open = '{', close = '}') {
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) return '';
  const start = source.indexOf(open, markerIndex + marker.length);
  if (start < 0) return '';
  let depth = 0;
  let quote = '';
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === "'" || char === '"' || char === '`') quote = char;
    else if (char === open) depth += 1;
    else if (char === close) {
      depth -= 1;
      if (depth === 0) return source.slice(start + 1, index);
    }
  }
  return '';
}

function keys(block) {
  return [...block.matchAll(/^\s{2}([A-Za-z_][\w]*)(?:\?)?:/gm)].map(match => match[1]).sort();
}

const commonQueryFields = ['limit', 'order', 'page', 'sort'];
const contracts = [
  {
    name: 'Job',
    service: 'src/api/services/jobService.ts',
    backend: 'backend/src/modules/jobs/dto/jobs.dto.ts',
    query: ['domain_id', 'employer_company_id', 'is_closed', 'is_deleted', 'limit', 'order', 'organization_id', 'page', 'recommended_for', 'recruiter_id', 'search', 'seniority', 'sort', 'team_manager_id', 'type'],
    endpoint: '/jobs',
  },
  {
    name: 'Candidate',
    service: 'src/api/services/candidateService.ts',
    backend: 'backend/src/modules/candidates/dto/candidates.dto.ts',
    query: ['domain_id', 'import_batch_id', 'is_deleted', 'limit', 'order', 'organization_id', 'page', 'parsing_status', 'recruiter_id', 'review_required', 'role_id', 'search', 'sort', 'status', 'team_manager_id'],
    endpoint: '/candidates',
  },
  {
    name: 'Application',
    service: 'src/api/services/applicationService.ts',
    backend: 'backend/src/modules/applications/dto/applications.dto.ts',
    query: ['assigned_to', 'candidate_email', 'candidate_id', 'employer_company_id', 'is_deleted', 'job_id', 'limit', 'order', 'organization_id', 'page', 'recruiter_id', 'search', 'sort', 'status'],
    endpoint: '/applications',
  },
  {
    name: 'AgencyClient',
    service: 'src/api/services/agencyClientService.ts',
    backend: 'backend/src/modules/agency-clients/dto/agency-clients.dto.ts',
    query: ['industry', 'limit', 'page', 'search', 'status'],
    endpoint: '/agency-clients',
    inherited: ['limit', 'page'],
  },
];

for (const contract of contracts) {
  const frontend = read(contract.service);
  const backend = read(contract.backend);
  const frontendOwn = keys(blockAfter(frontend, `interface ${contract.name}Query`));
  const frontendCreate = keys(blockAfter(frontend, `interface Create${contract.name}Input`));
  const inherited = contract.inherited || commonQueryFields;
  const frontendQuery = [...new Set([...frontendOwn, ...inherited])].sort();
  const backendQuery = keys(blockAfter(backend, `Query${contract.name}sSchema = z.object`));
  const backendCreate = keys(blockAfter(backend, `Create${contract.name}Schema = z.object`));

  assert(
    JSON.stringify(frontendQuery) === JSON.stringify(contract.query),
    `${contract.name} frontend query fields differ: ${frontendQuery.join(', ')}`,
  );
  assert(
    JSON.stringify(backendQuery) === JSON.stringify(contract.query),
    `${contract.name} backend query fields differ: ${backendQuery.join(', ')}`,
  );
  assert(
    JSON.stringify(frontendCreate) === JSON.stringify(backendCreate),
    `${contract.name} create fields differ: frontend=[${frontendCreate.join(', ')}], backend=[${backendCreate.join(', ')}]`,
  );
  assert(frontend.includes(`super('${contract.endpoint}')`), `${contract.name} endpoint is not explicit`);
  assert(/interface Create[A-Za-z]+Input/.test(frontend), `${contract.name} create input is missing`);
  assert(/(?:interface|type) Update[A-Za-z]+Input/.test(frontend), `${contract.name} update input is missing`);
  assert(!/base44Client|\bbase44\./.test(frontend), `${contract.name} service imports legacy API`);
}

const resource = read('src/api/services/resourceService.ts');
assert(/listPage\(/.test(resource) && /PaginatedResponse/.test(resource), 'ResourceService does not preserve pagination');
assert(/TCreate = never[\s\S]*TUpdate = never/.test(resource), 'ResourceService mutation contracts are permissive by default');
assert(!/Record<string,\s*(?:unknown|any)>/.test(resource), 'ResourceService permits arbitrary payload/query records');
assert(!/defaultConfig|Proxy|filter\[/.test(resource), 'ResourceService contains generic endpoint/filter compatibility');
assert(!fs.existsSync(path.join(root, 'src/api/repositories/baseRepository.ts')), 'unsafe BaseRepository still exists');

const http = read('src/api/client/httpClient.ts');
assert(/unwrapResponse/.test(http), 'HTTP response envelope normalization is missing');
assert(/this\.cache\.set\(cacheKey, data,/.test(http), 'HTTP cache key/value order is incorrect');
assert(!/response\.data\?\.data\s*\|\|/.test(http), 'HTTP client uses lossy truthy response unwrapping');

const hooks = read('src/api/hooks/useDomainResources.ts');
for (const hook of ['useJobs', 'useCandidates', 'useApplications', 'useAgencyClients']) {
  assert(hooks.includes(`function ${hook}`), `${hook} is missing`);
}
assert(/invalidateQueries\(\{ queryKey: queryKeys\./.test(hooks), 'centralized mutation invalidation is missing');

const sourceDirectories = ['src/api/services', 'src/api/hooks'];
for (const directory of sourceDirectories) {
  for (const entry of fs.readdirSync(path.join(root, directory))) {
    if (!/\.(?:ts|js)$/.test(entry)) continue;
    const source = read(`${directory}/${entry}`);
    assert(!/api\/base44Client|\bbase44\./.test(source), `${directory}/${entry} depends on legacy API`);
  }
}

if (failures.length) {
  console.error('Phase 2 API contract boundary failed:');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log('PASS reference service query fields match NestJS DTOs');
  console.log('PASS create/update inputs and explicit endpoints are present');
  console.log('PASS pagination and response envelopes remain typed');
  console.log('PASS domain hooks use centralized query keys/invalidation');
  console.log('PASS API services/hooks do not depend on the legacy shim');
  console.log('PASS unsafe generic repository/filter surface is absent');
}
