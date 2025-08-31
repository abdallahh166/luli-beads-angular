import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { CartStateService } from '../services/cart-state.service';

@Injectable()
export class CartSyncInterceptor implements HttpInterceptor {
  private isRetrying = false;
  private retryQueue: Array<() => void> = [];

  constructor(private cartStateService: CartStateService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Only intercept cart-related requests
    if (!this.isCartRequest(request)) {
      return next.handle(request);
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (this.shouldRetryCartRequest(error, request)) {
          return this.handleCartRequestError(request, next, error);
        }
        return throwError(() => error);
      })
    );
  }

  private isCartRequest(request: HttpRequest<any>): boolean {
    return request.url.includes('/cart') || 
           request.url.includes('cart_items') ||
           request.url.includes('supabase');
  }

  private shouldRetryCartRequest(error: HttpErrorResponse, request: HttpRequest<any>): boolean {
    // Retry on network errors or specific HTTP status codes
    return (
      error.status === 0 || // Network error
      error.status === 408 || // Request timeout
      error.status === 500 || // Internal server error
      error.status === 502 || // Bad gateway
      error.status === 503 || // Service unavailable
      error.status === 504    // Gateway timeout
    ) && !this.isRetrying;
  }

  private handleCartRequestError(
    request: HttpRequest<any>, 
    next: HttpHandler, 
    error: HttpErrorResponse
  ): Observable<HttpEvent<any>> {
    // Add to retry queue
    this.retryQueue.push(() => {
      this.retryRequest(request, next);
    });

    // If not already retrying, start the retry process
    if (!this.isRetrying) {
      this.processRetryQueue();
    }

    // Return the original error for now
    return throwError(() => error);
  }

  private async processRetryQueue(): Promise<void> {
    if (this.isRetrying || this.retryQueue.length === 0) {
      return;
    }

    this.isRetrying = true;

    // Wait for network to be available
    await this.waitForNetwork();

    // Process all queued requests
    while (this.retryQueue.length > 0) {
      const retryFn = this.retryQueue.shift();
      if (retryFn) {
        try {
          await new Promise<void>((resolve) => {
            retryFn();
            resolve();
          });
        } catch (error) {
          console.error('Error retrying cart request:', error);
        }
      }
    }

    this.isRetrying = false;
  }

  private async waitForNetwork(): Promise<void> {
    return new Promise<void>((resolve) => {
      const syncState$ = this.cartStateService.syncState$;
      
      const subscription = syncState$.pipe(
        filter(state => state.isOnline),
        take(1)
      ).subscribe(() => {
        subscription.unsubscribe();
        resolve();
      });

      // If already online, resolve immediately
      const currentState = this.cartStateService.getSyncState();
      if (currentState.isOnline) {
        resolve();
      }
    });
  }

  private retryRequest(request: HttpRequest<any>, next: HttpHandler): void {
    // Implement exponential backoff retry logic
    const maxRetries = 3;
    let retryCount = 0;

    const attemptRetry = () => {
      if (retryCount >= maxRetries) {
        console.error('Max retries exceeded for cart request:', request.url);
        return;
      }

      retryCount++;
      const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff

      setTimeout(() => {
        next.handle(request).subscribe({
          next: () => {
            console.log('Cart request retry successful:', request.url);
          },
          error: (error) => {
            console.error('Cart request retry failed:', request.url, error);
            if (this.shouldRetryCartRequest(error, request)) {
              attemptRetry();
            }
          }
        });
      }, delay);
    };

    attemptRetry();
  }
}
