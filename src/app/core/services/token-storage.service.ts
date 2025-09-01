// src/app/core/services/token-storage.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ITokenStorage } from '../interfaces/auth.interface';

@Injectable({
  providedIn: 'root'
})
export class TokenStorageService implements ITokenStorage {
  private readonly TOKEN_KEY = 'luli_beads_access_token';
  private readonly REFRESH_TOKEN_KEY = 'luli_beads_refresh_token';
  private readonly TOKEN_EXPIRY_KEY = 'luli_beads_token_expiry';
  private readonly USER_PREFERENCES_KEY = 'luli_beads_user_prefs';

  // Observable for token changes
  private tokenChangeSubject = new BehaviorSubject<string | null>(null);
  public tokenChange$ = this.tokenChangeSubject.asObservable();

  constructor() {
    // Initialize with current token
    this.getToken().then(token => {
      this.tokenChangeSubject.next(token);
    });
  }

  async getToken(): Promise<string | null> {
    try {
      const token = localStorage.getItem(this.TOKEN_KEY);
      
      if (token && await this.isTokenExpired()) {
        await this.removeToken();
        return null;
      }
      
      return token;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  async setToken(token: string, expiresIn?: number): Promise<void> {
    try {
      localStorage.setItem(this.TOKEN_KEY, token);
      
      if (expiresIn) {
        const expiryTime = Date.now() + (expiresIn * 1000);
        localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
      }
      
      this.tokenChangeSubject.next(token);
    } catch (error) {
      console.error('Error setting token:', error);
    }
  }

  async removeToken(): Promise<void> {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
      this.tokenChangeSubject.next(null);
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }

  async getRefreshToken(): Promise<string | null> {
    try {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  async setRefreshToken(token: string): Promise<void> {
    try {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
    } catch (error) {
      console.error('Error setting refresh token:', error);
    }
  }

  async removeRefreshToken(): Promise<void> {
    try {
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error removing refresh token:', error);
    }
  }

  async clearAll(): Promise<void> {
    try {
      await this.removeToken();
      await this.removeRefreshToken();
      localStorage.removeItem(this.USER_PREFERENCES_KEY);
      console.log('All tokens and preferences cleared');
    } catch (error) {
      console.error('Error clearing all tokens:', error);
    }
  }

  // Token validation methods
  async isTokenExpired(): Promise<boolean> {
    try {
      const expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
      if (!expiryTime) {
        return false; // If no expiry time, assume token is valid
      }
      
      return Date.now() > parseInt(expiryTime, 10);
    } catch (error) {
      console.error('Error checking token expiry:', error);
      return true; // Assume expired on error
    }
  }

  async getTokenExpiry(): Promise<Date | null> {
    try {
      const expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
      return expiryTime ? new Date(parseInt(expiryTime, 10)) : null;
    } catch (error) {
      console.error('Error getting token expiry:', error);
      return null;
    }
  }

  async getTimeUntilExpiry(): Promise<number> {
    try {
      const expiry = await this.getTokenExpiry();
      if (!expiry) return 0;
      
      const timeLeft = expiry.getTime() - Date.now();
      return Math.max(0, timeLeft);
    } catch (error) {
      console.error('Error calculating time until expiry:', error);
      return 0;
    }
  }

  // User preferences storage
  async setUserPreference(key: string, value: any): Promise<void> {
    try {
      const preferences = await this.getUserPreferences();
      preferences[key] = value;
      localStorage.setItem(this.USER_PREFERENCES_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error setting user preference:', error);
    }
  }

  async getUserPreference(key: string): Promise<any> {
    try {
      const preferences = await this.getUserPreferences();
      return preferences[key];
    } catch (error) {
      console.error('Error getting user preference:', error);
      return null;
    }
  }

  async getUserPreferences(): Promise<Record<string, any>> {
    try {
      const preferences = localStorage.getItem(this.USER_PREFERENCES_KEY);
      return preferences ? JSON.parse(preferences) : {};
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return {};
    }
  }

  // Storage capacity and health checks
  async getStorageInfo(): Promise<{
    hasToken: boolean;
    hasRefreshToken: boolean;
    tokenExpiry: Date | null;
    timeUntilExpiry: number;
    storageSupported: boolean;
  }> {
    return {
      hasToken: !!(await this.getToken()),
      hasRefreshToken: !!(await this.getRefreshToken()),
      tokenExpiry: await this.getTokenExpiry(),
      timeUntilExpiry: await this.getTimeUntilExpiry(),
      storageSupported: this.isLocalStorageSupported()
    };
  }

  private isLocalStorageSupported(): boolean {
    try {
      const test = 'localStorage_test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Secure token handling for sensitive operations
  async getSecureToken(): Promise<string | null> {
    const token = await this.getToken();
    
    if (!token) {
      return null;
    }

    // Additional security checks could be added here
    if (await this.isTokenExpired()) {
      await this.removeToken();
      return null;
    }

    return token;
  }

  // Memory-only token storage for highly sensitive operations
  private memoryToken: string | null = null;
  private memoryTokenExpiry: number | null = null;

  setMemoryToken(token: string, expiresInMs: number): void {
    this.memoryToken = token;
    this.memoryTokenExpiry = Date.now() + expiresInMs;
  }

  getMemoryToken(): string | null {
    if (!this.memoryToken || !this.memoryTokenExpiry) {
      return null;
    }

    if (Date.now() > this.memoryTokenExpiry) {
      this.memoryToken = null;
      this.memoryTokenExpiry = null;
      return null;
    }

    return this.memoryToken;
  }

  clearMemoryToken(): void {
    this.memoryToken = null;
    this.memoryTokenExpiry = null;
  }
}