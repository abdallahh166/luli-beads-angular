import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

interface SignInData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface SignUpData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css'
})
export class AuthComponent implements OnInit {
  activeTab: 'signin' | 'signup' = 'signin';
  
  signInData: SignInData = {
    email: '',
    password: '',
    rememberMe: false
  };
  
  signUpData: SignUpData = {
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  };
  
  isSigningIn = false;
  isSigningUp = false;
  signInError = '';
  signUpError = '';
  signUpSuccess = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {}

  setActiveTab(tab: 'signin' | 'signup'): void {
    this.activeTab = tab;
    this.clearErrors();
  }

  clearErrors(): void {
    this.signInError = '';
    this.signUpError = '';
    this.signUpSuccess = '';
  }

  async onSignIn(): Promise<void> {
    if (!this.signInData.email || !this.signInData.password) {
      this.signInError = 'Please fill in all required fields.';
      return;
    }

    this.isSigningIn = true;
    this.signInError = '';
    
    try {
      const result = await this.authService.signIn(this.signInData.email, this.signInData.password);
      
      if (result.error) {
        this.signInError = result.error.message || 'Sign in failed. Please try again.';
      } else {
        // Redirect to home page or intended destination
        this.router.navigate(['/']);
      }
    } catch (error: any) {
      this.signInError = 'An unexpected error occurred. Please try again.';
    } finally {
      this.isSigningIn = false;
    }
  }

  async onSignUp(): Promise<void> {
    if (!this.signUpData.name || !this.signUpData.email || !this.signUpData.password || !this.signUpData.confirmPassword) {
      this.signUpError = 'Please fill in all required fields.';
      return;
    }

    if (this.signUpData.password !== this.signUpData.confirmPassword) {
      this.signUpError = 'Passwords do not match.';
      return;
    }

    if (this.signUpData.password.length < 6) {
      this.signUpError = 'Password must be at least 6 characters long.';
      return;
    }

    this.isSigningUp = true;
    this.signUpError = '';
    this.signUpSuccess = '';
    
    try {
      const result = await this.authService.signUp(this.signUpData.email, this.signUpData.password, this.signUpData.name);
      
      if (result.error) {
        this.signUpError = result.error.message || 'Sign up failed. Please try again.';
      } else {
        this.signUpSuccess = 'Account created successfully! Please check your email to verify your account.';
        this.signUpData = {
          name: '',
          email: '',
          password: '',
          confirmPassword: ''
        };
      }
    } catch (error: any) {
      this.signUpError = 'An unexpected error occurred. Please try again.';
    } finally {
      this.isSigningUp = false;
    }
  }

  async signInWithGoogle(): Promise<void> {
    try {
      // TODO: Implement Google OAuth
      console.log('Google sign in clicked');
    } catch (error) {
      console.error('Google sign in error:', error);
    }
  }

  async signInWithFacebook(): Promise<void> {
    try {
      // TODO: Implement Facebook OAuth
      console.log('Facebook sign in clicked');
    } catch (error) {
      console.error('Facebook sign in error:', error);
    }
  }
}
