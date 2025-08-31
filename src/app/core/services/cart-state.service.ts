import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, Subscription } from 'rxjs';
import { map, distinctUntilChanged, debounceTime, switchMap } from 'rxjs/operators';
import { CartService } from './cart.service';
import { CartDatabaseService } from './cart-database.service';
import { AuthService } from './auth.service';
import { 
  CartItem, 
  CartSummary, 
  CartState, 
  CartSyncState,
  CartItemChange 
} from '../../types/cart';
import { ProductDisplay } from '../../types/product';

@Injectable({
  providedIn: 'root'
})
export class CartStateService implements OnDestroy {
  private cartState = new BehaviorSubject<CartState>({
    items: [],
    summary: this.calculateSummary([]),
    isLoading: false,
    error: null,
    lastSync: null
  });

  private syncState = new BehaviorSubject<CartSyncState>({
    isOnline: true,
    lastSyncAttempt: null,
    pendingChanges: [],
    syncErrors: []
  });

  private pendingChanges = new BehaviorSubject<CartItemChange[]>([]);
  private realtimeSubscription?: any;
  private authSubscription?: Subscription;

  public cartState$ = this.cartState.asObservable();
  public items$ = this.cartState$.pipe(map(state => state.items));
  public summary$ = this.cartState$.pipe(map(state => state.summary));
  public totalItems$ = this.cartState$.pipe(map(state => state.summary.totalItems));
  public syncState$ = this.syncState.asObservable();
  public pendingChanges$ = this.pendingChanges.asObservable();

  constructor(
    private cartService: CartService,
    private cartDatabaseService: CartDatabaseService,
    private authService: AuthService
  ) {
    this.initializeCartState();
    this.setupAuthSubscription();
    this.setupRealtimeSync();
  }

  ngOnDestroy(): void {
    this.realtimeSubscription?.unsubscribe();
    this.authSubscription?.unsubscribe();
  }

  private initializeCartState(): void {
    // Load initial cart from local storage
    this.loadCartFromStorage();
    
    // Subscribe to local cart changes
    this.cartService.cartState$.subscribe(localState => {
      this.updateLocalCartState(localState);
    });
  }

  private setupAuthSubscription(): void {
    this.authSubscription = this.authService.authState$.subscribe(authState => {
      if (authState.isAuthenticated && authState.user) {
        this.syncCartWithDatabase(authState.user.id);
        this.setupRealtimeSubscription(authState.user.id);
      } else {
        this.clearRealtimeSubscription();
        this.clearDatabaseSync();
      }
    });
  }

  private setupRealtimeSync(): void {
    // Monitor network status and sync state
    this.cartDatabaseService.syncStatus$.subscribe(syncStatus => {
      this.syncState.next({
        ...this.syncState.value,
        isOnline: syncStatus.isOnline,
        lastSyncAttempt: syncStatus.lastSync
      });

      // If we're back online and have pending changes, sync them
      if (syncStatus.isOnline && this.pendingChanges.value.length > 0) {
        this.processPendingChanges();
      }
    });
  }

  private setupRealtimeSubscription(userId: string): void {
    this.clearRealtimeSubscription();
    
    this.realtimeSubscription = this.cartDatabaseService
      .subscribeToCartChanges(userId, (payload) => {
        console.log('Real-time cart change detected:', payload);
        this.handleRealtimeCartChange(payload);
      });
  }

  private clearRealtimeSubscription(): void {
    if (this.realtimeSubscription) {
      this.realtimeSubscription.unsubscribe();
      this.realtimeSubscription = undefined;
    }
  }

  private async syncCartWithDatabase(userId: string): Promise<void> {
    try {
      this.updateCartState({ isLoading: true, error: null });
      
      const localItems = this.cartState.value.items;
      const syncedItems = await this.cartDatabaseService.syncCartWithDatabase(userId, localItems);
      
      // Update local state with synced data
      this.updateCartState({
        items: syncedItems,
        summary: this.calculateSummary(syncedItems),
        lastSync: new Date(),
        isLoading: false
      });

      // Update local storage
      this.saveCartToStorage(syncedItems);
      
    } catch (error) {
      console.error('Error syncing cart with database:', error);
      this.updateCartState({ 
        error: error instanceof Error ? error.message : 'Failed to sync cart',
        isLoading: false 
      });
    }
  }

