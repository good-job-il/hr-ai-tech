import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = path.join(projectRoot, 'src');
const legacyFunctionsRoot = path.join(projectRoot, 'base44', 'functions');
const allowlistPath = path.join(projectRoot, 'docs', 'legacy-api-import-allowlist.txt');
const baselinePath = path.join(projectRoot, 'docs', 'legacy-api-call-baseline.json');
const shimPath = 'src/api/base44Client.js';
const extensions = new Set(['.js', '.jsx', '.ts', '.tsx']);
const dynamicFilterResolutions = [];

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(absolute);
    return extensions.has(path.extname(entry.name)) ? [absolute] : [];
  });
}

function stripComments(source) {
  let output = '';
  let state = 'code';
  let escaped = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (state === 'line-comment') {
      if (char === '\n') {
        state = 'code';
        output += char;
      } else output += ' ';
      continue;
    }
    if (state === 'block-comment') {
      if (char === '*' && next === '/') {
        output += '  ';
        index += 1;
        state = 'code';
      } else output += char === '\n' ? '\n' : ' ';
      continue;
    }
    if (state === 'single' || state === 'double' || state === 'template') {
      output += char;
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (
        (state === 'single' && char === "'")
        || (state === 'double' && char === '"')
        || (state === 'template' && char === '`')
      ) state = 'code';
      continue;
    }

    if (char === '/' && next === '/') {
      output += '  ';
      index += 1;
      state = 'line-comment';
    } else if (char === '/' && next === '*') {
      output += '  ';
      index += 1;
      state = 'block-comment';
    } else {
      output += char;
      if (char === "'") state = 'single';
      else if (char === '"') state = 'double';
      else if (char === '`') state = 'template';
    }
  }
  return output;
}

