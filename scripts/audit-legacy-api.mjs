import fs from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve(new URL('..', import.meta.url).pathname);
const sourceRoot = path.join(projectRoot, 'src');
const allowlistPath = path.join(projectRoot, 'docs', 'legacy-api-import-allowlist.txt');
const extensions = new Set(['.js', '.jsx', '.ts', '.tsx']);

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(absolute);
    return extensions.has(path.extname(entry.name)) ? [absolute] : [];
  });
}

const files = walk(sourceRoot);
const inventory = {
  importFiles: [],
  entityFiles: [],
  functionFiles: [],
  integrationFiles: [],
  authFiles: [],
};

for (const absolute of files) {
  const content = fs.readFileSync(absolute, 'utf8');
  const relative = path.relative(projectRoot, absolute).split(path.sep).join('/');
  if (/from\s+['"]@\/api\/base44Client['"]/.test(content)) inventory.importFiles.push(relative);
  if (/base44\.entities\./.test(content)) inventory.entityFiles.push(relative);
  if (/base44\.functions\.invoke/.test(content)) inventory.functionFiles.push(relative);
  if (/base44\.integrations\.Core\./.test(content)) inventory.integrationFiles.push(relative);
  if (/base44\.auth\./.test(content)) inventory.authFiles.push(relative);
}

Object.values(inventory).forEach(items => items.sort());

const counts = Object.fromEntries(
  Object.entries(inventory).map(([key, items]) => [key, items.length]),
);
const output = { generatedAt: new Date().toISOString(), counts, ...inventory };

if (process.argv.includes('--json')) {
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
} else {
  console.log('Legacy API inventory');
  for (const [key, value] of Object.entries(counts)) console.log(`- ${key}: ${value}`);
}

if (process.argv.includes('--check')) {
  const allowed = new Set(
    fs.readFileSync(allowlistPath, 'utf8')
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#')),
  );
  const unexpected = inventory.importFiles.filter(file => !allowed.has(file));
  if (unexpected.length) {
    console.error('\nNew legacy API imports are forbidden:');
    unexpected.forEach(file => console.error(`- ${file}`));
    process.exitCode = 1;
  } else {
    console.log('- boundary: passed (no new import files)');
  }
}
