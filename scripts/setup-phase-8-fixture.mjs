import { createRequire } from 'node:module';

if (process.env.NODE_ENV !== 'test') {
  throw new Error('Phase 8 fixtures may only be created with NODE_ENV=test');
}

const backendRequire = createRequire(new URL('../backend/package.json', import.meta.url));
const mysql = backendRequire('mysql2/promise');
const bcrypt = backendRequire('bcrypt');

const email = process.env.PHASE8_ADMIN_EMAIL || 'phase8-admin@example.test';
const password = process.env.PHASE8_ADMIN_PASSWORD || 'Phase8-Admin-Pass-123!';
const passwordHash = await bcrypt.hash(password, 10);
const connection = await mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME || 'hire_israel',
  user: process.env.DB_USER || 'hire_user',
  password: process.env.DB_PASSWORD || 'hire_pass',
});

try {
  await connection.execute(
    `INSERT INTO users (email, password_hash, full_name, role, organization_id, is_active)
     VALUES (?, ?, 'Phase 8 Platform Admin', 'admin', NULL, 1)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = 'admin',
       organization_id = NULL, is_active = 1, refresh_token_hash = NULL`,
    [email, passwordHash],
  );
  console.log(`Phase 8 platform fixture ready: ${email}`);
} finally {
  await connection.end();
}
