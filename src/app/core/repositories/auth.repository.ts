// src/app/core/repositories/auth.repository.ts

import { Injectable } from '@angular/core';
import { supabase } from '../../integrations/supabase/client';
import { 
  IAuthRepository, 
  SignUpDTO, 
  SignInDTO, 
  ChangePasswordDTO,
  AuthResult, 
  AuthUser, 
  UserSession,
  AuthError 
} from '../interfaces/auth.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthRepository implements IAuthRepository {

  async signUp(dto: SignUpDTO): Promise<AuthResult<{ user: AuthUser; needsVerification: boolean }>> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: dto.email,
        password: dto.password,
        options: {
          data: {
            full_name: dto.fullName,
            phone: dto.phone
          },
          emailRedirectTo: `${window.location.origin}/auth/verify`
        }
      });

      if (error) {
        return { success: false, error: this.mapSupabaseError(error) };
      }

      if (!data.user) {
        return { 
          success: false, 
          error: { code: 'SIGNUP_FAILED', message: 'Failed to create user account' } 
        };
      }

      const authUser = this.mapToAuthUser(data.user);
      const needsVerification = !data.user.email_confirmed_at;

      return {
        success: true,
        data: { user: authUser, needsVerification }
      };
    } catch (error) {
      return { 
        success: false, 
        error: { code: 'NETWORK_ERROR', message: 'Network error occurred' } 
      };
    }
  }

  async signIn(dto: SignInDTO): Promise<AuthResult<{ user: AuthUser; session: UserSession }>> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: dto.email,
        password: dto.password
      });

      if (error) {
        return { success: false, error: this.mapSupabaseError(error) };
      }

      if (!data.user || !data.session) {
        return { 
          success: false, 
          error: { code: 'SIGNIN_FAILED', message: 'Failed to sign in' } 
        };
      }

      const authUser = this.mapToAuthUser(data.user);
      const session = this.mapToUserSession(data.session, authUser);

      return {
        success: true,
        data: { user: authUser, session }
      };
    } catch (error) {
      return { 
        success: false, 
        error: { code: 'NETWORK_ERROR', message: 'Network error occurred' } 
      };
    }
  }

  async signOut(): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return { success: false, error: this.mapSupabaseError(error) };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: { code: 'SIGNOUT_ERROR', message: 'Failed to sign out' } 
      };
    }
  }

  async resetPassword(email: string): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) {
        return { success: false, error: this.mapSupabaseError(error) };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: { code: 'RESET_PASSWORD_ERROR', message: 'Failed to send reset email' } 
      };
    }
  }

  async updatePassword(dto: ChangePasswordDTO): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: dto.newPassword
      });

      if (error) {
        return { success: false, error: this.mapSupabaseError(error) };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: { code: 'UPDATE_PASSWORD_ERROR', message: 'Failed to update password' } 
      };
    }
  }

  async getCurrentSession(): Promise<AuthResult<UserSession | null>> {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        return { success: false, error: this.mapSupabaseError(error) };
      }

      if (!data.session) {
        return { success: true, data: null };
      }

      const authUser = this.mapToAuthUser(data.session.user);
      const session = this.mapToUserSession(data.session, authUser);

      return { success: true, data: session };
    } catch (error) {
      return { 
        success: false, 
        error: { code: 'GET_SESSION_ERROR', message: 'Failed to get current session' } 
      };
    }
  }

  async refreshSession(): Promise<AuthResult<UserSession>> {
    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        return { success: false, error: this.mapSupabaseError(error) };
      }

      if (!data.session) {
        return { 
          success: false, 
          error: { code: 'REFRESH_FAILED', message: 'Failed to refresh session' } 
        };
      }

      const authUser = this.mapToAuthUser(data.session.user);
      const session = this.mapToUserSession(data.session, authUser);

      return { success: true, data: session };
    } catch (error) {
      return { 
        success: false, 
        error: { code: 'REFRESH_ERROR', message: 'Failed to refresh session' } 
      };
    }
  }

  async verifyEmail(token: string): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email'
      });

      if (error) {
        return { success: false, error: this.mapSupabaseError(error) };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: { code: 'VERIFY_EMAIL_ERROR', message: 'Failed to verify email' } 
      };
    }
  }

  // Social authentication methods
  async signInWithGoogle(): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        return { success: false, error: this.mapSupabaseError(error) };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: { code: 'GOOGLE_AUTH_ERROR', message: 'Failed to sign in with Google' } 
      };
    }
  }

  async signInWithFacebook(): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        return { success: false, error: this.mapSupabaseError(error) };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: { code: 'FACEBOOK_AUTH_ERROR', message: 'Failed to sign in with Facebook' } 
      };
    }
  }

  // Private mapping methods
  private mapToAuthUser(user: any): AuthUser {
    return {
      id: user.id,
      email: user.email,
      emailConfirmed: !!user.email_confirmed_at,
      lastSignInAt: user.last_sign_in_at,
      createdAt: user.created_at
    };
  }

  private mapToUserSession(session: any, user: AuthUser): UserSession {
    return {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: session.expires_at,
      user
    };
  }

  private mapSupabaseError(error: any): AuthError {
    const errorMap: Record<string, { code: string; message: string }> = {
      'Invalid login credentials': { 
        code: 'INVALID_CREDENTIALS', 
        message: 'Invalid email or password' 
      },
      'User already registered': { 
        code: 'USER_EXISTS', 
        message: 'An account with this email already exists' 
      },
      'Email not confirmed': { 
        code: 'EMAIL_NOT_CONFIRMED', 
        message: 'Please confirm your email address' 
      },
      'Password is too weak': { 
        code: 'WEAK_PASSWORD', 
        message: 'Password is too weak' 
      },
      'Rate limit exceeded': { 
        code: 'RATE_LIMIT_EXCEEDED', 
        message: 'Too many requests. Please try again later' 
      },
      'Invalid token': { 
        code: 'INVALID_TOKEN', 
        message: 'Invalid or expired token' 
      }
    };

    const mapped = errorMap[error.message] || {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred'
    };

    return {
      ...mapped,
      details: error
    };
  }
}

