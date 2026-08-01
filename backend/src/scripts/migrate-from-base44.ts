/**
 * ── Base44 → MySQL Data Migration ───────────────────────────────────────────
 *
 * One-off script that pulls all production records out of the live Base44
 * backend (via its REST API) and imports them into the local/production
 * MySQL database used by the NestJS backend, preserving original IDs,
 * `created_date` / `updated_date` timestamps, and field names (the whole
 * schema was deliberately designed to mirror Base44's field names 1:1 — see
 * `docs/NESTJS_MIGRATION_PLAN.md` §8).
 *
 * Usage:
 *   cd backend
 *   npm run migrate:base44                 # full run
 *   npm run migrate:base44 -- --dry-run     # fetch + report only, no DB writes
 *   npm run migrate:base44 -- --only=Job,Candidate
 *   npm run migrate:base44 -- --include-taxonomy
 *
 * Required env vars (see backend/.env.example):
 *   BASE44_SERVER_URL   (default: https://base44.app)
 *   BASE44_APP_ID       (default: value from base44/.app.jsonc)
 *   BASE44_ACCESS_TOKEN   OR   BASE44_EMAIL + BASE44_PASSWORD
 *     — must belong to an `admin` or `super_admin` Base44 user so RLS lets
 *       the export see every organization's data, not just one tenant's.
 *
 * ⚠️ IMPORTANT — passwords:
 *   Base44 never exposes user password hashes via its API (a separate,
 *   opaque auth system). Migrated `users` rows get a random, unguessable
 *   `password_hash` placeholder. Every migrated user MUST use "Forgot
 *   Password" to set a new password before they can log in. A CSV report of
 *   migrated user emails is written to `backend/migration-reports/`.
 *
 * The script is idempotent — safe to re-run. It performs an
 * `INSERT ... ON DUPLICATE KEY UPDATE` per record, so re-running just
 * refreshes existing rows and adds any new ones.
 */
import { config } from 'dotenv';
config();

import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import dataSource from '../database/typeorm.config';
import { Base44ApiClient } from './base44-api.client';

// ─────────────────────────────────────────────────────────────────────────
// CLI flags
// ─────────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const INCLUDE_TAXONOMY = args.includes('--include-taxonomy');
const onlyArg = args.find((a) => a.startsWith('--only='));
const ONLY: string[] | null = onlyArg ? onlyArg.replace('--only=', '').split(',').map((s) => s.trim()) : null;
const pageSizeArg = args.find((a) => a.startsWith('--page-size='));
const PAGE_SIZE = pageSizeArg ? parseInt(pageSizeArg.replace('--page-size=', ''), 10) : 200;

// ─────────────────────────────────────────────────────────────────────────
// Entity → table mapping, in a sensible (parent-before-child) order.
// No FK constraints exist in the schema (verified against migrations), so
// strict ordering isn't required for integrity — it's just for readability
// and so summary output reads top-down the way the app is organized.
// ─────────────────────────────────────────────────────────────────────────
interface EntityMigration {
  base44: string;
  table: string;
  pk?: string; // defaults to 'id'
  transform?: (record: any) => Promise<any> | any;
}

