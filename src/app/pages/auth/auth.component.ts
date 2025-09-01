// src/app/pages/auth/auth.component.ts

import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { AuthRepository } from '../../core/repositories/auth.repository';
import { ValidationService } from '../../core/services/validation.service';
import { 
  SignInDTO, 
  SignUpDTO, 
  AuthenticationStatus 
} from '../../core/interfaces/auth.interface';

// Custom validators
import { CustomValidators } from '../../core/validators/custom.validators';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css'
})
export class AuthComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly authRepository = inject(AuthRepository);
  private readonly validationService = inject(ValidationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  // State
  activeTab: 'signin' | 'signup' = 'signin';
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;
  
  // Form groups
  signInForm: FormGroup;
  signUpForm: FormGroup;
  
  // Error handling
  authError: string | null = null;
  successMessage: string | null = null;
  
  // Enum reference for template
  readonly AuthStatus = AuthenticationStatus;

  constructor() {
    this.signInForm = this.createSignInForm();
    this.signUpForm = this.createSignUpForm();
  }

  ngOnInit(): void {
    this.setupAuthStateSubscription();
    this.handleRouteParams();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Form creation
  private createSignInForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, CustomValidators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  private createSignUpForm(): FormGroup {
    return this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2), CustomValidators.name]],
      email: ['', [Validators.required, CustomValidators.email]],
      phone: ['', [CustomValidators.phone]], // Optional
      password: ['', [Validators.required, CustomValidators.password]],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]]
    }, { 
      validators: CustomValidators.passwordMatch('password', 'confirmPassword')
    });
  }

  // Subscriptions
  private setupAuthStateSubscription(): void {
    this.authService.authState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.isLoading = state.status === AuthenticationStatus.LOADING;
        
        if (state.isAuthenticated) {
          this.handleSuccessfulAuth();
        }
        
        if (state.error) {
          this.authError = state.error.message;
        }
      });
  }

  private handleRouteParams(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['tab']) {
          this.activeTab = params['tab'] === 'signup' ? 'signup' : 'signin';
        }
        
        if (params['message']) {
          this.successMessage = params['message'];
        }
        
        if (params['error']) {
          this.authError = params['error'];
        }
      });
  }

  // Tab management
  setActiveTab(tab: 'signin' | 'signup'): void {
    this.activeTab = tab;
    this.clearMessages();
    this.resetForms();
    
    // Update URL without navigation
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge'
    });
  }

  // Form submissions
  async onSignIn(): Promise<void> {
    if (this.signInForm.invalid) {
      this.markFormGroupTouched(this.signInForm);
      return;
    }

    this.clearMessages();
    const formValue = this.signInForm.value;
    
    const signInData: SignInDTO = {
      email: formValue.email.trim(),
      password: formValue.password,
      rememberMe: formValue.rememberMe
    };

    const result = await this.authService.signIn(signInData);
    
    if (!result.success && result.error) {
      this.authError = result.error.message;
      
      // Handle specific errors
      if (result.error.code === 'EMAIL_NOT_CONFIRMED') {
        this.showEmailVerificationMessage(signInData.email);
      }
    }
  }

  async onSignUp(): Promise<void> {
    if (this.signUpForm.invalid) {
      this.markFormGroupTouched(this.signUpForm);
      return;
    }

    this.clearMessages();
    const formValue = this.signUpForm.value;
    
    const signUpData: SignUpDTO = {
      email: formValue.email.trim(),
      password: formValue.password,
      fullName: formValue.fullName.trim(),
      phone: formValue.phone?.trim()
    };

    const result = await this.authService.signUp(signUpData);
    
    if (result.success && result.data?.needsVerification) {
      this.successMessage = 'Account created successfully! Please check your email to verify your account.';
      this.setActiveTab('signin');
    } else if (!result.success && result.error) {
      this.authError = result.error.message;
    }
  }

  // Social authentication
  async signInWithGoogle(): Promise<void> {
    try {
      await this.authRepository.signInWithGoogle();
    } catch (error) {
      this.authError = 'Failed to sign in with Google. Please try again.';
    }
  }

  async signInWithFacebook(): Promise<void> {
    try {
      await this.authRepository.signInWithFacebook();
    } catch (error) {
      this.authError = 'Failed to sign in with Facebook. Please try again.';
    }
  }

  // Utility methods
  private handleSuccessfulAuth(): void {
    const redirectUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    this.router.navigate([redirectUrl]);
  }

  private showEmailVerificationMessage(email: string): void {
    this.successMessage = `Please check your email (${email}) and click the verification link to activate your account.`;
  }

  private clearMessages(): void {
    this.authError = null;
    this.successMessage = null;
  }

  private resetForms(): void {
    this.signInForm.reset({
      email: '',
      password: '',
      rememberMe: false
    });
    
    this.signUpForm.reset({
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      
      if (control && 'controls' in control) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }

  // Template helpers
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  getFieldError(formGroup: FormGroup, fieldName: string): string | null {
    const field = formGroup.get(fieldName);
    
    if (field && field.invalid && (field.dirty || field.touched)) {
      const errors = field.errors;
      
      if (errors?.['required']) {
        return this.getRequiredErrorMessage(fieldName);
      }
      
      if (errors?.['email']) {
        return 'Please enter a valid email address';
      }
      
      if (errors?.['minlength']) {
        const requiredLength = errors['minlength'].requiredLength;
        return `Must be at least ${requiredLength} characters long`;
      }
      
      if (errors?.['pattern']) {
        return this.getPatternErrorMessage(fieldName);
      }
      
      if (errors?.['passwordMismatch']) {
        return 'Passwords do not match';
      }
      
      if (errors?.['weakPassword']) {
        return errors['weakPassword'];
      }
      
      return 'Invalid input';
    }
    
    return null;
  }

  private getRequiredErrorMessage(fieldName: string): string {
    const messages: Record<string, string> = {
      email: 'Email is required',
      password: 'Password is required',
      fullName: 'Full name is required',
      confirmPassword: 'Please confirm your password',
      acceptTerms: 'You must accept the terms and conditions'
    };
    
    return messages[fieldName] || `${fieldName} is required`;
  }

  private getPatternErrorMessage(fieldName: string): string {
    const messages: Record<string, string> = {
      phone: 'Please enter a valid phone number',
      fullName: 'Name can only contain letters, spaces, and hyphens'
    };
    
    return messages[fieldName] || 'Invalid format';
  }

  isFieldInvalid(formGroup: FormGroup, fieldName: string): boolean {
    const field = formGroup.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
}