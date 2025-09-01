// src/app/pages/account/account.component.ts

import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { ValidationService } from '../../core/services/validation.service';
import { CustomValidators } from '../../core/validators/custom.validators';
import { HasRoleDirective } from '../../core/directives/has-role.directive';
import { HasPermissionDirective } from '../../core/directives/has-permission.directive';
import { 
  UserProfile, 
  UpdateProfileDTO, 
  ChangePasswordDTO,
  UserRole,
  AuthUser,
  AuthenticationStatus
} from '../../core/interfaces/auth.interface';

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  order_items: Array<{
    id: string;
    quantity: number;
    price: number;
    selected_color?: string;
    selected_handle?: string;
    custom_name?: string;
    products: {
      name: string;
      image_url: string;
    };
  }>;
}

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HasRoleDirective,
    HasPermissionDirective
  ],
  templateUrl: './account.component.html',
  styleUrl: './account.component.css'
})
export class AccountComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly validationService = inject(ValidationService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  // State
  activeTab: 'profile' | 'orders' | 'settings' | 'security' = 'profile';
  currentUser: AuthUser | null = null;
  currentProfile: UserProfile | null = null;
  orders: Order[] = [];
  
  // Loading states
  isLoadingProfile = false;
  isLoadingOrders = false;
  isUpdatingProfile = false;
  isChangingPassword = false;
  isSigningOut = false;

  // Forms
  profileForm: FormGroup;
  passwordForm: FormGroup;

  // Messages
  successMessage: string | null = null;
  errorMessage: string | null = null;

  // Enums for template
  readonly UserRole = UserRole;
  readonly AuthStatus = AuthenticationStatus;

  constructor() {
    this.profileForm = this.createProfileForm();
    this.passwordForm = this.createPasswordForm();
  }

  ngOnInit(): void {
    this.setupAuthStateSubscription();
    this.loadUserData();
    this.loadOrders();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Form creation
  private createProfileForm(): FormGroup {
    return this.fb.group({
      full_name: ['', [Validators.required, CustomValidators.name]],
      phone: ['', [CustomValidators.phone]],
      email: [{ value: '', disabled: true }] // Email is read-only
    });
  }

  private createPasswordForm(): FormGroup {
    return this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, CustomValidators.password]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: CustomValidators.passwordMatch('newPassword', 'confirmPassword')
    });
  }

  // Subscriptions and data loading
  private setupAuthStateSubscription(): void {
    this.authService.authState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.currentUser = state.user;
        this.currentProfile = state.profile;
        
        if (state.user && state.profile) {
          this.updateProfileForm(state.profile);
        }

        if (!state.isAuthenticated && state.status !== AuthenticationStatus.LOADING) {
          this.router.navigate(['/auth']);
        }
      });
  }

  private updateProfileForm(profile: UserProfile): void {
    this.profileForm.patchValue({
      full_name: profile.full_name || '',
      phone: profile.phone || '',
      email: profile.email
    });
  }

  private async loadUserData(): Promise<void> {
    this.isLoadingProfile = true;
    
    try {
      // Data is loaded through auth state subscription
      // This method exists for consistency and potential future enhancements
    } catch (error) {
      this.showError('Failed to load user data');
    } finally {
      this.isLoadingProfile = false;
    }
  }

  private async loadOrders(): Promise<void> {
    this.isLoadingOrders = true;
    
    try {
      // Mock orders data - in real app, this would come from an order service
      await this.simulateApiDelay(1000);
      
      this.orders = [
        {
          id: 'ORD-001',
          total_amount: 149.99,
          status: 'completed',
          created_at: '2024-01-15T10:30:00Z',
          order_items: [
            {
              id: '1',
              quantity: 1,
              price: 149.99,
              selected_color: 'Rose Gold',
              selected_handle: 'Chain Strap',
              products: {
                name: 'Rose Gold Beaded Clutch',
                image_url: '/assets/product-rose-bag.jpg'
              }
            }
          ]
        },
        {
          id: 'ORD-002',
          total_amount: 89.99,
          status: 'shipped',
          created_at: '2024-01-10T14:20:00Z',
          order_items: [
            {
              id: '2',
              quantity: 1,
              price: 89.99,
              selected_color: 'Black',
              products: {
                name: 'Black Beaded Evening Bag',
                image_url: '/assets/product-black-bag.jpg'
              }
            }
          ]
        }
      ];
    } catch (error) {
      this.showError('Failed to load orders');
    } finally {
      this.isLoadingOrders = false;
    }
  }

  // Tab management
  setActiveTab(tab: 'profile' | 'orders' | 'settings' | 'security'): void {
    this.activeTab = tab;
    this.clearMessages();
    
    if (tab === 'orders' && this.orders.length === 0) {
      this.loadOrders();
    }
  }

  // Profile management
  async updateProfile(): Promise<void> {
    if (this.profileForm.invalid) {
      this.markFormGroupTouched(this.profileForm);
      return;
    }

    this.isUpdatingProfile = true;
    this.clearMessages();

    try {
      const formValue = this.profileForm.value;
      const updateData: UpdateProfileDTO = {
        full_name: formValue.full_name?.trim(),
        phone: formValue.phone?.trim()
      };

      const result = await this.authService.updateProfile(updateData);

      if (result.success) {
        this.showSuccess('Profile updated successfully');
      } else {
        this.showError(result.error?.message || 'Failed to update profile');
      }
    } catch (error) {
      this.showError('An unexpected error occurred');
    } finally {
      this.isUpdatingProfile = false;
    }
  }

  // Password management
  async changePassword(): Promise<void> {
    if (this.passwordForm.invalid) {
      this.markFormGroupTouched(this.passwordForm);
      return;
    }

    this.isChangingPassword = true;
    this.clearMessages();

    try {
      const formValue = this.passwordForm.value;
      const changePasswordData: ChangePasswordDTO = {
        currentPassword: formValue.currentPassword,
        newPassword: formValue.newPassword,
        confirmPassword: formValue.confirmPassword
      };

      const result = await this.authService.updatePassword(changePasswordData);

      if (result.success) {
        this.showSuccess('Password changed successfully');
        this.passwordForm.reset();
      } else {
        this.showError(result.error?.message || 'Failed to change password');
      }
    } catch (error) {
      this.showError('An unexpected error occurred');
    } finally {
      this.isChangingPassword = false;
    }
  }

  // Account actions
  async handleSignOut(): Promise<void> {
    if (!confirm('Are you sure you want to sign out?')) {
      return;
    }

    this.isSigningOut = true;

    try {
      await this.authService.signOut();
      this.router.navigate(['/']);
    } catch (error) {
      this.showError('Failed to sign out');
    } finally {
      this.isSigningOut = false;
    }
  }

  async deleteAccount(): Promise<void> {
    const confirmation = prompt(
      'Are you sure you want to delete your account? This action cannot be undone. Type "DELETE" to confirm:'
    );

    if (confirmation !== 'DELETE') {
      return;
    }

    // Implementation would depend on your backend API
    this.showError('Account deletion is not implemented yet');
  }

  // Navigation
  navigateToHome(): void {
    this.router.navigate(['/']);
  }

  navigateToSettings(): void {
    this.setActiveTab('settings');
  }

  // Utility methods
  private showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = null;
    this.scrollToTop();
  }

  private showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = null;
    this.scrollToTop();
  }

  private clearMessages(): void {
    this.successMessage = null;
    this.errorMessage = null;
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  private async simulateApiDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Template helpers
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
      
      if (errors?.['phone']) {
        return 'Please enter a valid phone number';
      }
      
      if (errors?.['name'] || errors?.['pattern']) {
        return 'Please enter a valid name';
      }
      
      if (errors?.['weakPassword']) {
        return errors['weakPassword'];
      }
      
      if (errors?.['passwordMismatch']) {
        return 'Passwords do not match';
      }
      
      return 'Invalid input';
    }
    
    return null;
  }

  private getRequiredErrorMessage(fieldName: string): string {
    const messages: Record<string, string> = {
      full_name: 'Full name is required',
      currentPassword: 'Current password is required',
      newPassword: 'New password is required',
      confirmPassword: 'Please confirm your new password'
    };
    
    return messages[fieldName] || `${fieldName} is required`;
  }

  isFieldInvalid(formGroup: FormGroup, fieldName: string): boolean {
    const field = formGroup.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatOrderId(orderId: string): string {
    return orderId.length > 8 ? orderId.slice(0, 8) : orderId;
  }

  getRoleDisplayName(role: UserRole): string {
    const names = {
      [UserRole.USER]: 'User',
      [UserRole.MODERATOR]: 'Moderator',
      [UserRole.ADMIN]: 'Administrator'
    };
    
    return names[role] || 'Unknown';
  }

  getUserInitials(): string {
    if (!this.currentProfile?.full_name) {
      return this.currentUser?.email?.charAt(0).toUpperCase() || 'U';
    }
    
    const names = this.currentProfile.full_name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    
    return names[0][0].toUpperCase();
  }
}