import { Routes } from '@angular/router';
import { EnhancedAuthGuard } from './core/guards/enhanced-auth.guard';
import { GuestGuard } from './core/guards/guest.guard';
import { UserRole } from './core/interfaces/auth.interface';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'product/:id',
    loadComponent: () =>
      import('./pages/product-detail/product-detail.component').then(m => m.ProductDetailComponent)
  },
  {
    path: 'cart',
    loadComponent: () =>
      import('./pages/cart/cart.component').then(m => m.CartComponent),
    canActivate: [() =>
      import('./core/guards/cart-sync.guard').then(m => m.CartSyncGuard)
    ]
  },
  {
    path: 'checkout',
    loadComponent: () =>
      import('./pages/checkout/checkout.component').then(m => m.CheckoutComponent),
    canActivate: [() =>
      import('./core/guards/cart-sync.guard').then(m => m.CartSyncGuard)
    ]
  },
  {
    path: 'auth',
    loadComponent: () =>
      import('./pages/auth/auth.component').then(m => m.AuthComponent),
    canActivate: [GuestGuard]
  },
  {
    path: 'account',
    loadComponent: () =>
      import('./pages/account/account.component').then(m => m.AccountComponent),
    canActivate: [EnhancedAuthGuard]
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./pages/admin/admin.component').then(m => m.AdminComponent),
    canActivate: [EnhancedAuthGuard],
    data: { roles: [UserRole.ADMIN] }
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./pages/contact/contact.component').then(m => m.ContactComponent)
  },
  {
    path: 'about',
    loadComponent: () =>
      import('./pages/about/about.component').then(m => m.AboutComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./pages/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'wishlist',
    loadComponent: () =>
      import('./pages/wishlist/wishlist.component').then(m => m.WishlistComponent),
    canActivate: [EnhancedAuthGuard]
  },
  {
    path: '**',
    loadComponent: () =>
      import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
