import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checks = [];

function read(relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

function filesIn(relative) {
  const directory = path.join(root, relative);
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const item = path.join(relative, entry.name);
    return entry.isDirectory() ? filesIn(item) : [item];
  }).filter(file => /\.(js|jsx|ts|tsx)$/.test(file));
}

function assert(label, condition, details = '') {
  checks.push({ label, passed: Boolean(condition), details });
}

const phase3UiFiles = [
  ...filesIn('src/pages/admin'),
  ...filesIn('src/components/admin'),
  ...filesIn('src/pages/platform'),
  'src/lib/AuthContext.jsx',
  'src/lib/ProtectedRoute.jsx',
  'src/lib/roleAliasResolver.js',
  'src/hooks/usePermissionMatrix.js',
  'src/pages/Login.jsx',
  'src/pages/Register.jsx',
  'src/pages/ForgotPassword.jsx',
  'src/pages/ResetPassword.jsx',
  'src/pages/agency/AgencyOnboarding.jsx',
  'src/components/common/UserMenu.jsx',
  'src/components/layout/EditNameModal.jsx',
];

const forbiddenImports = phase3UiFiles.filter(file =>
  /@\/api\/(?:base44Client|client\/httpClient)/.test(read(file))
  || /\b(?:fetch|axios)\s*\(/.test(read(file)),
);
const auth = read('src/api/services/authService.ts');
const taxonomy = read('src/api/services/taxonomyService.ts');
const tokenStorage = read('src/api/client/tokenStorage.ts');
const auditDto = read('backend/src/modules/audit/dto/audit-log.dto.ts');
const auditService = read('backend/src/modules/audit/audit.service.ts');
const organizationService = read('backend/src/modules/organizations/organizations.service.ts');
const app = read('src/App.jsx');

assert('Phase 3 UI uses domain services only', forbiddenImports.length === 0, forbiddenImports.join('\n'));
assert('legacy compatibility shim is physically absent', !fs.existsSync(path.join(root, 'src/api/base44Client.js')));
assert('authService exposes complete auth lifecycle', ['login', 'register', 'me:', 'updateMe', 'requestPasswordReset', 'resetPassword', 'refresh(', 'logout', 'enterOrganization', 'exitOrganization'].every(name => auth.includes(name)));
assert('token storage has no legacy or generic token aliases', !/base44_access_token|setItem\(['"]token['"]/.test(tokenStorage));
assert('taxonomy avoids compatibility function routes', !taxonomy.includes('/functions/'));
const createAuditDto = auditDto.slice(auditDto.indexOf('CreateAuditLogSchema'), auditDto.indexOf('QueryAuditLogsSchema'));
assert('browser cannot author audit identity', !/actor_email|actor_role|actor_user_id|organization_id/.test(createAuditDto) && auditService.includes('actor_email: user.email'));
assert('organization platform fields are server-protected', organizationService.includes('platformOnlyFields') && organizationService.includes("user.role !== UserRole.ADMIN"));
assert('platform route group is protected by superAdminOnly', app.includes('<ProtectedRoute superAdminOnly />'));

for (const check of checks) {
  console.log(`${check.passed ? 'PASS' : 'FAIL'} ${check.label}`);
  if (!check.passed && check.details) console.error(check.details);
}
if (checks.some(check => !check.passed)) process.exitCode = 1;