  private handleRealtimeCartChange(payload: any): void {
    const currentItems = this.cartState.value.items;
    let updatedItems = [...currentItems];

    switch (payload.eventType) {
      case 'INSERT':
        // New item added by another device/session
        this.cartDatabaseService.fetchCartItems(payload.new.user_id)
          .then(dbItems => {
            const items = dbItems.map(dbItem => this.cartDatabaseService.transformDatabaseItemToCartItem(dbItem));
            this.updateCartState({
              items,
              summary: this.calculateSummary(items),
              lastSync: new Date()
            });
            this.saveCartToStorage(items);
          });
        break;

      case 'UPDATE':
        // Item updated by another device/session
        const updatedItem = updatedItems.find(item => item.id === payload.new.id);
        if (updatedItem) {
          updatedItem.quantity = payload.new.quantity;
          updatedItem.selectedColor = payload.new.selected_color;
          updatedItem.selectedHandle = payload.new.selected_handle;
          updatedItem.customName = payload.new.custom_name;
          
          this.updateCartState({
            items: updatedItems,
            summary: this.calculateSummary(updatedItems),
            lastSync: new Date()
          });
          this.saveCartToStorage(updatedItems);
        }
        break;

      case 'DELETE':
        // Item removed by another device/session
        updatedItems = updatedItems.filter(item => item.id !== payload.old.id);
        this.updateCartState({
          items: updatedItems,
          summary: this.calculateSummary(updatedItems),
          lastSync: new Date()
        });
        this.saveCartToStorage(updatedItems);
        break;
    }
  }

  // Public methods for cart operations
  async addToCart(
    product: ProductDisplay,
    quantity: number = 1,
    selectedColor?: string,
    selectedHandle?: string,
    customName?: string
  ): Promise<void> {
    try {
      // Add to local cart first for immediate UI feedback
      this.cartService.addToCart(product, quantity, selectedColor, selectedHandle, customName);
      
      // If user is authenticated, add to database
      const user = this.authService.getCurrentUser();
      if (user) {
        await this.cartDatabaseService.addCartItem(user.id, {
          product_id: product.id,
          quantity,
          selected_color: selectedColor,
          selected_handle: selectedHandle,
          custom_name: customName
        });
      }
    } catch (error) {
      console.error('Error adding item to cart:', error);
      // Add to pending changes for later sync
      this.addPendingChange({
        type: 'add',
        item: {
          product_id: product.id,
          quantity,
          selected_color: selectedColor,
          selected_handle: selectedHandle,
          custom_name: customName
        },
        timestamp: new Date(),
        retryCount: 0
      });
    }
  }

  async removeFromCart(itemId: string): Promise<void> {
    try {
      // Remove from local cart first
      this.cartService.removeFromCart(itemId);
      
      // If user is authenticated, remove from database
      const user = this.authService.getCurrentUser();
      if (user) {
        await this.cartDatabaseService.removeCartItem(itemId);
      }
    } catch (error) {
      console.error('Error removing item from cart:', error);
      // Add to pending changes for later sync
      const item = this.cartState.value.items.find(i => i.id === itemId);
      if (item) {
        this.addPendingChange({
          type: 'remove',
          item,
          timestamp: new Date(),
          retryCount: 0
        });
      }
    }
  }

  async updateItemQuantity(itemId: string, quantity: number): Promise<void> {
    try {
      // Update local cart first
      this.cartService.updateItemQuantity(itemId, quantity);
      
      // If user is authenticated, update database
      const user = this.authService.getCurrentUser();
      if (user) {
        await this.cartDatabaseService.updateCartItem(itemId, { quantity });
      }
    } catch (error) {
      console.error('Error updating item quantity:', error);
      // Add to pending changes for later sync
      const item = this.cartState.value.items.find(i => i.id === itemId);
      if (item) {
        this.addPendingChange({
          type: 'update',
          item: { ...item, quantity },
          timestamp: new Date(),
          retryCount: 0
        });
      }
    }
  }

