import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { CartStateService } from './cart-state.service';
import { CartItem, CartSummary, CartState } from '../../types/cart';
import { ProductDisplay } from '../../types/product';

@Injectable({
  providedIn: 'root'
})
export class CartIntegrationService {
  private cartBadgeCount = new BehaviorSubject<number>(0);
  private cartTotal = new BehaviorSubject<number>(0);

  public cartBadgeCount$ = this.cartBadgeCount.asObservable();
  public cartTotal$ = this.cartTotal.asObservable();

  constructor(private cartStateService: CartStateService) {
    this.initializeCartObservers();
  }

  private initializeCartObservers(): void {
    // Subscribe to cart state changes and update badge count and total
    this.cartStateService.cartState$.subscribe(state => {
      this.cartBadgeCount.next(state.summary.totalItems);
      this.cartTotal.next(state.summary.totalPrice);
    });
  }

  // Cart state observables
  get cartState$(): Observable<CartState> {
    return this.cartStateService.cartState$;
  }

  get items$(): Observable<CartItem[]> {
    return this.cartStateService.items$;
  }

  get summary$(): Observable<CartSummary> {
    return this.cartStateService.summary$;
  }

  get totalItems$(): Observable<number> {
    return this.cartStateService.totalItems$;
  }

  get syncState$(): Observable<any> {
    return this.cartStateService.syncState$;
  }

  // Cart operations
  async addToCart(
    product: ProductDisplay,
    quantity: number = 1,
    selectedColor?: string,
    selectedHandle?: string,
    customName?: string
  ): Promise<void> {
    return this.cartStateService.addToCart(product, quantity, selectedColor, selectedHandle, customName);
  }

  async removeFromCart(itemId: string): Promise<void> {
    return this.cartStateService.removeFromCart(itemId);
  }

  async updateItemQuantity(itemId: string, quantity: number): Promise<void> {
    return this.cartStateService.updateItemQuantity(itemId, quantity);
  }

  async clearCart(): Promise<void> {
    return this.cartStateService.clearCart();
  }

  // Cart state getters
  getCartState(): CartState {
    return this.cartStateService.getCartState();
  }

  getSyncState(): any {
    return this.cartStateService.getSyncState();
  }

  getPendingChangesCount(): number {
    return this.cartStateService.getPendingChangesCount();
  }

  // Cart utility methods
  isCartEmpty(): boolean {
    const state = this.getCartState();
    return state.items.length === 0;
  }

  getCartItemCount(): number {
    const state = this.getCartState();
    return state.summary.totalItems;
  }

  getCartTotal(): number {
    const state = this.getCartState();
    return state.summary.totalPrice;
  }

  getCartSubtotal(): number {
    const state = this.getCartState();
    return state.summary.subtotal;
  }

  getCartShipping(): number {
    const state = this.getCartState();
    return state.summary.shipping;
  }

  getCartTax(): number {
    const state = this.getCartState();
    return state.summary.tax;
  }

  getCartDiscount(): number {
    const state = this.getCartState();
    return state.summary.totalDiscount;
  }

  // Cart item utilities
  getCartItemById(itemId: string): CartItem | undefined {
    const state = this.getCartState();
    return state.items.find(item => item.id === itemId);
  }

  isProductInCart(
    productId: string,
    selectedColor?: string,
    selectedHandle?: string,
    customName?: string
  ): boolean {
    const state = this.getCartState();
    return state.items.some(item =>
      item.product.id === productId &&
      item.selectedColor === selectedColor &&
      item.selectedHandle === selectedHandle &&
      item.customName === customName
    );
  }

  getProductQuantityInCart(
    productId: string,
    selectedColor?: string,
    selectedHandle?: string,
    customName?: string
  ): number {
    const state = this.getCartState();
    const item = state.items.find(item =>
      item.product.id === productId &&
      item.selectedColor === selectedColor &&
      item.selectedHandle === selectedHandle &&
      item.customName === customName
    );
    return item ? item.quantity : 0;
  }

  // Cart validation
  validateCartForCheckout(): { isValid: boolean; errors: string[] } {
    const state = this.getCartState();
    const errors: string[] = [];

    if (state.items.length === 0) {
      errors.push('Cart is empty');
    }

    // Check if all items are in stock
    state.items.forEach(item => {
      if (!item.product.inStock) {
        errors.push(`${item.product.name} is out of stock`);
      }
      if (item.quantity > item.product.stockQuantity) {
        errors.push(`Only ${item.product.stockQuantity} ${item.product.name} available`);
      }
    });

    // Check if total is valid
    if (state.summary.totalPrice <= 0) {
      errors.push('Invalid cart total');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Cart export for checkout
  exportCartForCheckout(): {
    items: CartItem[];
    summary: CartSummary;
    validation: { isValid: boolean; errors: string[] };
  } {
    const state = this.getCartState();
    const validation = this.validateCartForCheckout();

    return {
      items: state.items,
      summary: state.summary,
      validation
    };
  }

  // Cart import from external source (e.g., saved cart, wishlist)
  async importCartItems(items: CartItem[]): Promise<void> {
    for (const item of items) {
      await this.addToCart(
        item.product,
        item.quantity,
        item.selectedColor,
        item.selectedHandle,
        item.customName
      );
    }
  }

  // Cart sharing utilities
  generateCartShareLink(): string {
    const state = this.getCartState();
    const cartData = {
      items: state.items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        selectedColor: item.selectedColor,
        selectedHandle: item.selectedHandle,
        customName: item.customName
      }))
    };
    
    const encodedData = btoa(JSON.stringify(cartData));
    return `${window.location.origin}/cart?shared=${encodedData}`;
  }

  async importSharedCart(sharedData: string): Promise<void> {
    try {
      const decodedData = JSON.parse(atob(sharedData));
      if (decodedData.items && Array.isArray(decodedData.items)) {
        // Clear current cart first
        await this.clearCart();
        
        // Import shared items
        for (const itemData of decodedData.items) {
          // Note: This would need to fetch the actual product data
          // For now, we'll just log the attempt
          console.log('Importing shared cart item:', itemData);
        }
      }
    } catch (error) {
      console.error('Error importing shared cart:', error);
    }
  }
}
