// src/app/core/validators/custom.validators.ts

import { AbstractControl, ValidationErrors, ValidatorFn, FormGroup } from '@angular/forms';

export class CustomValidators {

  static email(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null; // Let required validator handle empty values
    }

    const email = control.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
      return { email: true };
    }

    if (email.length > 254) {
      return { email: true };
    }

    return null;
  }

  static password(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null; // Let required validator handle empty values
    }

    const password = control.value;
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (password.length > 128) {
      errors.push('Password cannot exceed 128 characters');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check for common weak patterns
    const commonPatterns = [
      /password/i,
      /123456/,
      /qwerty/i,
      /(.)\1{2,}/, // Three or more consecutive identical characters
    ];

    if (commonPatterns.some(pattern => pattern.test(password))) {
      errors.push('Password contains common patterns and is not secure');
    }

    if (errors.length > 0) {
      return { weakPassword: errors.join('. ') };
    }

    return null;
  }

  static phone(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null; // Optional field
    }

    const phone = control.value.trim();
    
    if (!phone) {
      return null;
    }

    // Remove all non-digit characters for validation
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      return { phone: true };
    }

    // Basic international format validation
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(phone)) {
      return { phone: true };
    }

    return null;
  }

  static name(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null; // Let required validator handle empty values
    }

    const name = control.value.trim();
    
    if (name.length < 2) {
      return { name: true };
    }

    if (name.length > 100) {
      return { name: true };
    }

    // Allow letters, spaces, hyphens, and apostrophes
    const nameRegex = /^[a-zA-Z\s\-']+$/;
    if (!nameRegex.test(name)) {
      return { pattern: true };
    }

    return null;
  }

  static passwordMatch(passwordFieldName: string, confirmPasswordFieldName: string): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      if (!(formGroup instanceof FormGroup)) {
        return null;
      }

      const password = formGroup.get(passwordFieldName);
      const confirmPassword = formGroup.get(confirmPasswordFieldName);

      if (!password || !confirmPassword) {
        return null;
      }

      if (confirmPassword.errors && !confirmPassword.errors['passwordMismatch']) {
        return null;
      }

      if (password.value !== confirmPassword.value) {
        confirmPassword.setErrors({ passwordMismatch: true });
        return { passwordMismatch: true };
      } else {
        const errors = confirmPassword.errors;
        if (errors) {
          delete errors['passwordMismatch'];
          confirmPassword.setErrors(Object.keys(errors).length ? errors : null);
        }
        return null;
      }
    };
  }

  static whitespace(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }

    const value = control.value.toString();
    if (value.trim().length === 0) {
      return { whitespace: true };
    }

    return null;
  }

  static noSpecialChars(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }

    const specialCharsRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
    if (specialCharsRegex.test(control.value)) {
      return { noSpecialChars: true };
    }

    return null;
  }

  static strongPassword(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }

    const password = control.value;
    const hasNumber = /[0-9]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const hasMinLength = password.length >= 8;

    const valid = hasNumber && hasUpper && hasLower && hasSpecial && hasMinLength;

    if (!valid) {
      const missing = [];
      if (!hasMinLength) missing.push('8 characters');
      if (!hasNumber) missing.push('number');
      if (!hasUpper) missing.push('uppercase letter');
      if (!hasLower) missing.push('lowercase letter');
      if (!hasSpecial) missing.push('special character');

      return { 
        strongPassword: {
          message: `Password must contain: ${missing.join(', ')}`,
          missing
        }
      };
    }

        return null;
    }
}