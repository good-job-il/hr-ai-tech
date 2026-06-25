import { useCallback, useEffect, useRef } from 'react';
import { useFormStore } from '@/lib/forms/formStore';
import { FormConfig, FormContextType, FormFieldConfig } from '@/types/forms';

export const useForm = (config: FormConfig): FormContextType => {
  const formStore = useFormStore();
  const autosaveTimeoutRef = useRef<NodeJS.Timeout>();

  const state = formStore.getFormState(config.id);

  useEffect(() => {
    formStore.initializeForm(config);

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [config, formStore]);

  const setValue = useCallback((name: string, value: any) => {
    formStore.updateFormValue(config.id, name, value);

    if (config.autosave) {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }

      formStore.setAutoSaving(config.id, true);
      autosaveTimeoutRef.current = setTimeout(async () => {
        try {
          await config.onSubmit(state?.values || {});
        } catch (error) {
          console.error('Autosave failed:', error);
        } finally {
          formStore.setAutoSaving(config.id, false);
        }
      }, config.autosaveDelay || 2000);
    }
  }, [config, formStore, state?.values]);

  const setFieldError = useCallback((name: string, error: string) => {
    formStore.updateFormError(config.id, name, error);
  }, [config.id, formStore]);

  const setTouched = useCallback((name: string, touched: boolean) => {
    formStore.updateFormTouched(config.id, name, touched);
  }, [config.id, formStore]);

  const validate = useCallback(async (name?: string) => {
    if (name) {
      return await formStore.validateField(config.id, name);
    }
    return await formStore.validateForm(config.id);
  }, [config.id, formStore]);

  const submit = useCallback(async () => {
    formStore.setFormValidating(config.id, true);
    const isValid = await validate();

    if (!isValid) {
      formStore.setFormValidating(config.id, false);
      return Promise.reject(new Error('Validation failed'));
    }

    formStore.setFormSubmitting(config.id, true);
    try {
      const result = await config.onSubmit(state?.values || {});
      formStore.setFormDirty(config.id, false);
      return result;
    } finally {
      formStore.setFormSubmitting(config.id, false);
      formStore.setFormValidating(config.id, false);
    }
  }, [config, formStore, validate, state?.values]);

  const reset = useCallback(() => {
    formStore.resetForm(config.id);
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }
  }, [config.id, formStore]);

  const nextStep = useCallback(() => {
    formStore.nextStep(config.id);
  }, [config.id, formStore]);

  const prevStep = useCallback(() => {
    formStore.prevStep(config.id);
  }, [config.id, formStore]);

  const isFieldTouched = useCallback((name: string) => {
    return state?.touched[name] || false;
  }, [state?.touched]);

  const getFieldError = useCallback((name: string) => {
    return state?.errors[name];
  }, [state?.errors]);

  return {
    config,
    state: state || {
      values: {},
      errors: {},
      touched: {},
      isDirty: false,
      isSubmitting: false,
      isValidating: false,
    },
    setValue,
    setFieldError,
    setTouched,
    validate,
    submit,
    reset,
    nextStep,
    prevStep,
    isFieldTouched,
    getFieldError,
  };
};