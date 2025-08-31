import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';

import { routes } from './app.routes';
import { productReducer } from './store/reducers/product.reducer';
import { CartSyncInterceptor } from './core/interceptors/cart-sync.interceptor';
// import { ProductEffects } from './store/effects/product.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptorsFromDi(),
      // Add custom interceptors
      withInterceptorsFromDi()
    ),
    provideAnimations(),
    provideStore({
      products: productReducer,
      // Add other reducers here as they're created
    }),
    // Temporarily disable effects to fix initialization issue
    // provideEffects([ProductEffects]),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: !isDevMode(),
      autoPause: true,
      trace: false,
      traceLimit: 75,
    }),
  ]
};
