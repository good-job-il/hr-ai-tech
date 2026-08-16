import assert from 'node:assert/strict';

const required = [
  ['BASE44_CREDENTIALS_REVOKED', 'Base44 credentials were revoked at the provider'],
  ['BASE44_EGRESS_BLOCKED', 'Base44 domains are blocked by production egress/DNS policy'],
  ['BROWSER_MATRIX_VERIFIED', 'The role/browser/mobile/RTL matrix passed for this commit'],
  ['BACKUP_RESTORE_VERIFIED', 'A production-like backup/restore drill passed for this release'],
];

for (const [name, description] of required) {
  assert.equal(process.env[name], 'true', `${name}=true is required: ${description}`);
  console.log(`PASS ${description}`);
}
