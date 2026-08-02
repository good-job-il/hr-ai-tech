import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
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

function assert(label, condition) {
  checks.push({ label, passed: Boolean(condition) });
}

const phase3Files = [
  ...filesIn('src/pages/admin'),
  ...filesIn('src/components/admin'),
  ...filesIn('src/pages/platform'),
  'src/lib/AuthContext.jsx',
  'src/pages/Login.jsx',
  'src/pages/Register.jsx',
  'src/pages/ResetPassword.jsx',
  'src/components/common/UserMenu.jsx',
  'src/components/layout/EditNameModal.jsx',
];

const legacyPhase3Consumers = phase3Files.filter(file => read(file).includes('@/api/base44Client'));
const shim = read('src/api/base44Client.js');

assert('Phase 3 routes do not import base44Client', legacyPhase3Consumers.length === 0);
assert('base44 auth compatibility is removed', !/\bauth\s*[:,]/.test(shim) && !shim.includes('tokenStorage'));
assert('organizationsApi compatibility is removed', !shim.includes('organizationsApi'));
assert('AuthContext uses authService', read('src/lib/AuthContext.jsx').includes('authService'));
assert('Platform organizations use organizationService', read('src/pages/platform/OrganizationsPage.jsx').includes('organizationService'));
assert('Admin permissions use explicit services', read('src/pages/admin/PermissionsPage.jsx').includes('permissionMatrixService'));

for (const check of checks) console.log(`${check.passed ? 'PASS' : 'FAIL'} ${check.label}`);
if (legacyPhase3Consumers.length) console.error(`Legacy consumers:\n${legacyPhase3Consumers.join('\n')}`);
if (checks.some(check => !check.passed)) process.exitCode = 1;
