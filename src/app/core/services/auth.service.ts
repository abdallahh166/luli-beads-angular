// src/app/core/services/auth.service.ts

import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, from, throwError, timer } from 'rxjs';
import { map, tap, catchError, switchMap, shareReplay } from 'rxjs/operators';
import { 
  AuthState, 
  IAuthService, 
  AuthResult, 
  SignUpDTO, 
  SignInDTO, 
  UpdateProfileDTO, 
  ChangePasswordDTO,
  AuthUser, 
  UserProfile, 
  UserRole,
  AuthenticationStatus,
  AuthError,
  AuthEventType
} from '../interfaces/auth.interface';
import { AuthRepository } from '../repositories/auth.repository';
import { ProfileRepository } from '../repositories/profile.repository';
import { AuthEventService } from './auth-event.service';
import { ValidationService } from './validation.service';
import { TokenStorageService } from './token-storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService implements IAuthService {
  private readonly authRepository = inject(AuthRepository);
  private readonly profileRepository = inject(ProfileRepository);
  private readonly eventService = inject(AuthEventService);
  private readonly validationService = inject(ValidationService);
  private readonly tokenStorage = inject(TokenStorageService);

  private readonly initialState: AuthState = {
    status: AuthenticationStatus.IDLE,
    user: null,
    session: null,
    profile: null,
    isAuthenticated: false,
    isAdmin: false,
    isModerator: false,
    error: null
  };

  private readonly authStateSubject = new BehaviorSubject<AuthState>(this.initialState);
  public readonly authState$ = this.authStateSubject.asObservable().pipe(
    shareReplay(1)
  );

  private sessionRefreshTimer?: any;

  constructor() {
    this.setupSessionRefresh();
  }

  /**
   * Initialize authentication state
   */
  async initializeAuth(): Promise<void> {
    this.updateAuthState({ status: AuthenticationStatus.LOADING });
    
    try {
      const sessionResult = await this.authRepository.getCurrentSession();
      
      if (sessionResult.success && sessionResult.data) {
        await this.handleSuccessfulAuth(sessionResult.data.user, sessionResult.data);
      } else {
        this.updateAuthState({ 
          status: AuthenticationStatus.UNAUTHENTICATED,
          error: null 
        });
      }
    } catch (error) {
      this.handleAuthError(this.createAuthError('INIT_ERROR', 'Failed to initialize authentication'));
    }
  }

  /**
   * Sign up a new user
   */
  async signUp(dto: SignUpDTO): Promise<AuthResult<{ needsVerification: boolean }>> {
    // Validation
    const validation = this.validateSignUpData(dto);
    if (!validation.isValid) {
      const error = this.createAuthError('VALIDATION_ERROR', validation.errors.join(', '));
      this.updateAuthState({ error });
      return { success: false, error };
    }

    this.updateAuthState({ status: AuthenticationStatus.LOADING, error: null });
    
    try {
      const result = await this.authRepository.signUp(dto);
      
      if (result.success && result.data) {
        this.eventService.emitAuthEvent({
          type: AuthEventType.SIGN_UP,
          user: result.data.user,
          timestamp: new Date()
        });

        this.updateAuthState({ status: AuthenticationStatus.UNAUTHENTICATED });
        
        return { 
          success: true, 
          data: { needsVerification: result.data.needsVerification } 
        };
      } else {
        this.handleAuthError(result.error!);
        return { success: false, error: result.error };
      }
    } catch (error) {
      const authError = this.createAuthError('SIGNUP_ERROR', 'An unexpected error occurred during sign up');
      this.handleAuthError(authError);
      return { success: false, error: authError };
    }
  }

  /**
   * Sign in user
   */
  async signIn(dto: SignInDTO): Promise<AuthResult> {
    const validation = this.validateSignInData(dto);
    if (!validation.isValid) {
      const error = this.createAuthError('VALIDATION_ERROR', validation.errors.join(', '));
      this.updateAuthState({ error });
      return { success: false, error };
    }

    this.updateAuthState({ status: AuthenticationStatus.LOADING, error: null });
    
    try {
      const result = await this.authRepository.signIn(dto);
      
      if (result.success && result.data) {
        await this.handleSuccessfulAuth(result.data.user, result.data.session);
        
        this.eventService.emitAuthEvent({
          type: AuthEventType.SIGN_IN,
          user: result.data.user,
          timestamp: new Date()
        });

        return { success: true };
      } else {
        this.handleAuthError(result.error!);
        return { success: false, error: result.error };
      }
    } catch (error) {
      const authError = this.createAuthError('SIGNIN_ERROR', 'An unexpected error occurred during sign in');
      this.handleAuthError(authError);
      return { success: false, error: authError };
    }
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<AuthResult> {
    try {
      const currentUser = this.getCurrentUser();
      
      await this.authRepository.signOut();
      await this.tokenStorage.removeToken();
      await this.tokenStorage.removeRefreshToken();
      
      this.clearSessionRefreshTimer();
      this.clearAuthState();
      
      if (currentUser) {
        this.eventService.emitAuthEvent({
          type: AuthEventType.SIGN_OUT,
          user: currentUser,
          timestamp: new Date()
        });
      }
      
      return { success: true };
    } catch (error) {
      const authError = this.createAuthError('SIGNOUT_ERROR', 'Failed to sign out');
      return { success: false, error: authError };
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<AuthResult> {
    const emailValidation = this.validationService.validateEmail(email);
    if (!emailValidation.isValid) {
      const error = this.createAuthError('VALIDATION_ERROR', emailValidation.error!);
      return { success: false, error };
    }

    try {
      const result = await this.authRepository.resetPassword(email);
      
      if (result.success) {
        this.eventService.emitAuthEvent({
          type: AuthEventType.PASSWORD_RESET,
          timestamp: new Date()
        });
      }
      
      return result;
    } catch (error) {
      const authError = this.createAuthError('RESET_ERROR', 'Failed to reset password');
      return { success: false, error: authError };
    }
  }

  /**
   * Update user password
   */
  async updatePassword(dto: ChangePasswordDTO): Promise<AuthResult> {
    const validation = this.validatePasswordChange(dto);
    if (!validation.isValid) {
      const error = this.createAuthError('VALIDATION_ERROR', validation.errors.join(', '));
      return { success: false, error };
    }

    try {
      const result = await this.authRepository.updatePassword(dto);
      return result;
    } catch (error) {
      const authError = this.createAuthError('UPDATE_PASSWORD_ERROR', 'Failed to update password');
      return { success: false, error: authError };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(dto: UpdateProfileDTO): Promise<AuthResult<UserProfile>> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      const error = this.createAuthError('NOT_AUTHENTICATED', 'User not authenticated');
      return { success: false, error };
    }

    try {
      const result = await this.profileRepository.updateProfile(currentUser.id, dto);
      
      if (result.success && result.data) {
        this.updateAuthState({ profile: result.data });
        
        this.eventService.emitAuthEvent({
          type: AuthEventType.PROFILE_UPDATED,
          user: currentUser,
          timestamp: new Date()
        });
        
        return { success: true, data: result.data };
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      const authError = this.createAuthError('UPDATE_PROFILE_ERROR', 'Failed to update profile');
      return { success: false, error: authError };
    }
  }

  // Getters
  getCurrentUser(): AuthUser | null {
    return this.authStateSubject.value.user;
  }

  getCurrentProfile(): UserProfile | null {
    return this.authStateSubject.value.profile;
  }

  isAuthenticated(): boolean {
    return this.authStateSubject.value.isAuthenticated;
  }

  isAdmin(): boolean {
    return this.authStateSubject.value.isAdmin;
  }

  isModerator(): boolean {
    return this.authStateSubject.value.isModerator;
  }

  hasRole(role: UserRole): boolean {
    const profile = this.getCurrentProfile();
    return profile?.role === role;
  }

  hasPermission(permission: string): boolean {
    const profile = this.getCurrentProfile();
    if (!profile) return false;
    
    // Implement permission logic based on roles
    const permissions = this.getRolePermissions(profile.role);
    return permissions.includes(permission);
  }

  // Private methods
  private async handleSuccessfulAuth(user: AuthUser, session: any): Promise<void> {
    try {
      // Fetch user profile
      const profileResult = await this.profileRepository.getProfile(user.id);
      let profile: UserProfile | null = null;
      
      if (profileResult.success && profileResult.data) {
        profile = profileResult.data;
      } else if (profileResult.error?.code === 'PROFILE_NOT_FOUND') {
        // Create profile if it doesn't exist
        const createResult = await this.profileRepository.createProfile(user.id, {
          email: user.email,
          role: UserRole.USER
        });
        if (createResult.success) {
          profile = createResult.data!;
        }
      }

      // Update auth state
      this.updateAuthState({
        status: AuthenticationStatus.AUTHENTICATED,
        user,
        session,
        profile,
        isAuthenticated: true,
        isAdmin: profile?.role === UserRole.ADMIN,
        isModerator: profile?.role === UserRole.MODERATOR || profile?.role === UserRole.ADMIN,
        error: null
      });

      // Store tokens
      if (session) {
        await this.tokenStorage.setToken(session.accessToken);
        await this.tokenStorage.setRefreshToken(session.refreshToken);
      }

      this.setupSessionRefresh();
    } catch (error) {
      console.error('Error handling successful auth:', error);
    }
  }

  private handleAuthError(error: AuthError): void {
    this.updateAuthState({ 
      status: AuthenticationStatus.ERROR,
      error,
      isAuthenticated: false 
    });
  }

  private updateAuthState(updates: Partial<AuthState>): void {
    const currentState = this.authStateSubject.value;
    this.authStateSubject.next({ ...currentState, ...updates });
  }

  private clearAuthState(): void {
    this.authStateSubject.next({
      ...this.initialState,
      status: AuthenticationStatus.UNAUTHENTICATED
    });
  }

  private createAuthError(code: string, message: string, details?: any): AuthError {
    return { code, message, details };
  }

  private setupSessionRefresh(): void {
    this.clearSessionRefreshTimer();
    
    // Refresh session every 45 minutes
    this.sessionRefreshTimer = timer(45 * 60 * 1000).subscribe(async () => {
      await this.refreshSession();
    });
  }

  private clearSessionRefreshTimer(): void {
    if (this.sessionRefreshTimer) {
      this.sessionRefreshTimer.unsubscribe();
      this.sessionRefreshTimer = null;
    }
  }

  private async refreshSession(): Promise<void> {
    try {
      const result = await this.authRepository.refreshSession();
      if (result.success && result.data) {
        const currentState = this.authStateSubject.value;
        this.updateAuthState({ session: result.data });
        await this.tokenStorage.setToken(result.data.accessToken);
      } else {
        // Session refresh failed, sign out user
        await this.signOut();
      }
    } catch (error) {
      console.error('Session refresh error:', error);
      await this.signOut();
    }
  }

  private validateSignUpData(dto: SignUpDTO): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    const emailValidation = this.validationService.validateEmail(dto.email);
    if (!emailValidation.isValid) {
      errors.push(emailValidation.error!);
    }
    
    const passwordValidation = this.validationService.validatePassword(dto.password);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    }
    
    if (!dto.fullName?.trim()) {
      errors.push('Full name is required');
    }
    
    return { isValid: errors.length === 0, errors };
  }

  private validateSignInData(dto: SignInDTO): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!dto.email) {
      errors.push('Email is required');
    }
    
    if (!dto.password) {
      errors.push('Password is required');
    }
    
    return { isValid: errors.length === 0, errors };
  }

  private validatePasswordChange(dto: ChangePasswordDTO): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!dto.currentPassword) {
      errors.push('Current password is required');
    }
    
    const passwordValidation = this.validationService.validatePassword(dto.newPassword);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    }
    
    if (dto.newPassword !== dto.confirmPassword) {
      errors.push('Passwords do not match');
    }
    
    return { isValid: errors.length === 0, errors };
  }

  private getRolePermissions(role: UserRole): string[] {
    const permissions = {
      [UserRole.USER]: ['read:profile', 'update:profile'],
      [UserRole.MODERATOR]: ['read:profile', 'update:profile', 'moderate:content'],
      [UserRole.ADMIN]: ['*'] // All permissions
    };
    
    return permissions[role] || [];
  }
}