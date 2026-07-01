import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase41751300000000 implements MigrationInterface {
  name = 'Phase41751300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Employer company-profile fields on `users` (used by updateCompanyProfile)
    await queryRunner.query(`
      ALTER TABLE \`users\`
        ADD COLUMN \`company_culture\` TEXT NULL,
        ADD COLUMN \`benefits\` JSON NULL,
        ADD COLUMN \`gallery_urls\` JSON NULL,
        ADD COLUMN \`video_url\` TEXT NULL,
        ADD COLUMN \`testimonials\` JSON NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`users\`
        DROP COLUMN \`company_culture\`,
        DROP COLUMN \`benefits\`,
        DROP COLUMN \`gallery_urls\`,
        DROP COLUMN \`video_url\`,
        DROP COLUMN \`testimonials\`;
    `);
  }
}

