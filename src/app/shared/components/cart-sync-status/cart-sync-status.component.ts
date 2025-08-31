import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartStateService } from '../../../core/services/cart-state.service';
import { CartSyncState } from '../../../types/cart';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-cart-sync-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="cart-sync-status" *ngIf="showStatus">
      <div class="status-indicator" [class]="getStatusClass()">
        <div class="status-icon">
          <span *ngIf="syncState.isOnline" class="online-icon">●</span>
          <span *ngIf="!syncState.isOnline" class="offline-icon">○</span>
        </div>
        <div class="status-text">
          <span *ngIf="syncState.isOnline && !hasPendingChanges" class="synced">
            Cart synced
          </span>
          <span *ngIf="syncState.isOnline && hasPendingChanges" class="syncing">
            Syncing changes...
          </span>
          <span *ngIf="!syncState.isOnline" class="offline">
            Offline - changes saved locally
          </span>
        </div>
        <div class="pending-count" *ngIf="hasPendingChanges">
          {{ syncState.pendingChanges.length }}
        </div>
      </div>
      
      <div class="sync-errors" *ngIf="syncState.syncErrors.length > 0">
        <div class="error-item" *ngFor="let error of syncState.syncErrors">
          {{ error }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cart-sync-status {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      max-width: 300px;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: all 0.2s ease;
    }

    .status-indicator.online {
      background-color: #10b981;
      color: white;
    }

    .status-indicator.offline {
      background-color: #6b7280;
      color: white;
    }

    .status-indicator.syncing {
      background-color: #f59e0b;
      color: white;
    }

    .status-icon {
      font-size: 8px;
    }

    .online-icon {
      color: #ffffff;
    }

    .offline-icon {
      color: #d1d5db;
    }

    .status-text {
      flex: 1;
    }

    .pending-count {
      background-color: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: bold;
    }

    .sync-errors {
      margin-top: 8px;
      background-color: #ef4444;
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 11px;
    }

    .error-item {
      margin-bottom: 4px;
    }

    .error-item:last-child {
      margin-bottom: 0;
    }
  `]
})
export class CartSyncStatusComponent implements OnInit, OnDestroy {
  syncState: CartSyncState = {
    isOnline: true,
    lastSyncAttempt: null,
    pendingChanges: [],
    syncErrors: []
  };

  private subscription = new Subscription();

  get showStatus(): boolean {
    return this.syncState.syncErrors.length > 0 || 
           this.syncState.pendingChanges.length > 0 || 
           !this.syncState.isOnline;
  }

  get hasPendingChanges(): boolean {
    return this.syncState.pendingChanges.length > 0;
  }

  constructor(private cartStateService: CartStateService) {}

  ngOnInit(): void {
    this.subscription.add(
      this.cartStateService.syncState$.subscribe(state => {
        this.syncState = state;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  getStatusClass(): string {
    if (!this.syncState.isOnline) {
      return 'offline';
    }
    if (this.hasPendingChanges) {
      return 'syncing';
    }
    return 'online';
  }
}
