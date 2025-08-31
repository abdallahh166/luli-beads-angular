import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const AdminGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isUserAuthenticated() && authService.isUserAdmin()) {
    return true;
  }

  if (!authService.isUserAuthenticated()) {
    router.navigate(['/auth']);
  } else {
    router.navigate(['/']);
  }
  
  return false;
};
