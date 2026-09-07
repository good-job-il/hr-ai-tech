import { MigrationInterface, QueryRunner, TableIndex } from "typeorm"

export class UniqueUserEmail1753300000000 implements MigrationInterface {
  name = "UniqueUserEmail1753300000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    const users = await queryRunner.getTable("users")

    if (!users) {
      throw new Error("Cannot add unique email constraint: users table does not exist")
    }

    const uniqueEmailIndex = users.indices.find(
      (index) =>
        index.isUnique && index.columnNames.length === 1 && index.columnNames[0] === "email",
    )

    if (uniqueEmailIndex) {
      return
    }

    const duplicateEmails = (await queryRunner.query(`
      SELECT email
      FROM users
      GROUP BY email
      HAVING COUNT(*) > 1
      LIMIT 1
    `)) as Array<{ email: string }>

    if (duplicateEmails.length > 0) {
      throw new Error(
        "Cannot add unique email constraint: users table contains duplicate email values",
      )
    }

    await queryRunner.createIndex(
      users,
      new TableIndex({
        name: "UQ_users_email",
        columnNames: ["email"],
        isUnique: true,
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const users = await queryRunner.getTable("users")

    const emailIndex = users?.indices.find((index) => index.name === "UQ_users_email")

    if (users && emailIndex?.isUnique) {
      await queryRunner.dropIndex(users, emailIndex)
    }
  }
}
