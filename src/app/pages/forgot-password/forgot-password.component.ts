import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  email = '';
  isSubmitted = false;
  isLoading = false;
  submitError = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async onSubmit(): Promise<void> {
    if (!this.email) {
      this.submitError = 'Please enter your email address.';
      return;
    }

    this.isLoading = true;
    this.submitError = '';
    
    try {
      const result = await this.authService.resetPassword(this.email);
      
      if (result.error) {
        this.submitError = result.error.message || 'Failed to send reset link. Please try again.';
      } else {
        this.isSubmitted = true;
      }
    } catch (error: any) {
      this.submitError = 'An unexpected error occurred. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  tryAnotherEmail(): void {
    this.isSubmitted = false;
    this.email = '';
    this.submitError = '';
  }
}
