import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CartStateService } from '../services/cart-state.service';
import { firstValueFrom } from 'rxjs';
import { filter, take, timeout } from 'rxjs/operators';

export const CartSyncGuard = async () => {
  const cartStateService = inject(CartStateService);
  const authService = inject(AuthService);
  const router = inject(Router);

  try {
    // Wait for auth state to be initialized
    await firstValueFrom(
      authService.authState$.pipe(
        filter(state => !state.isLoading),
        take(1),
        timeout(5000) // 5 second timeout
      )
    );

    const user = authService.getCurrentUser();
    
    if (user) {
      // Wait for cart to be synchronized
      await firstValueFrom(
        cartStateService.cartState$.pipe(
          filter(state => !state.isLoading && state.lastSync !== null),
          take(1),
          timeout(10000) // 10 second timeout
        )
      );
    }

    return true;
  } catch (error) {
    console.error('Cart sync guard error:', error);
    // If sync fails, still allow navigation but log the issue
    return true;
  }
};
