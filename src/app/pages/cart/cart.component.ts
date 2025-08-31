import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartStateService } from '../../core/services/cart-state.service';
import { CartItem, CartState } from '../../types/cart';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent implements OnInit, OnDestroy {
  couponCode = '';
  cartState: CartState = {
    items: [],
    summary: {
      totalItems: 0,
      totalPrice: 0,
      totalDiscount: 0,
      subtotal: 0,
      shipping: 0,
      tax: 0
    },
    isLoading: false,
    error: null,
    lastSync: null
  };

  private subscription = new Subscription();

  constructor(public cartStateService: CartStateService) {}

  ngOnInit(): void {
    this.subscription.add(
      this.cartStateService.cartState$.subscribe(state => {
        this.cartState = state;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  trackByItemId(index: number, item: CartItem): string {
    return item.id;
  }

  async removeItem(itemId: string): Promise<void> {
    try {
      await this.cartStateService.removeFromCart(itemId);
    } catch (error) {
      console.error('Error removing item:', error);
    }
  }

  async updateQuantity(itemId: string, quantity: number): Promise<void> {
    try {
      await this.cartStateService.updateItemQuantity(itemId, quantity);
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  }

  async refreshCart(): Promise<void> {
    // The cart will automatically sync when the user is authenticated
    // This method can be used for manual refresh if needed
    console.log('Cart refresh requested');
  }

  async clearCart(): Promise<void> {
    try {
      await this.cartStateService.clearCart();
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  }

  applyCoupon(): void {
    if (this.couponCode.trim()) {
      // TODO: Implement coupon functionality
      console.log('Coupon applied:', this.couponCode);
      this.couponCode = '';
    }
  }

  get isCartEmpty(): boolean {
    return this.cartState.items.length === 0;
  }

  get isLoading(): boolean {
    return this.cartState.isLoading;
  }

  get hasError(): boolean {
    return !!this.cartState.error;
  }
}
