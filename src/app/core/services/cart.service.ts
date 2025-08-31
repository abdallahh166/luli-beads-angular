import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CartItem, CartSummary, CartState } from '../../types/cart';
import { ProductDisplay } from '../../types/product';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartState = new BehaviorSubject<CartState>({
    items: [],
    summary: this.calculateSummary([]),
    isLoading: false,
    error: null,
    lastSync: null
  });

  public cartState$ = this.cartState.asObservable();
  public items$ = this.cartState$.pipe(map(state => state.items));
  public summary$ = this.cartState$.pipe(map(state => state.summary));
  public totalItems$ = this.cartState$.pipe(map(state => state.summary.totalItems));

  constructor() {
    this.loadCartFromStorage();
  }

  private loadCartFromStorage(): void {
    try {
      const storedCart = localStorage.getItem('luli-cart');
      if (storedCart) {
        const cartData = JSON.parse(storedCart);
        this.updateCart(cartData.items || []);
      }
    } catch (error) {
      console.error('Error loading cart from storage:', error);
    }
  }

  private saveCartToStorage(items: CartItem[]): void {
    try {
      localStorage.setItem('luli-cart', JSON.stringify({ items }));
    } catch (error) {
      console.error('Error saving cart to storage:', error);
    }
  }

  addToCart(
    product: ProductDisplay,
    quantity: number = 1,
    selectedColor?: string,
    selectedHandle?: string,
    customName?: string
  ): void {
    const existingItem = this.cartState.value.items.find(item =>
      item.product.id === product.id &&
      item.selectedColor === selectedColor &&
      item.selectedHandle === selectedHandle &&
      item.customName === customName
    );

    if (existingItem) {
      this.updateItemQuantity(existingItem.id, existingItem.quantity + quantity);
    } else {
      const newItem: CartItem = {
        id: this.generateItemId(),
        product,
        quantity,
        selectedColor,
        selectedHandle,
        customName,
        price: product.price
      };

      const updatedItems = [...this.cartState.value.items, newItem];
      this.updateCart(updatedItems);
    }
  }

  removeFromCart(itemId: string): void {
    const updatedItems = this.cartState.value.items.filter(item => item.id !== itemId);
    this.updateCart(updatedItems);
  }

  updateItemQuantity(itemId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(itemId);
      return;
    }

    const updatedItems = this.cartState.value.items.map(item =>
      item.id === itemId ? { ...item, quantity } : item
    );
    this.updateCart(updatedItems);
  }

  updateItemCustomization(
    itemId: string,
    updates: Partial<Pick<CartItem, 'selectedColor' | 'selectedHandle' | 'customName'>>
  ): void {
    const updatedItems = this.cartState.value.items.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    );
    this.updateCart(updatedItems);
  }

  clearCart(): void {
    this.updateCart([]);
  }

  private updateCart(items: CartItem[]): void {
    const summary = this.calculateSummary(items);
    const newState: CartState = {
      items,
      summary,
      isLoading: false,
      error: null,
      lastSync: new Date()
    };

    this.cartState.next(newState);
    this.saveCartToStorage(items);
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

  private generateItemId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  getCartItemById(itemId: string): CartItem | undefined {
    return this.cartState.value.items.find(item => item.id === itemId);
  }

  getCartTotal(): number {
    return this.cartState.value.summary.totalPrice;
  }

  getCartItemCount(): number {
    return this.cartState.value.summary.totalItems;
  }

  isCartEmpty(): boolean {
    return this.cartState.value.items.length === 0;
  }
}
