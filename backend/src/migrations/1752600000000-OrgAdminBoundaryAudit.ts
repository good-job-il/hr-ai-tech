import { MigrationInterface, QueryRunner } from 'typeorm';

export class OrgAdminBoundaryAudit1752600000000 implements MigrationInterface {
  name = 'OrgAdminBoundaryAudit1752600000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`audit_logs\`
      MODIFY COLUMN \`entity_type\` ENUM(
        'Candidate','Application','Job','Company','CandidateDocument',
        'CompensationPlan','User','Organization','Interview','CommunicationLog',
        'AgencyTeam','AgencyInvitation','PermissionMatrix','RoleTemplate','Billing','Integration'
      ) NOT NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`audit_logs\`
      MODIFY COLUMN \`entity_type\` ENUM(
        'Candidate','Application','Job','Company','CandidateDocument',
        'CompensationPlan','User','Organization','Interview','CommunicationLog',
        'AgencyTeam','AgencyInvitation'
      ) NOT NULL
    `);
  }
}
