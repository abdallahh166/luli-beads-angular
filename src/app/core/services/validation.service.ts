// src/app/core/services/validation.service.ts

import { Injectable } from '@angular/core';
import { 
  IPasswordValidator, 
  IEmailValidator 
} from '../interfaces/auth.interface';

@Injectable({
  providedIn: 'root'
})
export class ValidationService implements IPasswordValidator, IEmailValidator {

  validateEmail(email: string): { isValid: boolean; error?: string } {
    if (!email || !email.trim()) {
      return { isValid: false, error: 'Email is required' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }

    if (email.length > 254) {
      return { isValid: false, error: 'Email address is too long' };
    }

    return { isValid: true };
  }

  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!password) {
      errors.push('Password is required');
      return { isValid: false, errors };
    }

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

    // Check for common patterns
    if (this.hasCommonPatterns(password)) {
      errors.push('Password contains common patterns and is not secure');
    }

    return { isValid: errors.length === 0, errors };
  }

  validatePhone(phone: string): { isValid: boolean; error?: string } {
    if (!phone || !phone.trim()) {
      return { isValid: false, error: 'Phone number is required' };
    }

    // Remove all non-digit characters for validation
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      return { isValid: false, error: 'Phone number must be between 10 and 15 digits' };
    }

    // Basic international format validation
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(phone)) {
      return { isValid: false, error: 'Please enter a valid phone number' };
    }

    return { isValid: true };
  }

  validateName(name: string): { isValid: boolean; error?: string } {
    if (!name || !name.trim()) {
      return { isValid: false, error: 'Name is required' };
    }

    if (name.trim().length < 2) {
      return { isValid: false, error: 'Name must be at least 2 characters long' };
    }

    if (name.length > 100) {
      return { isValid: false, error: 'Name cannot exceed 100 characters' };
    }

    // Allow letters, spaces, hyphens, and apostrophes
    const nameRegex = /^[a-zA-Z\s\-']+$/;
    if (!nameRegex.test(name)) {
      return { isValid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
    }

    return { isValid: true };
  }

  private hasCommonPatterns(password: string): boolean {
    const commonPatterns = [
      /password/i,
      /123456/,
      /qwerty/i,
      /abc/i,
      /(.)\1{2,}/, // Three or more consecutive identical characters
    ];

    return commonPatterns.some(pattern => pattern.test(password));
  }
}