function normalize(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function firstArgument(source, openParenIndex) {
  let state = 'code';
  let escaped = false;
  const stack = [];
  let result = '';

  for (let index = openParenIndex + 1; index < source.length; index += 1) {
    const char = source[index];
    if (state !== 'code') {
      result += char;
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (
        (state === 'single' && char === "'")
        || (state === 'double' && char === '"')
        || (state === 'template' && char === '`')
      ) state = 'code';
      continue;
    }
    if (char === "'") state = 'single';
    else if (char === '"') state = 'double';
    else if (char === '`') state = 'template';
    else if (char === '(' || char === '[' || char === '{') stack.push(char);
    else if (char === ')' && stack.length === 0) return normalize(result);
    else if (char === ')' || char === ']' || char === '}') stack.pop();
    else if (char === ',' && stack.length === 0) return normalize(result);
    result += char;
  }
  return normalize(result);
}

function increment(target, key, amount = 1) {
  target[key] = (target[key] || 0) + amount;
}

function collectCalls(source, relative) {
  const calls = {};
  const filterContracts = [];
  const functionNames = [];
  const memberPattern = /\bbase44(?:\s*\.\s*[A-Za-z_$][\w$]*)+/g;
  let match;

  while ((match = memberPattern.exec(source))) {
    const after = source.slice(memberPattern.lastIndex);
    const whitespace = after.match(/^\s*/)?.[0].length || 0;
    if (after[whitespace] !== '(') continue;

    const operation = match[0].replace(/\s+/g, '');
    const openParenIndex = memberPattern.lastIndex + whitespace;
    const argument = firstArgument(source, openParenIndex);
    let signature = operation;

    const filterMatch = operation.match(/^base44\.entities\.([\w$]+)\.filter$/);
    if (filterMatch) {
      const contract = argument || '{}';
      signature = `${operation}|filter=${contract}`;
      filterContracts.push({
        file: relative,
        line: source.slice(0, match.index).split('\n').length,
        entity: filterMatch[1],
        conditions: contract,
      });
    }

    if (operation === 'base44.functions.invoke') {
      const nameMatch = argument.match(/^(['"])([A-Za-z0-9_$-]+)\1$/);
      const functionName = nameMatch?.[2] || `<dynamic:${argument || 'missing'}>`;
      signature = `${operation}|name=${functionName}`;
      functionNames.push(functionName);
    }

    increment(calls, signature);
  }
  return { calls, filterContracts, functionNames };
}

function getEntityConfig(source) {
  const marker = 'const ENTITY_CONFIG = {';
  const start = source.indexOf(marker);
  const end = source.indexOf('\n};', start);
  if (start === -1 || end === -1) return [];
  const block = source.slice(start + marker.length, end);
  return [...block.matchAll(/^\s{2}([A-Za-z_$][\w$]*):/gm)].map(match => match[1]).sort();
}

const inventory = {
  importFiles: [],
  usageByFile: {},
  filterContracts: [],
  usedFunctions: [],
  legacyFunctions: fs.existsSync(legacyFunctionsRoot)
    ? fs.readdirSync(legacyFunctionsRoot, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
      .sort()
    : [],
  entityConfig: [],
};

for (const absolute of walk(sourceRoot)) {
  const raw = fs.readFileSync(absolute, 'utf8');
  const source = stripComments(raw);
  const relative = path.relative(projectRoot, absolute).split(path.sep).join('/');
  if (/\bfrom\s+['"][^'"]*api\/base44Client(?:\.js)?['"]/.test(source)) inventory.importFiles.push(relative);
  const { calls, filterContracts, functionNames } = collectCalls(source, relative);
  if (Object.keys(calls).length) inventory.usageByFile[relative] = calls;
  inventory.filterContracts.push(...filterContracts);
  inventory.usedFunctions.push(...functionNames);
  if (relative === shimPath) inventory.entityConfig = getEntityConfig(source);
}

inventory.importFiles.sort();
inventory.usedFunctions = [...new Set(inventory.usedFunctions)].sort();
inventory.unusedLegacyFunctions = inventory.legacyFunctions
  .filter(name => !inventory.usedFunctions.includes(name));
inventory.missingLegacyFunctions = inventory.usedFunctions
  .filter(name => !name.startsWith('<dynamic:') && !inventory.legacyFunctions.includes(name));
inventory.filterContracts.sort((left, right) =>
  left.file.localeCompare(right.file) || left.line - right.line);

const operationCounts = {};
for (const calls of Object.values(inventory.usageByFile)) {
  for (const [signature, count] of Object.entries(calls)) increment(operationCounts, signature, count);
}
// increment() is intentionally tiny; aggregate counts larger than one here.
for (const signature of Object.keys(operationCounts)) {
  operationCounts[signature] = Object.values(inventory.usageByFile)
    .reduce((sum, calls) => sum + (calls[signature] || 0), 0);
}

const counts = {
  importFiles: inventory.importFiles.length,
  callFiles: Object.keys(inventory.usageByFile).length,
  calls: Object.values(operationCounts).reduce((sum, count) => sum + count, 0),
  filterCalls: inventory.filterContracts.length,
  usedFunctions: inventory.usedFunctions.length,
  unusedLegacyFunctions: inventory.unusedLegacyFunctions.length,
  entityConfig: inventory.entityConfig.length,
};
const output = {
  generatedAt: new Date().toISOString(),
  counts,
  operationCounts,
  dynamicFilterResolutions,
  ...inventory,
};

function markdownReport() {
  const lines = [
    '# Legacy API inventory',
    '',
    `Baseline generated: ${output.generatedAt.slice(0, 10)}.`,
    '',
    'This file is a human-readable snapshot. The enforceable per-file baseline is `legacy-api-call-baseline.json`.',
    '',
    '## Counts',
    '',
    '| Metric | Count |',
    '|---|---:|',
    ...Object.entries(counts).map(([key, value]) => `| ${key} | ${value} |`),
    '',
    '## Dynamic filter contracts',
    '',
    '| Entity | Conditions expression | Consumer |',
    '|---|---|---|',
    ...inventory.filterContracts.map(item =>
      `| ${item.entity} | \`${item.conditions.replace(/\|/g, '\\|')}\` | \`${item.file}:${item.line}\` |`),
    '',
    'Expressions that are not inline object literals are resolved below from their current definitions; they remain dynamic contracts that must be migrated to typed service filters.',
    '',
    '### Resolved fields for dynamic expressions',
    '',
    '| Expression | Possible fields | Definition |',
    '|---|---|---|',
    ...dynamicFilterResolutions.map(item =>
      `| \`${item.expression}\` | ${item.fields.map(field => `\`${field}\``).join(', ')} | \`${item.source}\` |`),
    '',
    '## Legacy functions still called by the frontend',
    '',
    ...inventory.usedFunctions.map(name => `- \`${name}\``),
    '',
    '## Legacy functions with no frontend consumer',
    '',
    ...inventory.unusedLegacyFunctions.map(name => `- \`${name}\``),
  ];
  return `${lines.join('\n')}\n`;
}

if (process.argv.includes('--markdown')) {
  process.stdout.write(markdownReport());
} else if (process.argv.includes('--json')) {
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
} else {
  console.log('Legacy API inventory');
  for (const [key, value] of Object.entries(counts)) console.log(`- ${key}: ${value}`);
}

if (process.argv.includes('--check')) {
  const failures = [];
  const allowed = new Set(
    fs.readFileSync(allowlistPath, 'utf8')
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#')),
  );
  const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  const baselineRefArg = process.argv.find(argument => argument.startsWith('--baseline-ref='));

  for (const file of inventory.importFiles) {
    if (!allowed.has(file)) failures.push(`new shim import: ${file}`);
  }
  for (const file of allowed) {
    if (!baseline.importFiles.includes(file)) failures.push(`allowlist expansion: ${file}`);
  }
  for (const [file, calls] of Object.entries(inventory.usageByFile)) {
    const allowedCalls = baseline.usageByFile[file] || {};
    for (const [signature, count] of Object.entries(calls)) {
      const maximum = allowedCalls[signature] || 0;
      if (count > maximum) failures.push(`new call (${count} > ${maximum}): ${file}: ${signature}`);
    }
  }
  for (const entity of inventory.entityConfig) {
    if (!baseline.entityConfig.includes(entity)) failures.push(`ENTITY_CONFIG expansion: ${entity}`);
  }

  if (baselineRefArg) {
    const baselineRef = baselineRefArg.slice('--baseline-ref='.length);
    let reference;
    try {
      reference = JSON.parse(execFileSync(
        'git',
        ['show', `${baselineRef}:docs/legacy-api-call-baseline.json`],
        { cwd: projectRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
      ));
    } catch (error) {
      const stderr = String(error?.stderr || '');
      if (stderr.includes('does not exist in') || stderr.includes('exists on disk, but not in')) {
        console.log(`- baseline ref: bootstrap (snapshot absent from ${baselineRef})`);
      } else throw error;
    }
    if (reference) {
      for (const file of baseline.importFiles) {
        if (!reference.importFiles.includes(file)) failures.push(`baseline import expansion: ${file}`);
      }
      for (const [file, calls] of Object.entries(baseline.usageByFile)) {
        const referenceCalls = reference.usageByFile[file] || {};
        for (const [signature, maximum] of Object.entries(calls)) {
          const referenceMaximum = referenceCalls[signature] || 0;
          if (maximum > referenceMaximum) {
            failures.push(`baseline call expansion (${maximum} > ${referenceMaximum}): ${file}: ${signature}`);
          }
        }
      }
      for (const entity of baseline.entityConfig) {
        if (!reference.entityConfig.includes(entity)) failures.push(`baseline ENTITY_CONFIG expansion: ${entity}`);
      }
    }
  }

  if (failures.length) {
    console.error('\nLegacy API boundary violations:');
    failures.forEach(failure => console.error(`- ${failure}`));
    process.exitCode = 1;
  } else {
    console.log('- boundary: passed (imports, call signatures and ENTITY_CONFIG can only decrease)');
  }
}
