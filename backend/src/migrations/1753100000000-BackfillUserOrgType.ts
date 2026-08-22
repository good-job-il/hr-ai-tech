import { MigrationInterface, QueryRunner } from "typeorm"

export class BackfillUserOrgType1753100000000 implements MigrationInterface {
  name = "BackfillUserOrgType1753100000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE users user_record
      INNER JOIN organizations organization
        ON organization.id = user_record.organization_id
      SET user_record.org_type = organization.org_type
      WHERE user_record.organization_id IS NOT NULL
        AND (
          user_record.org_type IS NULL
          OR user_record.org_type <> organization.org_type
        )
    `)
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // org_type is server-owned tenant identity. Reverting the backfill would
    // recreate invalid authorization context, so this data repair is retained.
  }
}
