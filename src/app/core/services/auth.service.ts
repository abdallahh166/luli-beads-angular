import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { supabase } from '../../integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authState = new BehaviorSubject<AuthState>({
    user: null,
    session: null,
    userProfile: null,
    isAuthenticated: false,
    isAdmin: false,
    isLoading: true
  });

  public authState$ = this.authState.asObservable();

  constructor() {
    // Don't auto-initialize - let the app call initializeAuth() explicitly
  }

  async initializeAuth(): Promise<void> {
    this.updateAuthState({ isLoading: true });
    
    try {
      // Set up auth state listener
      supabase.auth.onAuthStateChange(async (event, session) => {
        this.updateAuthState({ 
          session, 
          user: session?.user || null, 
          isAuthenticated: !!session?.user,
          isLoading: false
        });
        
        // Fetch user profile when session changes
        if (session?.user) {
          await this.fetchUserProfile(session.user.id);
        } else {
          // Clear profile when user logs out
          this.updateAuthState({ userProfile: null, isAdmin: false });
        }
      });

      // Get initial session
      const { data: { session } } = await supabase.auth.getSession();
      this.updateAuthState({ 
        session, 
        user: session?.user || null, 
        isAuthenticated: !!session?.user,
        isLoading: false
      });
      
      // Fetch user profile for initial session
      if (session?.user) {
        await this.fetchUserProfile(session.user.id);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      this.updateAuthState({ isLoading: false });
    }
  }



  private async fetchUserProfile(userId: string): Promise<void> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // If profile doesn't exist, create it
        if (error.code === 'PGRST116') {
          console.log('Profile not found, creating new profile...');
          await this.createUserProfile(userId);
          return;
        }
        console.error('Error fetching user profile:', error);
        return;
      }

      if (profile) {
        this.updateAuthState({ 
          userProfile: profile, 
          isAdmin: profile.role === 'admin' 
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  }

  private async createUserProfile(userId: string): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (user.user) {
        const { error } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: user.user.email,
            full_name: user.user.user_metadata?.['full_name'] || 
                      user.user.user_metadata?.['name'] || 
                      'User'
          });

        if (!error) {
          // Fetch the newly created profile
          await this.fetchUserProfile(userId);
        }
      }
    } catch (error) {
      console.error('Error creating user profile:', error);
    }
  }

  private updateAuthState(updates: Partial<AuthState>): void {
    this.authState.next({ ...this.authState.value, ...updates });
  }

  private clearAuth(): void {
    this.updateAuthState({
      user: null,
      session: null,
      userProfile: null,
      isAuthenticated: false,
      isAdmin: false
    });
  }

  async signUp(email: string, password: string, fullName?: string): Promise<{ error: any }> {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: fullName ? { full_name: fullName } : undefined
        }
      });
      
      if (!error && data.user) {
        // Wait a moment for the trigger to create the profile
        setTimeout(() => {
          this.fetchUserProfile(data.user!.id);
        }, 1000);
      }
      
      return { error };
    } catch (error) {
      return { error };
    }
  }

  async signIn(email: string, password: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      return { error };
    } catch (error) {
      return { error };
    }
  }

  async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase signOut error:', error);
      }
      this.clearAuth();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  async resetPassword(email: string): Promise<{ error: any }> {
    try {
      const redirectUrl = `${window.location.origin}/auth`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });
      
      return { error };
    } catch (error) {
      return { error };
    }
  }

  getCurrentUser(): User | null {
    return this.authState.value.user;
  }

  getCurrentProfile(): UserProfile | null {
    return this.authState.value.userProfile;
  }

  isUserAuthenticated(): boolean {
    return this.authState.value.isAuthenticated;
  }

  isUserAdmin(): boolean {
    return this.authState.value.isAdmin;
  }

  isLoading(): boolean {
    return this.authState.value.isLoading;
  }
}
