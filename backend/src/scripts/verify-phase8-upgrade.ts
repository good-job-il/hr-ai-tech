import { DataSource } from 'typeorm';
import * as mysql from 'mysql2/promise';
import { InitPhase11751000000000 } from '../migrations/1751000000000-InitPhase1';
import { Phase21751100000000 } from '../migrations/1751100000000-Phase2';
import { Phase31751200000000 } from '../migrations/1751200000000-Phase3';
import { Phase41751300000000 } from '../migrations/1751300000000-Phase4';
import { WidenEnumsForBase44Migration1751400000000 } from '../migrations/1751400000000-WidenEnumsForBase44Migration';
import { WidenImportBatchStatusEnum1751400100000 } from '../migrations/1751400100000-WidenImportBatchStatusEnum';
import { RemoveSuperAdminRole1751500000000 } from '../migrations/1751500000000-RemoveSuperAdminRole';
import { MigrateUuidToIntPk1752000000000 } from '../migrations/1752000000000-MigrateUuidToIntPk';
import { AgencyOwnershipScope1752100000000 } from '../migrations/1752100000000-AgencyOwnershipScope';
import { AgencyClients1752200000000 } from '../migrations/1752200000000-AgencyClients';
import { AgencyTeams1752300000000 } from '../migrations/1752300000000-AgencyTeams';
import { CandidateCanonicalOwnership1752400000000 } from '../migrations/1752400000000-CandidateCanonicalOwnership';
import { BackgroundJobs1752500000000 } from '../migrations/1752500000000-BackgroundJobs';

if (process.env.NODE_ENV !== 'test') throw new Error('Upgrade fixture requires NODE_ENV=test');

const database = process.env.PHASE8_UPGRADE_DB || 'hire_israel_phase8_upgrade';
if (!/^hire_israel_phase8_[a-z0-9_]+$/.test(database)) throw new Error('Unsafe upgrade fixture database name');
const databaseUser = process.env.DB_USER || 'hire_user';
if (!/^[A-Za-z0-9_]+$/.test(databaseUser)) throw new Error('Unsafe database user name');
const host = process.env.DB_HOST || '127.0.0.1';
const port = Number(process.env.DB_PORT || 3306);

const baseline = [
  InitPhase11751000000000, Phase21751100000000, Phase31751200000000, Phase41751300000000,
  WidenEnumsForBase44Migration1751400000000, WidenImportBatchStatusEnum1751400100000,
  RemoveSuperAdminRole1751500000000, MigrateUuidToIntPk1752000000000,
  AgencyOwnershipScope1752100000000, AgencyClients1752200000000, AgencyTeams1752300000000,
];
const all = [...baseline, CandidateCanonicalOwnership1752400000000, BackgroundJobs1752500000000];
const options = (migrations: Array<new () => object>) => ({
  type: 'mysql' as const,
  host, port, database,
  username: databaseUser,
  password: process.env.DB_PASSWORD || 'hire_pass',
  migrations,
  migrationsTableName: 'migrations_history',
});

async function main() {
  const admin = await mysql.createConnection({
    host, port,
    user: process.env.DB_ADMIN_USER || 'root',
    password: process.env.DB_ADMIN_PASSWORD || 'rootpassword',
  });
  try {
  await admin.query(`DROP DATABASE IF EXISTS \`${database}\``);
  await admin.query(`CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await admin.query(`GRANT ALL PRIVILEGES ON \`${database}\`.* TO '${databaseUser}'@'%'`);

  const before = new DataSource(options(baseline));
  await before.initialize();
  await before.runMigrations();
  await before.query(
    `INSERT INTO users (email, password_hash, full_name, role, is_active)
     VALUES ('upgrade-candidate@example.test', 'not-used', 'Upgrade Candidate', 'candidate', 1)`,
  );
  const [user] = await before.query(`SELECT id FROM users WHERE email = 'upgrade-candidate@example.test'`);
  await before.query(
    `INSERT INTO candidate_profiles (user_email, full_name, is_public, is_open_to_work)
     VALUES ('upgrade-candidate@example.test', 'Upgrade Candidate', 1, 1)`,
  );
  await before.query(
    `INSERT INTO saved_jobs (user_email, job_id, job_title, company)
     VALUES ('upgrade-candidate@example.test', 123456, 'Preserved Job', 'Preserved Company')`,
  );
  await before.destroy();

  const after = new DataSource(options(all));
  await after.initialize();
  await after.runMigrations();
  const [profile] = await after.query(`SELECT user_id, full_name FROM candidate_profiles WHERE user_email = 'upgrade-candidate@example.test'`);
  const [saved] = await after.query(`SELECT user_id, job_title FROM saved_jobs WHERE user_email = 'upgrade-candidate@example.test'`);
  const [jobTable] = await after.query(`SHOW TABLES LIKE 'background_jobs'`);
  const [migrationCount] = await after.query(`SELECT COUNT(*) AS count FROM migrations_history`);
  if (Number(profile?.user_id) !== Number(user.id) || profile?.full_name !== 'Upgrade Candidate') throw new Error('Candidate profile ownership/data was not preserved');
  if (Number(saved?.user_id) !== Number(user.id) || saved?.job_title !== 'Preserved Job') throw new Error('Saved job ownership/data was not preserved');
  if (!jobTable || Number(migrationCount?.count) !== 13) throw new Error('Upgrade did not reach the complete schema');
  await after.destroy();
  console.log('PASS upgrade fixture preserved data, backfilled canonical ownership and reached 13/13 migrations');
  } finally {
    await admin.query(`DROP DATABASE IF EXISTS \`${database}\``);
    await admin.end();
  }
}

void main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
