// src/app/core/interfaces/auth.interface.ts

import { User, Session } from '@supabase/supabase-js';

// Domain Models
export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  email_verified: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  emailConfirmed: boolean;
  lastSignInAt?: string;
  createdAt: string;
}

export interface UserSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: AuthUser;
}

// Enums
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator'
}

export enum AuthenticationStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  AUTHENTICATED = 'authenticated',
  UNAUTHENTICATED = 'unauthenticated',
  ERROR = 'error'
}

// Auth State
export interface AuthState {
  status: AuthenticationStatus;
  user: AuthUser | null;
  session: UserSession | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  error: AuthError | null;
}

// DTOs (Data Transfer Objects)
export interface SignUpDTO {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface SignInDTO {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface UpdateProfileDTO {
  full_name?: string;
  phone?: string;
  avatar_url?: string;
}

export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Result Types
export interface AuthResult<T = void> {
  success: boolean;
  data?: T;
  error?: AuthError;
}

export interface AuthError {
  code: string;
  message: string;
  details?: any;
}

// Repository Interfaces
export interface IAuthRepository {
  signUp(dto: SignUpDTO): Promise<AuthResult<{ user: AuthUser; needsVerification: boolean }>>;
  signIn(dto: SignInDTO): Promise<AuthResult<{ user: AuthUser; session: UserSession }>>;
  signOut(): Promise<AuthResult>;
  resetPassword(email: string): Promise<AuthResult>;
  updatePassword(dto: ChangePasswordDTO): Promise<AuthResult>;
  getCurrentSession(): Promise<AuthResult<UserSession | null>>;
  refreshSession(): Promise<AuthResult<UserSession>>;
  verifyEmail(token: string): Promise<AuthResult>;
}

export interface IProfileRepository {
  getProfile(userId: string): Promise<AuthResult<UserProfile>>;
  updateProfile(userId: string, dto: UpdateProfileDTO): Promise<AuthResult<UserProfile>>;
  createProfile(userId: string, data: Partial<UserProfile>): Promise<AuthResult<UserProfile>>;
  deleteProfile(userId: string): Promise<AuthResult>;
}

// Service Interfaces
export interface IAuthService {
  readonly authState$: Observable<AuthState>;
  
  initializeAuth(): Promise<void>;
  signUp(dto: SignUpDTO): Promise<AuthResult<{ needsVerification: boolean }>>;
  signIn(dto: SignInDTO): Promise<AuthResult>;
  signOut(): Promise<AuthResult>;
  resetPassword(email: string): Promise<AuthResult>;
  updatePassword(dto: ChangePasswordDTO): Promise<AuthResult>;
  updateProfile(dto: UpdateProfileDTO): Promise<AuthResult<UserProfile>>;
  
  getCurrentUser(): AuthUser | null;
  getCurrentProfile(): UserProfile | null;
  isAuthenticated(): boolean;
  isAdmin(): boolean;
  isModerator(): boolean;
  hasRole(role: UserRole): boolean;
  hasPermission(permission: string): boolean;
}

// Validators
export interface IPasswordValidator {
  validatePassword(password: string): { isValid: boolean; errors: string[] };
}

export interface IEmailValidator {
    validateEmail(email: string): { isValid: boolean; error?: string };
}

// Storage
export interface ITokenStorage {
  getToken(): Promise<string | null>;
  setToken(token: string): Promise<void>;
  removeToken(): Promise<void>;
  getRefreshToken(): Promise<string | null>;
  setRefreshToken(token: string): Promise<void>;
  removeRefreshToken(): Promise<void>;
}

// Observable interface for better type safety
import { Observable } from 'rxjs';

// Events
export interface AuthEvent {
  type: AuthEventType;
  user?: AuthUser;
  error?: AuthError;
  timestamp: Date;
}

export enum AuthEventType {
  SIGN_IN = 'sign_in',
  SIGN_OUT = 'sign_out',
  SIGN_UP = 'sign_up',
  PASSWORD_RESET = 'password_reset',
  PROFILE_UPDATED = 'profile_updated',
  SESSION_EXPIRED = 'session_expired',
  EMAIL_VERIFIED = 'email_verified'
}