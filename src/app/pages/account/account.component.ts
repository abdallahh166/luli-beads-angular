import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  order_items: Array<{
    id: string;
    quantity: number;
    price: number;
    selected_color?: string;
    selected_handle?: string;
    custom_name?: string;
    products: {
      name: string;
      image_url: string;
    };
  }>;
}

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './account.component.html',
  styleUrl: './account.component.css'
})
export class AccountComponent implements OnInit {
  activeTab: 'profile' | 'orders' | 'settings' = 'profile';
  profile: Profile | null = null;
  orders: Order[] = [];
  isLoading = true;
  isUpdating = false;
  
  editData = {
    full_name: '',
    phone: ''
  };

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchProfile();
    this.loadOrders();
  }

  setActiveTab(tab: 'profile' | 'orders' | 'settings'): void {
    this.activeTab = tab;
  }

  private fetchProfile(): void {
    // Mock profile data - in real app, this would come from a service
    this.profile = {
      id: '1',
      email: 'john.doe@example.com',
      full_name: 'John Doe',
      phone: '+1 (555) 123-4567'
    };
    
    this.editData = {
      full_name: this.profile.full_name || '',
      phone: this.profile.phone || ''
    };
    
    this.isLoading = false;
  }

  private loadOrders(): void {
    // Mock orders data - in real app, this would come from a service
    this.orders = [
      {
        id: 'ORD-001',
        total_amount: 149.99,
        status: 'completed',
        created_at: '2024-01-15T10:30:00Z',
        order_items: [
          {
            id: '1',
            quantity: 1,
            price: 149.99,
            selected_color: 'Rose Gold',
            selected_handle: 'Chain Strap',
            products: {
              name: 'Rose Gold Beaded Clutch',
              image_url: '/assets/product-rose-bag.jpg'
            }
          }
        ]
      },
      {
        id: 'ORD-002',
        total_amount: 89.99,
        status: 'shipped',
        created_at: '2024-01-10T14:20:00Z',
        order_items: [
          {
            id: '2',
            quantity: 1,
            price: 89.99,
            selected_color: 'Black',
            products: {
              name: 'Black Beaded Evening Bag',
              image_url: '/assets/product-black-bag.jpg'
            }
          }
        ]
      }
    ];
  }

  updateProfile(): void {
    if (!this.profile) return;

    this.isUpdating = true;
    
    // Simulate API call
    setTimeout(() => {
      this.profile = {
        ...this.profile!,
        full_name: this.editData.full_name,
        phone: this.editData.phone
      };
      this.isUpdating = false;
      console.log('Profile updated:', this.profile);
    }, 2000);
  }

  handleSignOut(): void {
    console.log('Sign out clicked');
    this.authService.signOut().then(() => {
      this.router.navigate(['/']);
    });
  }

  navigateToHome(): void {
    this.router.navigate(['/']);
  }

  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}