const CORE_MIGRATIONS: EntityMigration[] = [
  { base44: 'Organization', table: 'organizations' },
  { base44: 'User', table: 'users', transform: transformUser },
  { base44: 'Company', table: 'companies' },
  { base44: 'Staff', table: 'staff' },
  { base44: 'CompanyReview', table: 'company_reviews' },
  { base44: 'Position', table: 'positions' },
  { base44: 'UserPositionAccess', table: 'user_position_access' },
  { base44: 'RoleAlias', table: 'role_aliases' },
  { base44: 'RoleTemplate', table: 'role_templates' },
  { base44: 'PermissionMatrix', table: 'permission_matrices' },

  { base44: 'Candidate', table: 'candidates' },
  { base44: 'CandidateProfile', table: 'candidate_profiles' },
  { base44: 'CandidateImportBatch', table: 'candidate_import_batches' },
  { base44: 'CandidateAccess', table: 'candidate_access' },
  { base44: 'CandidateNote', table: 'candidate_notes' },
  { base44: 'CandidateTag', table: 'candidate_tags' },
  { base44: 'CandidateTimeline', table: 'candidate_timelines' },
  { base44: 'CandidateDocument', table: 'candidate_documents' },

  { base44: 'Job', table: 'jobs' },
  { base44: 'JobAlert', table: 'job_alerts' },
  { base44: 'SavedJob', table: 'saved_jobs' },

  { base44: 'Application', table: 'applications' },
  { base44: 'ApplicationTimeline', table: 'application_timelines', transform: transformApplicationTimeline },
  { base44: 'ApplicationPipeline', table: 'application_pipelines' },

  { base44: 'Interview', table: 'interviews' },
  { base44: 'Message', table: 'messages' },
  { base44: 'Notification', table: 'notifications' },

  { base44: 'CompensationPlan', table: 'compensation_plans' },
  { base44: 'CommunicationLog', table: 'communication_logs' },
  { base44: 'EmployerTimeline', table: 'employer_timelines' },

  { base44: 'AuditLog', table: 'audit_logs' },
  { base44: 'ImportSource', table: 'import_sources' },
  { base44: 'SalaryData', table: 'salary_data' },
];

// Static/reference taxonomy tables — usually already populated by
// `npm run seed:taxonomy`. Only migrate these if the live Base44 app has
// custom entries beyond the fixed seed list (--include-taxonomy).
const TAXONOMY_MIGRATIONS: EntityMigration[] = [
  { base44: 'Domain', table: 'domains', pk: 'domain_id' },
  { base44: 'Role', table: 'taxonomy_roles', pk: 'role_id' },
  { base44: 'Specialization', table: 'specializations', pk: 'specialization_id' },
  { base44: 'WorkMode', table: 'work_modes', pk: 'mode_id' },
  { base44: 'EmploymentType', table: 'employment_types', pk: 'type_id' },
  { base44: 'ExperienceLevel', table: 'experience_levels', pk: 'level_id' },
];

const migratedUserEmails: { email: string; role: string }[] = [];

/**
 * Base44 never returns password hashes. Assign a random, unguessable
 * placeholder so the account exists but cannot be logged into until the
 * user goes through "Forgot Password".
 */
async function transformUser(record: any) {
  const randomSecret = crypto.randomBytes(32).toString('hex');
  const placeholderHash = await bcrypt.hash(randomSecret, 10);
  migratedUserEmails.push({ email: record.email, role: record.role });

  // Legacy/alias org_type values seen in live data that don't match our enum.
  const ORG_TYPE_ALIASES: Record<string, string> = {
    staffing: 'staffing_agency',
  };
  const org_type = record.org_type ? (ORG_TYPE_ALIASES[record.org_type] ?? record.org_type) : record.org_type;

  return {
    ...record,
    email: (record.email || '').toLowerCase().trim(),
    role: record.role === 'super_admin' ? 'admin' : record.role,
    org_type,
    password_hash: placeholderHash,
    refresh_token_hash: null,
    reset_token_hash: null,
    reset_token_expires: null,
  };
}

