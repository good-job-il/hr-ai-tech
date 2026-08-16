import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checks = [];
const forbiddenName = ['base', '44'].join('');
const forbiddenPattern = new RegExp(forbiddenName, 'i');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const assert = (label, condition, details = '') => checks.push({ label, passed: Boolean(condition), details });

function filesIn(relative, extensions, excluded = new Set()) {
  const directory = path.join(root, relative);
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const item = path.join(relative, entry.name).split(path.sep).join('/');
    if (excluded.has(item)) return [];
    if (entry.isDirectory()) return filesIn(item, extensions, excluded);
    return extensions.has(path.extname(entry.name)) ? [item] : [];
  });
}

const sourceFiles = [
  ...filesIn('src', new Set(['.js', '.jsx', '.ts', '.tsx'])),
  ...filesIn('backend/src', new Set(['.js', '.ts']), new Set([
    'backend/src/migrations',
    'backend/src/scripts/verify-phase8-upgrade.ts',
  ])),
];
const runtimeReferences = sourceFiles.filter(file => forbiddenPattern.test(read(file)));

assert('compatibility shim is absent', !exists(`src/api/${forbiddenName}Client.js`));
assert('legacy source tree is absent', !exists(forbiddenName));
assert('one-time migration tooling is absent',
  !exists(`backend/src/scripts/migrate-from-${forbiddenName}.ts`) &&
  !exists(`backend/src/scripts/${forbiddenName}-api.client.ts`));
assert('runtime source contains no legacy platform references', runtimeReferences.length === 0, runtimeReferences.join('\n'));

const operationalFiles = [
  'package.json',
  'package-lock.json',
  'backend/package.json',
  '.env.example',
  'backend/.env.example',
  'vite.config.js',
  'README.md',
  'backend/README.md',
];
const operationalReferences = operationalFiles.filter(file => forbiddenPattern.test(read(file)));
assert('packages, env, proxy config and operational READMEs are clean',
  operationalReferences.length === 0,
  operationalReferences.join('\n'));

const frontend = sourceFiles.filter(file => file.startsWith('src/')).map(read).join('\n');
assert('frontend contains no generic compatibility API patterns',
  !/\basServiceRole\b|\bfunctions\.invoke\b|\bintegrations\.Core\b|api\/base44Client/i.test(frontend));

const migrationFiles = filesIn('backend/src/migrations', new Set(['.ts']));
const historicalReferences = migrationFiles.filter(file => forbiddenPattern.test(read(file)));
const allowedHistoricalMigrations = new Set([
  `backend/src/migrations/1751400000000-WidenEnumsFor${forbiddenName[0].toUpperCase()}${forbiddenName.slice(1)}Migration.ts`,
  'backend/src/migrations/1751400100000-WidenImportBatchStatusEnum.ts',
]);
const unexpectedHistoricalReferences = historicalReferences.filter(file => !allowedHistoricalMigrations.has(file));
assert('legacy references are limited to the documented migration-history exception',
  unexpectedHistoricalReferences.length === 0,
  unexpectedHistoricalReferences.join('\n'));

for (const check of checks) {
  console.log(`${check.passed ? 'PASS' : 'FAIL'} ${check.label}`);
  if (!check.passed && check.details) console.error(check.details);
}
if (checks.some(check => !check.passed)) process.exitCode = 1;
