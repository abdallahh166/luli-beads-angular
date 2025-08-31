import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

export interface AppError {
  message: string;
  code?: string;
  status?: number;
  timestamp: Date;
  userMessage?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  constructor(
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  handleError(error: any, context?: string): AppError {
    const appError: AppError = {
      message: error.message || 'An unexpected error occurred',
      code: error.code || 'UNKNOWN_ERROR',
      status: error.status || 500,
      timestamp: new Date(),
      userMessage: this.getUserFriendlyMessage(error)
    };

    // Log error for debugging
    console.error(`[${context || 'App'}] Error:`, appError);

    // Show user-friendly message
    this.showUserMessage(appError.userMessage || 'Something went wrong. Please try again.');

    // Handle specific error types
    this.handleSpecificErrors(appError);

    return appError;
  }

  private getUserFriendlyMessage(error: any): string {
    if (error.status === 401) {
      return 'Please log in to continue.';
    }
    if (error.status === 403) {
      return 'You don\'t have permission to perform this action.';
    }
    if (error.status === 404) {
      return 'The requested resource was not found.';
    }
    if (error.status === 500) {
      return 'Server error. Please try again later.';
    }
    if (error.code === 'NETWORK_ERROR') {
      return 'Network error. Please check your connection.';
    }
    return 'Something went wrong. Please try again.';
  }

  private showUserMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['error-snackbar']
    });
  }

  private handleSpecificErrors(error: AppError): void {
    switch (error.status) {
      case 401:
        // Redirect to login
        this.router.navigate(['/auth']);
        break;
      case 403:
        // Redirect to home or show access denied
        this.router.navigate(['/']);
        break;
      case 404:
        // Redirect to not found page
        this.router.navigate(['/not-found']);
        break;
    }
  }

  // Method for handling async errors
  async handleAsyncError<T>(promise: Promise<T>, context?: string): Promise<T | null> {
    try {
      return await promise;
    } catch (error) {
      this.handleError(error, context);
      return null;
    }
  }

  // Method for handling observable errors
  handleObservableError<T>(observable: any, context?: string): any {
    return observable.pipe(
      // Add error handling operators here if needed
    );
  }
}
