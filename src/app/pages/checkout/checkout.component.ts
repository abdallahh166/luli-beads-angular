import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartIntegrationService } from '../../core/services/cart-integration.service';
import { CartItem, CartState } from '../../types/cart';
import { Subscription } from 'rxjs';

interface FormData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  notes: string;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit, OnDestroy {
  formData: FormData = {
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    notes: ''
  };
  paymentMethod = 'card';
  isSubmitting = false;
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

  constructor(
    private cartService: CartIntegrationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subscription.add(
      this.cartService.cartState$.subscribe(state => {
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

  async onSubmit(): Promise<void> {
    // Validate required fields
    if (!this.formData.email || !this.formData.firstName || !this.formData.lastName || 
        !this.formData.phone || !this.formData.address || !this.formData.city || !this.formData.postalCode) {
      alert('Please fill in all required fields.');
      return;
    }

    // Validate cart
    const validation = this.cartService.validateCartForCheckout();
    if (!validation.isValid) {
      alert('Cart validation failed: ' + validation.errors.join(', '));
      return;
    }

    this.isSubmitting = true;
    
    try {
      // Simulate order processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Clear cart and redirect to account page
      await this.cartService.clearCart();
      this.router.navigate(['/account']);
    } catch (error) {
      console.error('Error processing order:', error);
      alert('There was an error processing your order. Please try again.');
    } finally {
      this.isSubmitting = false;
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
