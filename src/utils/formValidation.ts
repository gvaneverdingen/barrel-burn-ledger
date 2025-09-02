/**
 * Enhanced form validation utilities with real-time feedback
 */
import React from 'react';

export interface ValidationRule {
  test: (value: string) => boolean;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export const createValidator = (rules: ValidationRule[]) => {
  return (value: string): ValidationResult => {
    const errors: string[] = [];
    
    for (const rule of rules) {
      if (!rule.test(value)) {
        errors.push(rule.message);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  };
};

// Common validation rules
export const emailRules: ValidationRule[] = [
  {
    test: (value) => value.length > 0,
    message: 'Email is required'
  },
  {
    test: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: 'Please enter a valid email address'
  }
];

export const passwordRules: ValidationRule[] = [
  {
    test: (value) => value.length >= 8,
    message: 'Password must be at least 8 characters long'
  },
  {
    test: (value) => /[A-Z]/.test(value),
    message: 'Password must contain at least one uppercase letter'
  },
  {
    test: (value) => /[a-z]/.test(value),
    message: 'Password must contain at least one lowercase letter'
  },
  {
    test: (value) => /\d/.test(value),
    message: 'Password must contain at least one number'
  }
];

export const nameRules: ValidationRule[] = [
  {
    test: (value) => value.trim().length > 0,
    message: 'Name is required'
  },
  {
    test: (value) => value.trim().length >= 2,
    message: 'Name must be at least 2 characters'
  },
  {
    test: (value) => /^[a-zA-Z\s'-]+$/.test(value.trim()),
    message: 'Name can only contain letters, spaces, hyphens, and apostrophes'
  }
];

// Create validators
export const validateEmail = createValidator(emailRules);
export const validatePassword = createValidator(passwordRules);
export const validateName = createValidator(nameRules);

/**
 * Real-time form validation hook
 */
export const useFormValidation = <T extends Record<string, string>>(
  initialValues: T,
  validators: Partial<Record<keyof T, (value: string) => ValidationResult>>
) => {
  const [values, setValues] = React.useState(initialValues);
  const [errors, setErrors] = React.useState<Partial<Record<keyof T, string[]>>>({});
  const [touched, setTouched] = React.useState<Partial<Record<keyof T, boolean>>>({});

  const validateField = (field: keyof T, value: string) => {
    const validator = validators[field];
    if (!validator) return { isValid: true, errors: [], warnings: [] };
    
    return validator(value);
  };

  const setValue = (field: keyof T, value: string) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    // Validate on change if field has been touched
    if (touched[field]) {
      const result = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: result.errors }));
    }
  };

  const setFieldTouched = (field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Validate when field becomes touched
    const result = validateField(field, values[field]);
    setErrors(prev => ({ ...prev, [field]: result.errors }));
  };

  const validateAll = (): boolean => {
    const newErrors: Partial<Record<keyof T, string[]>> = {};
    let isFormValid = true;

    for (const [field, value] of Object.entries(values)) {
      const result = validateField(field as keyof T, value as string);
      if (!result.isValid) {
        newErrors[field as keyof T] = result.errors;
        isFormValid = false;
      }
    }

    setErrors(newErrors);
    return isFormValid;
  };

  return {
    values,
    errors,
    touched,
    setValue,
    setFieldTouched,
    validateAll,
    isValid: Object.keys(errors).every(key => 
      !errors[key as keyof T] || errors[key as keyof T]!.length === 0
    )
  };
};