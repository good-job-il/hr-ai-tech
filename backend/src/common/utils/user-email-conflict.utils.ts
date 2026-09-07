import { ConflictException } from "@nestjs/common"

export const EMAIL_ALREADY_EXISTS = "EMAIL_ALREADY_EXISTS"

export function emailAlreadyExistsException(): ConflictException {
  return new ConflictException({
    code: EMAIL_ALREADY_EXISTS,
    message: "A user with this email already exists",
  })
}

export function isUniqueConstraintViolation(
  error: unknown,
  constraintNames: string[] = [],
): boolean {
  const databaseError = error as {
    code?: string
    errno?: number
    message?: string
    sqlMessage?: string
    constraint?: string
    driverError?: {
      code?: string
      errno?: number
      message?: string
      sqlMessage?: string
      constraint?: string
    }
  }

  const code = databaseError?.code ?? databaseError?.driverError?.code

  const errno = databaseError?.errno ?? databaseError?.driverError?.errno

  if (code !== "ER_DUP_ENTRY" && code !== "23505" && errno !== 1062) {
    return false
  }

  if (constraintNames.length === 0) {
    return true
  }

  const details = [
    databaseError?.message,
    databaseError?.sqlMessage,
    databaseError?.constraint,
    databaseError?.driverError?.message,
    databaseError?.driverError?.sqlMessage,
    databaseError?.driverError?.constraint,
  ]
    .filter(Boolean)
    .join(" ")

  return constraintNames.some((name) => details.includes(name))
}
