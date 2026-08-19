import { z } from "zod"

export interface FormFieldConfig {
  name: string
  type:
    | "text"
    | "email"
    | "password"
    | "number"
    | "textarea"
    | "select"
    | "checkbox"
    | "file"
    | "date"
    | "phone"
  label: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  validation?: z.ZodSchema
  options?: Array<{ label: string; value: string }>
  multiple?: boolean
  accept?: string
  maxSize?: number
  dependsOn?: string
  condition?: (values: Record<string, any>) => boolean
}

export interface FormStep {
  id: string
  title: string
  description?: string
  fields: FormFieldConfig[]
  validation?: z.ZodSchema
}

export interface FormConfig {
  id: string
  name: string
  fields: FormFieldConfig[]
  steps?: FormStep[]
  isMultiStep?: boolean
  submitText?: string
  onSubmit: (values: Record<string, any>) => Promise<any>
  autosave?: boolean
  autosaveDelay?: number
  initialValues?: Record<string, any>
  validationSchema?: z.ZodSchema
}

export interface FormState {
  values: Record<string, any>
  errors: Record<string, string>
  touched: Record<string, boolean>
  isDirty: boolean
  isSubmitting: boolean
  isValidating: boolean
  currentStep?: number
  isAutoSaving?: boolean
}

export interface FormContextType {
  config: FormConfig
  state: FormState
  setValue: (name: string, value: any) => void
  setFieldError: (name: string, error: string) => void
  setTouched: (name: string, touched: boolean) => void
  validate: (name?: string) => Promise<boolean>
  submit: () => Promise<any>
  reset: () => void
  nextStep: () => void
  prevStep: () => void
  isFieldTouched: (name: string) => boolean
  getFieldError: (name: string) => string | undefined
}

export interface FieldProps {
  name: string
  label: string
  value: any
  error?: string
  touched?: boolean
  onChange: (value: any) => void
  onBlur: () => void
  disabled?: boolean
  required?: boolean
}

export interface AsyncSubmitOptions {
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
  retryCount?: number
  retryDelay?: number
  timeout?: number
}
