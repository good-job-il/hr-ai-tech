import { MigrationInterface, QueryRunner } from "typeorm"

export class AddUserProfileCompleted1753500000000 implements MigrationInterface {
  name = "AddUserProfileCompleted1753500000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasColumn("users", "profile_completed"))) {
      await queryRunner.query(`
        ALTER TABLE users
        ADD COLUMN profile_completed TINYINT(1) NOT NULL DEFAULT 0
      `)
    }

    await queryRunner.query(`
      UPDATE users
      SET profile_completed = 1
      WHERE role <> 'candidate'
    `)

    await queryRunner.query(`
      UPDATE users
      INNER JOIN candidate_profiles ON candidate_profiles.user_id = users.id
      SET users.profile_completed = 1
      WHERE users.role = 'candidate'
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn("users", "profile_completed")) {
      await queryRunner.query(`ALTER TABLE users DROP COLUMN profile_completed`)
    }
  }
}
