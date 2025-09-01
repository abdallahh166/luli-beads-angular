// src/app/core/repositories/profile.repository.ts

import { Injectable } from '@angular/core';
import { supabase } from '../../integrations/supabase/client';
import { 
  IProfileRepository, 
  UpdateProfileDTO, 
  AuthResult, 
  UserProfile, 
  UserRole 
} from '../interfaces/auth.interface';

@Injectable({
  providedIn: 'root'
})
export class ProfileRepository implements IProfileRepository {

  async getProfile(userId: string): Promise<AuthResult<UserProfile>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { 
            success: false, 
            error: { code: 'PROFILE_NOT_FOUND', message: 'Profile not found' } 
          };
        }
        return { success: false, error: this.mapSupabaseError(error) };
      }

      const profile = this.mapToUserProfile(data);
      return { success: true, data: profile };
    } catch (error) {
      return { 
        success: false, 
        error: { code: 'NETWORK_ERROR', message: 'Network error occurred' } 
      };
    }
  }

  async updateProfile(userId: string, dto: UpdateProfileDTO): Promise<AuthResult<UserProfile>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: dto.full_name,
          phone: dto.phone,
          avatar_url: dto.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return { success: false, error: this.mapSupabaseError(error) };
      }

      const profile = this.mapToUserProfile(data);
      return { success: true, data: profile };
    } catch (error) {
      return { 
        success: false, 
        error: { code: 'UPDATE_PROFILE_ERROR', message: 'Failed to update profile' } 
      };
    }
  }

  async createProfile(userId: string, data: Partial<UserProfile>): Promise<AuthResult<UserProfile>> {
    try {
      const profileData = {
        id: userId,
        email: data.email!,
        full_name: data.full_name,
        phone: data.phone,
        role: data.role || UserRole.USER,
        email_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: insertedData, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        return { success: false, error: this.mapSupabaseError(error) };
      }

      const profile = this.mapToUserProfile(insertedData);
      return { success: true, data: profile };
    } catch (error) {
      return { 
        success: false, 
        error: { code: 'CREATE_PROFILE_ERROR', message: 'Failed to create profile' } 
      };
    }
  }

  async deleteProfile(userId: string): Promise<AuthResult> {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        return { success: false, error: this.mapSupabaseError(error) };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: { code: 'DELETE_PROFILE_ERROR', message: 'Failed to delete profile' } 
      };
    }
  }

  private mapToUserProfile(data: any): UserProfile {
    return {
      id: data.id,
      email: data.email,
      full_name: data.full_name,
      phone: data.phone,
      avatar_url: data.avatar_url,
      role: data.role || UserRole.USER,
      email_verified: data.email_verified || false,
      last_login: data.last_login,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }

  private mapSupabaseError(error: any): { code: string; message: string; details?: any } {
    const errorMap: Record<string, { code: string; message: string }> = {
      '23505': { 
        code: 'DUPLICATE_KEY', 
        message: 'Profile already exists' 
      },
      '23503': { 
        code: 'FOREIGN_KEY_VIOLATION', 
        message: 'Invalid user reference' 
      }
    };

    const mapped = errorMap[error.code] || {
      code: 'PROFILE_ERROR',
      message: error.message || 'Profile operation failed'
    };

    return {
      ...mapped,
      details: error
    };
    }
}