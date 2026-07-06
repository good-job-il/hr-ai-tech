import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Remove 'super_admin' from all ENUM columns across the database.
 * Any existing users with role='super_admin' are migrated to role='admin'.
 */
export class RemoveSuperAdminRole1751500000000 implements MigrationInterface {
  name = 'RemoveSuperAdminRole1751500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Migrate existing super_admin users → admin
    await queryRunner.query(`
      UPDATE \`users\` SET \`role\` = 'admin' WHERE \`role\` = 'super_admin';
    `);

    // 2. Remove 'super_admin' from users.role enum
    await queryRunner.query(`
      ALTER TABLE \`users\`
      MODIFY COLUMN \`role\` ENUM(
        'candidate','employer','recruiter','team_manager',
        'recruitment_manager','org_admin','admin',
        'hr_manager','internal_recruiter'
      ) NOT NULL DEFAULT 'candidate';
    `);

    // 3. Migrate any application_timelines records
    await queryRunner.query(`
      UPDATE \`application_timelines\`
      SET \`performed_by_role\` = 'admin'
      WHERE \`performed_by_role\` = 'super_admin';
    `);

    // 4. Remove 'super_admin' from application_timelines.performed_by_role enum
    await queryRunner.query(`
      ALTER TABLE \`application_timelines\`
      MODIFY COLUMN \`performed_by_role\` ENUM(
        'candidate','employer','recruiter','team_manager',
        'recruitment_manager','org_admin','admin'
      ) NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore 'super_admin' to application_timelines enum
    await queryRunner.query(`
      ALTER TABLE \`application_timelines\`
      MODIFY COLUMN \`performed_by_role\` ENUM(
        'candidate','employer','recruiter','team_manager',
        'recruitment_manager','org_admin','admin','super_admin'
      ) NULL;
    `);

    // Restore 'super_admin' to users.role enum
    await queryRunner.query(`
      ALTER TABLE \`users\`
      MODIFY COLUMN \`role\` ENUM(
        'candidate','employer','recruiter','team_manager',
        'recruitment_manager','org_admin','admin','super_admin',
        'hr_manager','internal_recruiter'
      ) NOT NULL DEFAULT 'candidate';
    `);
  }
}

