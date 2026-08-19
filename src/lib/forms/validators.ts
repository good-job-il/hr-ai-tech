import { z } from "zod"

export const emailValidator = z.string().email("Invalid email address")
export const phoneValidator = z.string().regex(/^[+\d\s\-()]{10,}$/, "Invalid phone number")
export const urlValidator = z.string().url("Invalid URL")
export const passwordValidator = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain uppercase letter")
  .regex(/[a-z]/, "Password must contain lowercase letter")
  .regex(/\d/, "Password must contain number")

export const fileValidator = (maxSize: number = 5242880, accept?: string) => {
  return z
    .instanceof(File)
    .refine(
      (file) => file.size <= maxSize,
      `File size must be less than ${maxSize / 1024 / 1024}MB`,
    )
    .refine(
      (file) => !accept || accept.split(",").some((type) => file.type.includes(type)),
      `File type not accepted`,
    )
}

export const createValidationSchema = (fields: any[]) => {
  const shape: Record<string, any> = {}

  fields.forEach((field) => {
    let schema: any

    switch (field.type) {
      case "email":
        schema = emailValidator
        break
      case "phone":
        schema = phoneValidator
        break
      case "url":
        schema = urlValidator
        break
      case "password":
        schema = passwordValidator
        break
      case "number":
        schema = z.number()
        break
      case "checkbox":
        schema = z.boolean()
        break
      case "file":
        schema = fileValidator(field.maxSize, field.accept)
        break
      case "date":
        schema = z.string().datetime()
        break
      default:
        schema = z.string()
    }

    if (!field.required) {
      schema = schema.optional()
    }

    if (field.validation) {
      schema = field.validation
    }

    shape[field.name] = schema
  })

  return z.object(shape)
}
