// src/app/core/services/auth-event.service.ts

import { Injectable } from '@angular/core';
import { Subject, Observable, BehaviorSubject } from 'rxjs';
import { filter, map, debounceTime } from 'rxjs/operators';
import { AuthEvent, AuthEventType, AuthUser } from '../interfaces/auth.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthEventService {
  private eventSubject = new Subject<AuthEvent>();
  private eventHistorySubject = new BehaviorSubject<AuthEvent[]>([]);
  
  // Public observables
  public events$ = this.eventSubject.asObservable();
  public eventHistory$ = this.eventHistorySubject.asObservable();

  // Event history storage (keep last 50 events)
  private maxHistorySize = 50;
  private eventHistory: AuthEvent[] = [];

  constructor() {
    // Subscribe to events to maintain history
    this.events$.subscribe(event => {
      this.addToHistory(event);
    });
  }

  /**
   * Emit an authentication event
   */
  emitAuthEvent(event: AuthEvent): void {
    // Add timestamp if not provided
    if (!event.timestamp) {
      event.timestamp = new Date();
    }

    this.eventSubject.next(event);
    console.log(`[AuthEvent] ${event.type}:`, event);
  }

  /**
   * Get events of specific type
   */
  getEventsByType(type: AuthEventType): Observable<AuthEvent> {
    return this.events$.pipe(
      filter(event => event.type === type)
    );
  }

  /**
   * Get events for specific user
   */
  getEventsForUser(userId: string): Observable<AuthEvent> {
    return this.events$.pipe(
      filter(event => event.user?.id === userId)
    );
  }

  /**
   * Get recent events with debounce
   */
  getRecentEvents(intervalMs: number = 1000): Observable<AuthEvent[]> {
    return this.eventHistory$.pipe(
      debounceTime(intervalMs),
      map(history => history.slice(-10)) // Last 10 events
    );
  }

  // Specific event emitters
  emitSignIn(user: AuthUser): void {
    this.emitAuthEvent({
      type: AuthEventType.SIGN_IN,
      user,
      timestamp: new Date()
    });
  }

  emitSignOut(user?: AuthUser): void {
    this.emitAuthEvent({
      type: AuthEventType.SIGN_OUT,
      user,
      timestamp: new Date()
    });
  }

  emitSignUp(user: AuthUser): void {
    this.emitAuthEvent({
      type: AuthEventType.SIGN_UP,
      user,
      timestamp: new Date()
    });
  }

  emitPasswordReset(email?: string): void {
    this.emitAuthEvent({
      type: AuthEventType.PASSWORD_RESET,
      timestamp: new Date(),
      user: email ? { email } as any : undefined
    });
  }

  emitProfileUpdated(user: AuthUser): void {
    this.emitAuthEvent({
      type: AuthEventType.PROFILE_UPDATED,
      user,
      timestamp: new Date()
    });
  }

  emitSessionExpired(user?: AuthUser): void {
    this.emitAuthEvent({
      type: AuthEventType.SESSION_EXPIRED,
      user,
      timestamp: new Date()
    });
  }

  emitEmailVerified(user: AuthUser): void {
    this.emitAuthEvent({
      type: AuthEventType.EMAIL_VERIFIED,
      user,
      timestamp: new Date()
    });
  }

  // Event listeners with automatic cleanup
  onSignIn(callback: (event: AuthEvent) => void): () => void {
    const subscription = this.getEventsByType(AuthEventType.SIGN_IN)
      .subscribe(callback);
    
    return () => subscription.unsubscribe();
  }

  onSignOut(callback: (event: AuthEvent) => void): () => void {
    const subscription = this.getEventsByType(AuthEventType.SIGN_OUT)
      .subscribe(callback);
    
    return () => subscription.unsubscribe();
  }

  onSignUp(callback: (event: AuthEvent) => void): () => void {
    const subscription = this.getEventsByType(AuthEventType.SIGN_UP)
      .subscribe(callback);
    
    return () => subscription.unsubscribe();
  }

  onProfileUpdated(callback: (event: AuthEvent) => void): () => void {
    const subscription = this.getEventsByType(AuthEventType.PROFILE_UPDATED)
      .subscribe(callback);
    
    return () => subscription.unsubscribe();
  }

  onPasswordReset(callback: (event: AuthEvent) => void): () => void {
    const subscription = this.getEventsByType(AuthEventType.PASSWORD_RESET)
      .subscribe(callback);
    
    return () => subscription.unsubscribe();
  }

  onSessionExpired(callback: (event: AuthEvent) => void): () => void {
    const subscription = this.getEventsByType(AuthEventType.SESSION_EXPIRED)
      .subscribe(callback);
    
    return () => subscription.unsubscribe();
  }

  onEmailVerified(callback: (event: AuthEvent) => void): () => void {
    const subscription = this.getEventsByType(AuthEventType.EMAIL_VERIFIED)
      .subscribe(callback);
    
    return () => subscription.unsubscribe();
  }

  // Analytics and monitoring helpers
  getEventStats(): {
    totalEvents: number;
    eventsByType: Record<AuthEventType, number>;
    recentEvents: AuthEvent[];
    mostActiveUser?: string;
  } {
    const eventsByType = {} as Record<AuthEventType, number>;
    const userEventCounts = {} as Record<string, number>;

    // Initialize counters
    Object.values(AuthEventType).forEach(type => {
      eventsByType[type] = 0;
    });

    // Count events
    this.eventHistory.forEach(event => {
      eventsByType[event.type]++;
      
      if (event.user?.id) {
        userEventCounts[event.user.id] = (userEventCounts[event.user.id] || 0) + 1;
      }
    });

    // Find most active user
    const mostActiveUser = Object.keys(userEventCounts).reduce((a, b) =>
      userEventCounts[a] > userEventCounts[b] ? a : b, ''
    );

    return {
      totalEvents: this.eventHistory.length,
      eventsByType,
      recentEvents: this.eventHistory.slice(-5),
      mostActiveUser: mostActiveUser || undefined
    };
  }

  // Event filtering and search
  searchEvents(criteria: {
    type?: AuthEventType;
    userId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
  }): AuthEvent[] {
    let filtered = [...this.eventHistory];

    if (criteria.type) {
      filtered = filtered.filter(event => event.type === criteria.type);
    }

    if (criteria.userId) {
      filtered = filtered.filter(event => event.user?.id === criteria.userId);
    }

    if (criteria.dateFrom) {
      filtered = filtered.filter(event => event.timestamp >= criteria.dateFrom!);
    }

    if (criteria.dateTo) {
      filtered = filtered.filter(event => event.timestamp <= criteria.dateTo!);
    }

    if (criteria.limit) {
      filtered = filtered.slice(-criteria.limit);
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Export events for debugging or analytics
  exportEvents(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['Timestamp', 'Type', 'User ID', 'User Email'];
      const rows = this.eventHistory.map(event => [
        event.timestamp.toISOString(),
        event.type,
        event.user?.id || '',
        event.user?.email || ''
      ]);

      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    return JSON.stringify(this.eventHistory, null, 2);
  }

  // Clear event history
  clearEventHistory(): void {
    this.eventHistory = [];
    this.eventHistorySubject.next([]);
  }

  // Get event summary for dashboard
  getEventSummary(hours: number = 24): {
    period: string;
    totalEvents: number;
    signIns: number;
    signUps: number;
    signOuts: number;
    failedAttempts: number;
  } {
    const now = new Date();
    const periodStart = new Date(now.getTime() - (hours * 60 * 60 * 1000));
    
    const recentEvents = this.eventHistory.filter(event => 
      event.timestamp >= periodStart
    );

    return {
      period: `Last ${hours} hours`,
      totalEvents: recentEvents.length,
      signIns: recentEvents.filter(e => e.type === AuthEventType.SIGN_IN).length,
      signUps: recentEvents.filter(e => e.type === AuthEventType.SIGN_UP).length,
      signOuts: recentEvents.filter(e => e.type === AuthEventType.SIGN_OUT).length,
      failedAttempts: recentEvents.filter(e => e.error).length
    };
  }

  // Private helper methods
  private addToHistory(event: AuthEvent): void {
    this.eventHistory.push(event);
    
    // Maintain maximum history size
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
    
    this.eventHistorySubject.next([...this.eventHistory]);
  }

  // Event persistence (optional - for important events)
  private async persistEvent(event: AuthEvent): Promise<void> {
    // Could implement local storage or API persistence here
    try {
      const persistedEvents = JSON.parse(localStorage.getItem('auth_events') || '[]');
      persistedEvents.push(event);
      
      // Keep only last 100 persisted events
      const trimmedEvents = persistedEvents.slice(-100);
      localStorage.setItem('auth_events', JSON.stringify(trimmedEvents));
    } catch (error) {
      console.warn('Failed to persist auth event:', error);
    }
  }

  // Load persisted events on service initialization
  private loadPersistedEvents(): void {
    try {
      const persistedEvents = JSON.parse(localStorage.getItem('auth_events') || '[]');
      persistedEvents.forEach((event: any) => {
        event.timestamp = new Date(event.timestamp);
        this.addToHistory(event);
      });
    } catch (error) {
      console.warn('Failed to load persisted auth events:', error);
    }
  }
}
