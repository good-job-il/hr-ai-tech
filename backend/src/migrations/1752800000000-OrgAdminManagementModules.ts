import { MigrationInterface, QueryRunner } from "typeorm"

export class OrgAdminManagementModules1752800000000 implements MigrationInterface {
  name = "OrgAdminManagementModules1752800000000"

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE \`billing_accounts\` (
      \`id\` INT NOT NULL AUTO_INCREMENT, \`created_date\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_date\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      \`organization_id\` INT NOT NULL, \`provider\` VARCHAR(50) NULL, \`provider_customer_id\` VARCHAR(255) NULL,
      \`subscription_status\` ENUM('trialing','active','past_due','cancelled','unpaid','not_configured') NOT NULL DEFAULT 'not_configured',
      \`payment_status\` ENUM('paid','pending','failed','not_configured') NOT NULL DEFAULT 'not_configured',
      \`current_period_end\` DATETIME NULL, \`cancel_at_period_end\` TINYINT NOT NULL DEFAULT 0,
      UNIQUE INDEX \`UQ_billing_account_org\` (\`organization_id\`), PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB`)
    await queryRunner.query(`CREATE TABLE \`billing_invoices\` (
      \`id\` INT NOT NULL AUTO_INCREMENT, \`created_date\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_date\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      \`organization_id\` INT NOT NULL, \`provider_invoice_id\` VARCHAR(255) NOT NULL, \`invoice_number\` VARCHAR(100) NULL,
      \`amount_minor\` INT NOT NULL, \`currency\` VARCHAR(3) NOT NULL DEFAULT 'ILS', \`status\` ENUM('draft','open','paid','void','uncollectible') NOT NULL DEFAULT 'open',
      \`issued_at\` DATETIME NOT NULL, \`due_at\` DATETIME NULL, \`paid_at\` DATETIME NULL, \`hosted_invoice_url\` TEXT NULL, \`invoice_pdf_url\` TEXT NULL,
      INDEX \`IDX_billing_invoice_org_issued\` (\`organization_id\`, \`issued_at\`), UNIQUE INDEX \`UQ_billing_provider_invoice\` (\`provider_invoice_id\`), PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB`)
    await queryRunner.query(`CREATE TABLE \`integration_connections\` (
      \`id\` INT NOT NULL AUTO_INCREMENT, \`created_date\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_date\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      \`organization_id\` INT NOT NULL, \`provider\` VARCHAR(80) NOT NULL, \`status\` ENUM('pending','connected','error','disconnected') NOT NULL DEFAULT 'pending',
      \`scopes\` JSON NULL, \`external_account_label\` VARCHAR(255) NULL, \`oauth_state\` VARCHAR(64) NULL,
      \`last_sync_at\` DATETIME NULL, \`last_sync_status\` ENUM('success','error') NULL, \`last_error\` TEXT NULL,
      \`connected_at\` DATETIME NULL, \`disconnected_at\` DATETIME NULL,
      UNIQUE INDEX \`UQ_integration_org_provider\` (\`organization_id\`, \`provider\`), PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB`)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`integration_connections\``)
    await queryRunner.query(`DROP TABLE \`billing_invoices\``)
    await queryRunner.query(`DROP TABLE \`billing_accounts\``)
  }
}
