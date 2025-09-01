// src/app/core/guards/enhanced-auth.guard.ts

import { Injectable, inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, CanActivate } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { AuthenticationStatus, UserRole } from '../interfaces/auth.interface';

@Injectable({
  providedIn: 'root'
})
export class EnhancedAuthGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {    return this.authService.authState$.pipe(
      take(1),
      map(authState => {
        // Still loading
        if (authState.status === AuthenticationStatus.LOADING) {
          return false; // Let the loading continue
        }

        // Not authenticated
        if (!authState.isAuthenticated) {
          this.router.navigate(['/auth'], {
            queryParams: { returnUrl: state.url }
          });
          return false;
        }

        // Check role requirements if specified
        const requiredRoles = route.data?.['roles'] as UserRole[];
        if (requiredRoles && requiredRoles.length > 0) {
          const hasRequiredRole = requiredRoles.some(role =>
            this.authService.hasRole(role)
          );

          if (!hasRequiredRole) {
            this.router.navigate(['/unauthorized']);
            return false;
          }
        }

        return true;
      })
    );
  }
}

// Usage examples:
// Route with authentication required: canActivate: [EnhancedAuthGuard]
// Route with admin role required: canActivate: [EnhancedAuthGuard], data: { roles: [UserRole.ADMIN] }
// Route with admin or moderator role: canActivate: [EnhancedAuthGuard], data: { roles: [UserRole.ADMIN, UserRole.MODERATOR] }