function transformApplicationTimeline(record: any) {
  return {
    ...record,
    performed_by_role: record.performed_by_role === 'super_admin' ? 'admin' : record.performed_by_role,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Column introspection + generic upsert
// ─────────────────────────────────────────────────────────────────────────
interface ColumnInfo {
  name: string;
  dataType: string;
}

async function getTableColumns(dbName: string, table: string): Promise<ColumnInfo[]> {
  const rows: any[] = await dataSource.query(
    `SELECT COLUMN_NAME AS name, DATA_TYPE AS dataType FROM information_schema.columns
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
    [dbName, table],
  );
  if (rows.length === 0) {
    throw new Error(`Table "${table}" not found in database "${dbName}" — has migration:run been executed?`);
  }
  return rows.map((r) => ({ name: r.name, dataType: r.dataType }));
}

const DATE_TYPES = new Set(['datetime', 'timestamp', 'date']);
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

function buildRow(record: any, columns: ColumnInfo[]): { cols: string[]; vals: any[] } {
  const cols: string[] = [];
  const vals: any[] = [];
  for (const col of columns) {
    if (!Object.prototype.hasOwnProperty.call(record, col.name)) continue;
    let value = record[col.name];
    if (value === undefined) continue;

    if (col.dataType === 'json') {
      value = normalizeJsonValue(value);
    } else if (DATE_TYPES.has(col.dataType) && typeof value === 'string' && ISO_DATE_RE.test(value)) {
      // MySQL rejects the 'T'/'Z' ISO-8601 separators in bound datetime params;
      // convert to a JS Date, which mysql2 formats correctly.
      value = new Date(value);
    }

    cols.push(col.name);
    vals.push(value);
  }
  return { cols, vals };
}

/**
 * Normalizes a Base44 field value for a MySQL JSON column.
 * Base44 data quality varies: some "JSON" fields arrive as real objects/arrays,
 * some as empty strings (invalid), and some as plain non-JSON strings (legacy
 * free-text that predates the field being turned into a structured JSON type).
 */
function normalizeJsonValue(value: any): any {
  if (value === null) return null;
  if (value === '') return null; // "empty document" — MySQL JSON requires a valid value
  if (typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'string') {
    try {
      JSON.parse(value);
      return value; // already valid JSON text — pass through unchanged
    } catch {
      return JSON.stringify(value); // plain string — encode as a JSON string scalar
    }
  }
  // numbers/booleans are valid JSON scalars as-is, but stringify for safety
  return JSON.stringify(value);
}

async function upsertRecord(table: string, pk: string, cols: string[], vals: any[]): Promise<void> {
  const quoted = cols.map((c) => `\`${c}\``).join(', ');
  const placeholders = cols.map(() => '?').join(', ');
  const updateClause = cols
    .filter((c) => c !== pk)
    .map((c) => `\`${c}\` = VALUES(\`${c}\`)`)
    .join(', ');
  const sql = updateClause
    ? `INSERT INTO \`${table}\` (${quoted}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updateClause}`
    : `INSERT IGNORE INTO \`${table}\` (${quoted}) VALUES (${placeholders})`;
  await dataSource.query(sql, vals);
}

interface MigrationResult {
  entity: string;
  table: string;
  fetched: number;
  written: number;
  errors: { id?: string; message: string }[];
}

async function migrateEntity(dbName: string, cfg: EntityMigration, client: Base44ApiClient): Promise<MigrationResult> {
  const result: MigrationResult = { entity: cfg.base44, table: cfg.table, fetched: 0, written: 0, errors: [] };
  console.log(`\n📥 ${cfg.base44} → ${cfg.table} ...`);

  let records: any[];
  try {
    records = await client.listAll(cfg.base44, PAGE_SIZE);
  } catch (err: any) {
    console.error(`   ❌ Failed to fetch ${cfg.base44} from Base44: ${err.message}`);
    result.errors.push({ message: `fetch failed: ${err.message}` });
    return result;
  }
  result.fetched = records.length;
  console.log(`   fetched ${records.length} record(s)`);

  if (records.length === 0) return result;

  const columns = await getTableColumns(dbName, cfg.table);
  const pk = cfg.pk ?? 'id';

  if (DRY_RUN) {
    console.log(`   (dry-run) would upsert ${records.length} row(s) into \`${cfg.table}\``);
    return result;
  }

  for (const raw of records) {
    try {
      const record = cfg.transform ? await cfg.transform(raw) : raw;
      const { cols, vals } = buildRow(record, columns);
      if (cols.length === 0 || !cols.includes(pk)) {
        result.errors.push({ id: raw?.id, message: `missing primary key "${pk}" in source record` });
        continue;
      }
      await upsertRecord(cfg.table, pk, cols, vals);
      result.written++;
    } catch (err: any) {
      result.errors.push({ id: raw?.id, message: err.message });
    }
  }
  console.log(`   ✅ wrote ${result.written}/${records.length} row(s)${result.errors.length ? `, ${result.errors.length} error(s)` : ''}`);
  return result;
}

function writeUserReport() {
  if (migratedUserEmails.length === 0) return;
  const dir = path.join(__dirname, '..', '..', 'migration-reports');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `migrated-users-${Date.now()}.csv`);
  const csv = ['email,role', ...migratedUserEmails.map((u) => `${u.email},${u.role}`)].join('\n');
  fs.writeFileSync(file, csv, 'utf-8');
  console.log(`\n📝 Wrote ${migratedUserEmails.length} migrated user emails to ${file}`);
  console.log('   ⚠️  These accounts have a RANDOM password — every user must use "Forgot Password" to set a new one.');
}

async function main() {
  const serverUrl = process.env.BASE44_SERVER_URL || 'https://base44.app';
  const appId = process.env.BASE44_APP_ID || '6a00f4b05ae5180d66425437';
  const accessToken = process.env.BASE44_ACCESS_TOKEN;
  const apiKey = process.env.BASE44_API_KEY;
  const email = process.env.BASE44_EMAIL;
  const password = process.env.BASE44_PASSWORD;

  console.log('══════════════════════════════════════════════════════════════');
  console.log(' Base44 → MySQL Data Migration');
  console.log('══════════════════════════════════════════════════════════════');
  console.log(` Server:    ${serverUrl}`);
  console.log(` App ID:    ${appId}`);
  console.log(` Mode:      ${DRY_RUN ? 'DRY RUN (no DB writes)' : 'LIVE (writes to DB)'}`);
  console.log(` Page size: ${PAGE_SIZE}`);
  if (ONLY) console.log(` Only:      ${ONLY.join(', ')}`);
  console.log('══════════════════════════════════════════════════════════════');

  const client = new Base44ApiClient({ serverUrl, appId, apiKey, accessToken, email, password });
  await client.authenticate();

  await dataSource.initialize();
  const dbName = dataSource.options.database as string;

  let list = [...(INCLUDE_TAXONOMY ? TAXONOMY_MIGRATIONS : []), ...CORE_MIGRATIONS];
  if (ONLY) list = list.filter((m) => ONLY.includes(m.base44));

  const results: MigrationResult[] = [];
  for (const cfg of list) {
    const r = await migrateEntity(dbName, cfg, client);
    results.push(r);
  }

  writeUserReport();

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log(' Summary');
  console.log('══════════════════════════════════════════════════════════════');
  console.log('Entity'.padEnd(24) + 'Table'.padEnd(28) + 'Fetched'.padEnd(10) + 'Written'.padEnd(10) + 'Errors');
  let totalFetched = 0;
  let totalWritten = 0;
  let totalErrors = 0;
  for (const r of results) {
    console.log(
      r.entity.padEnd(24) + r.table.padEnd(28) + String(r.fetched).padEnd(10) + String(r.written).padEnd(10) + String(r.errors.length),
    );
    totalFetched += r.fetched;
    totalWritten += r.written;
    totalErrors += r.errors.length;
  }
  console.log('─'.repeat(80));
  console.log(`TOTAL`.padEnd(24) + ''.padEnd(28) + String(totalFetched).padEnd(10) + String(totalWritten).padEnd(10) + String(totalErrors));

  const withErrors = results.filter((r) => r.errors.length > 0);
  if (withErrors.length > 0) {
    console.log('\n⚠️  Errors detail (first 10 per entity):');
    for (const r of withErrors) {
      console.log(`\n  ${r.entity}:`);
      for (const e of r.errors.slice(0, 10)) {
        console.log(`    - ${e.id ?? '(no id)'}: ${e.message}`);
      }
      if (r.errors.length > 10) console.log(`    ... and ${r.errors.length - 10} more`);
    }
  }

  await dataSource.destroy();
  console.log(DRY_RUN ? '\n✅ Dry run complete — no data was written.' : '\n✅ Migration complete.');
}

main().catch((err) => {
  console.error('\n❌ Migration failed:', err);
  process.exit(1);
});