  async clearCart(): Promise<void> {
    try {
      // Clear local cart first
      this.cartService.clearCart();
      
      // If user is authenticated, clear database
      const user = this.authService.getCurrentUser();
      if (user) {
        await this.cartDatabaseService.clearUserCart(user.id);
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      // Add to pending changes for later sync
      this.addPendingChange({
        type: 'remove',
        item: this.cartState.value.items[0], // Just mark that we need to clear
        timestamp: new Date(),
        retryCount: 0
      });
    }
  }

  // Pending changes management
  private addPendingChange(change: CartItemChange): void {
    const current = this.pendingChanges.value;
    this.pendingChanges.next([...current, change]);
    
    this.syncState.next({
      ...this.syncState.value,
      pendingChanges: [...this.syncState.value.pendingChanges, change]
    });
  }

  private async processPendingChanges(): Promise<void> {
    const changes = this.pendingChanges.value;
    if (changes.length === 0) return;

    const user = this.authService.getCurrentUser();
    if (!user) return;

    const successfulChanges: CartItemChange[] = [];
    const failedChanges: CartItemChange[] = [];

    for (const change of changes) {
      try {
        switch (change.type) {
          case 'add':
            await this.cartDatabaseService.addCartItem(user!.id, change.item as any);
            successfulChanges.push(change);
            break;
          case 'update':
            const item = change.item as CartItem;
            await this.cartDatabaseService.updateCartItem(item.id, {
              quantity: item.quantity,
              selected_color: item.selectedColor,
              selected_handle: item.selectedHandle,
              custom_name: item.customName
            });
            successfulChanges.push(change);
            break;
          case 'remove':
            const removeItem = change.item as CartItem;
            await this.cartDatabaseService.removeCartItem(removeItem.id);
            successfulChanges.push(change);
            break;
        }
      } catch (error) {
        console.error('Error processing pending change:', error);
        change.retryCount++;
        if (change.retryCount < 3) {
          failedChanges.push(change);
        }
      }
    }

    // Remove successful changes and update pending
    const remainingChanges = failedChanges;
    this.pendingChanges.next(remainingChanges);
    
    this.syncState.next({
      ...this.syncState.value,
      pendingChanges: remainingChanges
    });
  }

  // Helper methods
  private updateCartState(updates: Partial<CartState>): void {
    const current = this.cartState.value;
    this.cartState.next({ ...current, ...updates });
  }

  private updateLocalCartState(localState: CartState): void {
    // Only update if we don't have a more recent database sync
    if (!this.cartState.value.lastSync || 
        localState.lastSync && localState.lastSync > this.cartState.value.lastSync) {
      this.updateCartState(localState);
    }
  }

  private loadCartFromStorage(): void {
    try {
      const storedCart = localStorage.getItem('luli-cart');
      if (storedCart) {
        const cartData = JSON.parse(storedCart);
        this.updateCartState({
          items: cartData.items || [],
          summary: this.calculateSummary(cartData.items || []),
          lastSync: cartData.lastSync ? new Date(cartData.lastSync) : null
        });
      }
    } catch (error) {
      console.error('Error loading cart from storage:', error);
    }
  }

  private saveCartToStorage(items: CartItem[]): void {
    try {
      localStorage.setItem('luli-cart', JSON.stringify({
        items,
        lastSync: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error saving cart to storage:', error);
    }
  }

  private calculateSummary(items: CartItem[]): CartSummary {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalDiscount = items.reduce((sum, item) => {
      if (item.product.originalPrice) {
        return sum + ((item.product.originalPrice - item.price) * item.quantity);
      }
      return sum;
    }, 0);
    const shipping = subtotal > 0 ? (subtotal >= 200 ? 0 : 15) : 0;
    const tax = subtotal * 0.08; // 8% tax rate

    return {
      totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: subtotal + shipping + tax,
      totalDiscount,
      subtotal,
      shipping,
      tax
    };
  }

  private clearDatabaseSync(): void {
    this.updateCartState({
      lastSync: null,
      error: null
    });
  }

  // Public getters
  getCartState(): CartState {
    return this.cartState.value;
  }

  getSyncState(): CartSyncState {
    return this.syncState.value;
  }

  getPendingChangesCount(): number {
    return this.pendingChanges.value.length;
  }
}
