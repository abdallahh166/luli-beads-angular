// src/app/core/utils/auth.utils.ts

import { UserRole, UserProfile } from '../interfaces/auth.interface';

export class AuthUtils {
  
  static hasPermission(profile: UserProfile | null, permission: string): boolean {
    if (!profile) return false;
    
    const rolePermissions = this.getRolePermissions(profile.role);
    return rolePermissions.includes(permission) || rolePermissions.includes('*');
  }

  static hasRole(profile: UserProfile | null, role: UserRole): boolean {
    return profile?.role === role;
  }

  static hasAnyRole(profile: UserProfile | null, roles: UserRole[]): boolean {
    return profile ? roles.includes(profile.role) : false;
  }

  static isHigherRole(userRole: UserRole, targetRole: UserRole): boolean {
    const roleHierarchy = {
      [UserRole.USER]: 1,
      [UserRole.MODERATOR]: 2,
      [UserRole.ADMIN]: 3
    };

    return roleHierarchy[userRole] > roleHierarchy[targetRole];
  }

  static canManageUser(managerProfile: UserProfile | null, targetProfile: UserProfile): boolean {
    if (!managerProfile) return false;
    
    // Admins can manage everyone except other admins
    if (managerProfile.role === UserRole.ADMIN) {
      return targetProfile.role !== UserRole.ADMIN || managerProfile.id === targetProfile.id;
    }
    
    // Moderators can manage users only
    if (managerProfile.role === UserRole.MODERATOR) {
      return targetProfile.role === UserRole.USER;
    }
    
    // Users can only manage themselves
    return managerProfile.id === targetProfile.id;
  }

  static getRolePermissions(role: UserRole): string[] {
    const permissions = {
      [UserRole.USER]: [
        'read:profile',
        'update:profile',
        'read:orders',
        'create:orders'
      ],
      [UserRole.MODERATOR]: [
        'read:profile',
        'update:profile',
        'read:orders',
        'create:orders',
        'moderate:content',
        'read:users'
      ],
      [UserRole.ADMIN]: ['*'] // All permissions
    };
    
    return permissions[role] || [];
  }

  static formatUserDisplayName(profile: UserProfile | null): string {
    if (!profile) return 'Guest';
    
    if (profile.full_name) {
      return profile.full_name;
    }
    
    if (profile.email) {
      return profile.email.split('@')[0];
    }
    
    return 'User';
  }

  static getInitials(profile: UserProfile | null): string {
    if (!profile?.full_name) return 'U';
    
    const names = profile.full_name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    
    return names[0][0].toUpperCase();
  }
}