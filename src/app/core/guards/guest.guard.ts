// src/app/core/guards/guest.guard.ts

import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

// Prevents authenticated users from accessing auth pages
export const GuestGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.authState$.pipe(
    take(1),
    map(authState => {
      if (authState.isAuthenticated) {
        router.navigate(['/']);
        return false;
      }
      return true;
    })
  );
};
