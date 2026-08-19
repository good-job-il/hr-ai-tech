import { create } from "zustand"
import { FormState, FormConfig } from "@/types/forms"
import { createValidationSchema } from "./validators"

interface FormStoreState {
  forms: Record<string, FormState & { config: FormConfig }>

  initializeForm: (config: FormConfig) => void
  updateFormValue: (formId: string, name: string, value: any) => void
  updateFormError: (formId: string, name: string, error: string) => void
  updateFormTouched: (formId: string, name: string, touched: boolean) => void
  setFormDirty: (formId: string, isDirty: boolean) => void
  setFormSubmitting: (formId: string, isSubmitting: boolean) => void
  setFormValidating: (formId: string, isValidating: boolean) => void
  setAutoSaving: (formId: string, isAutoSaving: boolean) => void
  validateForm: (formId: string) => Promise<boolean>
  validateField: (formId: string, fieldName: string) => Promise<boolean>
  resetForm: (formId: string) => void
  nextStep: (formId: string) => void
  prevStep: (formId: string) => void
  getFormState: (formId: string) => (FormState & { config: FormConfig }) | undefined
}

export const useFormStore = create<FormStoreState>((set, get) => ({
  forms: {},

  initializeForm: (config: FormConfig) => {
    set((state) => ({
      forms: {
        ...state.forms,
        [config.id]: {
          config,
          values: config.initialValues || {},
          errors: {},
          touched: {},
          isDirty: false,
          isSubmitting: false,
          isValidating: false,
          currentStep: 0,
          isAutoSaving: false,
        },
      },
    }))
  },

  updateFormValue: (formId: string, name: string, value: any) => {
    set((state) => {
      const form = state.forms[formId]
      if (!form) return state

      return {
        forms: {
          ...state.forms,
          [formId]: {
            ...form,
            values: { ...form.values, [name]: value },
            isDirty: true,
          },
        },
      }
    })
  },

  updateFormError: (formId: string, name: string, error: string) => {
    set((state) => {
      const form = state.forms[formId]
      if (!form) return state

      return {
        forms: {
          ...state.forms,
          [formId]: {
            ...form,
            errors: error ? { ...form.errors, [name]: error } : { ...form.errors },
          },
        },
      }
    })
  },

  updateFormTouched: (formId: string, name: string, touched: boolean) => {
    set((state) => {
      const form = state.forms[formId]
      if (!form) return state

      return {
        forms: {
          ...state.forms,
          [formId]: {
            ...form,
            touched: { ...form.touched, [name]: touched },
          },
        },
      }
    })
  },

  setFormDirty: (formId: string, isDirty: boolean) => {
    set((state) => {
      const form = state.forms[formId]
      if (!form) return state
      return { forms: { ...state.forms, [formId]: { ...form, isDirty } } }
    })
  },

  setFormSubmitting: (formId: string, isSubmitting: boolean) => {
    set((state) => {
      const form = state.forms[formId]
      if (!form) return state
      return { forms: { ...state.forms, [formId]: { ...form, isSubmitting } } }
    })
  },

  setFormValidating: (formId: string, isValidating: boolean) => {
    set((state) => {
      const form = state.forms[formId]
      if (!form) return state
      return { forms: { ...state.forms, [formId]: { ...form, isValidating } } }
    })
  },

  setAutoSaving: (formId: string, isAutoSaving: boolean) => {
    set((state) => {
      const form = state.forms[formId]
      if (!form) return state
      return { forms: { ...state.forms, [formId]: { ...form, isAutoSaving } } }
    })
  },

  validateForm: async (formId: string) => {
    const form = get().forms[formId]
    if (!form) return false

    const schema = form.config.validationSchema || createValidationSchema(form.config.fields)
    try {
      await schema.parseAsync(form.values)
      set((state) => ({
        forms: {
          ...state.forms,
          [formId]: {
            ...state.forms[formId],
            errors: {},
          },
        },
      }))
      return true
    } catch (error: any) {
      const errors: Record<string, string> = {}
      error.errors?.forEach((err: any) => {
        if (err.path) {
          errors[err.path.join(".")] = err.message
        }
      })
      set((state) => ({
        forms: {
          ...state.forms,
          [formId]: {
            ...state.forms[formId],
            errors,
          },
        },
      }))
      return false
    }
  },

  validateField: async (formId: string, fieldName: string) => {
    const form = get().forms[formId]
    if (!form) return false

    const field = form.config.fields.find((f) => f.name === fieldName)
    if (!field?.validation) return true

    try {
      await field.validation.parseAsync(form.values[fieldName])
      get().updateFormError(formId, fieldName, "")
      return true
    } catch (error: any) {
      get().updateFormError(formId, fieldName, error.message)
      return false
    }
  },

  resetForm: (formId: string) => {
    set((state) => {
      const form = state.forms[formId]
      if (!form) return state

      return {
        forms: {
          ...state.forms,
          [formId]: {
            ...form,
            values: form.config.initialValues || {},
            errors: {},
            touched: {},
            isDirty: false,
            isSubmitting: false,
            isValidating: false,
            currentStep: 0,
          },
        },
      }
    })
  },

  nextStep: (formId: string) => {
    set((state) => {
      const form = state.forms[formId]
      if (!form || form.currentStep === undefined) return state

      return {
        forms: {
          ...state.forms,
          [formId]: {
            ...form,
            currentStep: Math.min(form.currentStep + 1, (form.config.steps?.length || 1) - 1),
          },
        },
      }
    })
  },

  prevStep: (formId: string) => {
    set((state) => {
      const form = state.forms[formId]
      if (!form || form.currentStep === undefined) return state

      return {
        forms: {
          ...state.forms,
          [formId]: {
            ...form,
            currentStep: Math.max(form.currentStep - 1, 0),
          },
        },
      }
    })
  },

  getFormState: (formId: string) => {
    return get().forms[formId]
  },
}))
