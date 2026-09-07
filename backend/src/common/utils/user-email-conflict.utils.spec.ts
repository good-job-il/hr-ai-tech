import { ConflictException } from "@nestjs/common"
import {
  EMAIL_ALREADY_EXISTS,
  emailAlreadyExistsException,
  isUniqueConstraintViolation,
} from "./user-email-conflict.utils"

describe("user email conflict helpers", () => {
  it.each([{ code: "ER_DUP_ENTRY" }, { errno: 1062 }, { code: "23505" }])(
    "recognizes a database unique constraint violation",
    (error) => {
      expect(isUniqueConstraintViolation(error)).toBe(true)
    },
  )

  it("can identify the violated constraint", () => {
    const error = {
      driverError: {
        code: "ER_DUP_ENTRY",
        sqlMessage: "Duplicate entry for key 'users.IDX_user_email'",
      },
    }

    expect(isUniqueConstraintViolation(error, ["IDX_user_email"])).toBe(true)
    expect(isUniqueConstraintViolation(error, ["UQ_users_staffing_org_admin"])).toBe(false)
  })

  it("recognizes a nested database unique constraint violation", () => {
    const error = { driverError: { code: "ER_DUP_ENTRY" } }

    expect(isUniqueConstraintViolation(error)).toBe(true)
  })

  it("does not classify unrelated database failures as duplicates", () => {
    expect(isUniqueConstraintViolation({ code: "ER_LOCK_DEADLOCK" })).toBe(false)
  })

  it("returns a stable API error code for the client", () => {
    const exception = emailAlreadyExistsException()

    expect(exception).toBeInstanceOf(ConflictException)
    expect(exception.getStatus()).toBe(409)
    expect(exception.getResponse()).toEqual({
      code: EMAIL_ALREADY_EXISTS,
      message: "A user with this email already exists",
    })
  })
})
