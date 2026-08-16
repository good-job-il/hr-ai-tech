import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

function read(relative) {
  return fs.readFileSync(path.join(projectRoot, relative), 'utf8');
}

function walk(relative, excluded = new Set()) {
  const root = path.join(projectRoot, relative);
  return fs.readdirSync(root, { withFileTypes: true }).flatMap(entry => {
    const child = path.join(relative, entry.name).split(path.sep).join('/');
    if (excluded.has(child)) return [];
    if (entry.isDirectory()) return walk(child, excluded);
    return /\.(?:js|jsx|ts|tsx|html|css|json)$/.test(entry.name) ? [child] : [];
  });
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const frontendFiles = [...walk('src'), 'index.html'];
const backendRuntimeFiles = walk('backend/src', new Set([
  'backend/src/scripts',
  'backend/src/migrations',
]));
const runtimeText = [...frontendFiles, ...backendRuntimeFiles]
  .map(file => `${file}\n${read(file)}`)
  .join('\n');

assert(
  !/(?:media|app|api)\.base44\.com|https?:\/\/[^\s'"`]*base44\.(?:com|app)/i.test(runtimeText),
  'runtime source references a Base44 network domain',
);

const frontendText = frontendFiles.map(read).join('\n');
assert(!/\basServiceRole\b/.test(frontendText), 'frontend still exposes asServiceRole');
assert(!/base44\.integrations\.Core\.SendEmail|\/integrations\/send-email/.test(frontendText), 'frontend can still send arbitrary email');
assert(!/loginWithProvider|google.{0,24}(?:login|sign.?in|oauth)/i.test(frontendText), 'unsupported provider login is visible in frontend');

assert(!fs.existsSync(path.join(projectRoot, 'backend/src/modules/integrations/integrations.controller.ts')), 'generic integrations controller is still enabled');
assert(!/SendEmail(?:Dto|Schema)/.test(runtimeText), 'generic email payload DTO is still enabled');

const emailService = read('backend/src/modules/integrations/services/email.service.ts');
assert(/sendApplicationSubmitted/.test(emailService), 'application email use case is missing');
assert(/sendInterviewScheduled/.test(emailService), 'interview email use case is missing');
assert(!/\[Email:MOCK\].*(?:body|to=)/.test(emailService), 'mock email logging may expose recipient/body');
assert(/sendApplicationSubmitted/.test(read('backend/src/modules/applications/applications.service.ts')), 'application service does not own its email event');
assert(/sendInterviewScheduled/.test(read('backend/src/modules/interviews/interviews.service.ts')), 'interview service does not own its email event');

const html = read('index.html');
const csp = html.match(/Content-Security-Policy" content="([^"]+)"/)?.[1] || '';
assert(Boolean(csp), 'Content Security Policy meta tag is missing');
assert(!/connect-src[^;]*(?:https?:|wss?:)(?:\s|;)/.test(csp), 'connect-src contains an unrestricted network scheme');
assert(!/img-src[^;]*\shttps:(?:\s|;)/.test(csp), 'img-src allows every HTTPS host');
assert(/img-src[^;]*https:\/\/images\.unsplash\.com/.test(csp), 'expected image host allowlist is missing');
assert(fs.existsSync(path.join(projectRoot, 'public', 'logo.png')), 'application-owned public/logo.png is missing');

const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: projectRoot, encoding: 'utf8' })
  .split('\0')
  .filter(Boolean);
const trackedPrivateEnv = tracked.filter(file => /(^|\/)\.env(?:\.|$)/.test(file) && !file.endsWith('.env.example'));
assert(trackedPrivateEnv.length === 0, `private env files are tracked: ${trackedPrivateEnv.join(', ')}`);

const trackedSecretAssignments = [];
for (const file of tracked) {
  if (!/(?:^|\/)(?:[^/]+\.(?:env|js|mjs|cjs|ts|json|ya?ml|toml|sh)|Dockerfile)$/.test(file)) continue;
  const absolute = path.join(projectRoot, file);
  if (!fs.existsSync(absolute) || fs.statSync(absolute).isDirectory()) continue;
  const content = fs.readFileSync(absolute, 'utf8');
  if (/^BASE44_(?:API_KEY|ACCESS_TOKEN|PASSWORD)\s*=\s*\S+/m.test(content)) trackedSecretAssignments.push(file);
}
assert(trackedSecretAssignments.length === 0, `tracked Base44 credentials found: ${trackedSecretAssignments.join(', ')}`);

if (failures.length) {
  console.error('Phase 1 security boundary failed:');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log('PASS no Base44 runtime network domains');
  console.log('PASS CSP uses explicit network/image allowlists');
  console.log('PASS unsupported OAuth and service-role surfaces are absent');
  console.log('PASS email delivery is owned by explicit backend use cases');
  console.log('PASS no private env files or Base44 credentials are tracked');
  console.log('PASS no legacy migration credentials are tracked');
}
