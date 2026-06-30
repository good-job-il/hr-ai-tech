/**
 * Taxonomy seed — run once after migrations to populate reference data.
 *
 * Usage:
 *   npx ts-node src/seeds/taxonomy.seed.ts
 *
 * Or call TaxonomyService.upsert* methods via a NestJS OnApplicationBootstrap hook.
 */

import { DataSource } from 'typeorm';
import dataSource from '../database/typeorm.config';

const DOMAINS = [
  { domain_id: 1,  name: 'Software Engineering' },
  { domain_id: 2,  name: 'Data & AI' },
  { domain_id: 3,  name: 'Product Management' },
  { domain_id: 4,  name: 'Design & UX' },
  { domain_id: 5,  name: 'Marketing' },
  { domain_id: 6,  name: 'Sales' },
  { domain_id: 7,  name: 'Finance & Accounting' },
  { domain_id: 8,  name: 'Human Resources' },
  { domain_id: 9,  name: 'Operations' },
  { domain_id: 10, name: 'Customer Success' },
  { domain_id: 11, name: 'Legal' },
  { domain_id: 12, name: 'Healthcare' },
  { domain_id: 13, name: 'Education' },
  { domain_id: 14, name: 'Construction & Engineering' },
  { domain_id: 15, name: 'Logistics & Supply Chain' },
];

const WORK_MODES = [
  { mode_id: 1, name: 'Remote' },
  { mode_id: 2, name: 'On-site' },
  { mode_id: 3, name: 'Hybrid' },
];

const EMPLOYMENT_TYPES = [
  { type_id: 1, name: 'Full-time' },
  { type_id: 2, name: 'Part-time' },
  { type_id: 3, name: 'Contract' },
  { type_id: 4, name: 'Freelance' },
  { type_id: 5, name: 'Internship' },
  { type_id: 6, name: 'Temporary' },
];

const EXPERIENCE_LEVELS = [
  { level_id: 1, name: 'Entry Level (0-1 years)' },
  { level_id: 2, name: 'Junior (1-3 years)' },
  { level_id: 3, name: 'Mid-Level (3-5 years)' },
  { level_id: 4, name: 'Senior (5-8 years)' },
  { level_id: 5, name: 'Lead / Staff (8+ years)' },
  { level_id: 6, name: 'Manager' },
  { level_id: 7, name: 'Director' },
  { level_id: 8, name: 'VP / C-Level' },
];

async function seed(ds: DataSource) {
  console.log('🌱 Seeding taxonomy data...');

  for (const domain of DOMAINS) {
    await ds.query(
      `INSERT INTO domains (domain_id, name) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)`,
      [domain.domain_id, domain.name],
    );
  }
  console.log(`  ✅ ${DOMAINS.length} domains`);

  for (const wm of WORK_MODES) {
    await ds.query(
      `INSERT INTO work_modes (mode_id, name) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)`,
      [wm.mode_id, wm.name],
    );
  }
  console.log(`  ✅ ${WORK_MODES.length} work modes`);

  for (const et of EMPLOYMENT_TYPES) {
    await ds.query(
      `INSERT INTO employment_types (type_id, name) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)`,
      [et.type_id, et.name],
    );
  }
  console.log(`  ✅ ${EMPLOYMENT_TYPES.length} employment types`);

  for (const el of EXPERIENCE_LEVELS) {
    await ds.query(
      `INSERT INTO experience_levels (level_id, name) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)`,
      [el.level_id, el.name],
    );
  }
  console.log(`  ✅ ${EXPERIENCE_LEVELS.length} experience levels`);

  console.log('✅ Taxonomy seed complete.');
}

dataSource
  .initialize()
  .then((ds) => seed(ds))
  .catch(console.error)
  .finally(() => process.exit(0));

