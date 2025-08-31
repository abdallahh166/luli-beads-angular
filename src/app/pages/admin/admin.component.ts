import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { AuthService } from '../../core/services/auth.service';
import { ProductDisplay, ProductStats } from '../../types/product';
import { ProductFormComponent } from '../../shared/components/product-form/product-form.component';

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: any[];
  createdAt: string;
  paymentMethod?: string;
}

// Remove this interface since we're using ProductDisplay from types

interface AdminStats {
  totalSales: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  monthlyOrders: number;
  monthlyRevenue: number;
  lowStockProducts: number;
  pendingOrders: number;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ProductFormComponent
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit {
  activeTab: 'overview' | 'orders' | 'products' | 'customers' | 'analytics' = 'overview';
  
  orders: Order[] = [];
  products: ProductDisplay[] = [];
  filteredOrders: Order[] = [];
  filteredProducts: ProductDisplay[] = [];
  
  stats: ProductStats = {
    totalProducts: 0,
    inStockProducts: 0,
    outOfStockProducts: 0,
    lowStockProducts: 0,
    featuredProducts: 0,
    newProducts: 0,
    bestsellerProducts: 0,
    totalValue: 0
  };

  // Additional admin stats for orders and sales
  adminStats = {
    totalSales: 0,
    totalOrders: 0,
    totalCustomers: 0,
    monthlyOrders: 0,
    monthlyRevenue: 0,
    pendingOrders: 0
  };
  
  isDataLoading = true;
  refreshing = false;
  
  // Search and Filter States
  orderSearch = '';
  productSearch = '';
  orderStatusFilter = 'all';
  productStockFilter = 'all';
  
  // Product form state
  showProductForm = false;
  editingProduct: ProductDisplay | null = null;

  constructor(
    public authService: AuthService,
    private productService: ProductService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchAdminData();
    this.subscribeToProductUpdates();
  }

  setActiveTab(tab: 'overview' | 'orders' | 'products' | 'customers' | 'analytics'): void {
    this.activeTab = tab;
  }

  private fetchAdminData(): void {
    this.isDataLoading = true;
    
    // Mock data - in real app, this would come from services
    this.orders = [
      {
        id: 'ORD-001',
        customerName: 'Jane Doe',
        customerEmail: 'jane@example.com',
        customerPhone: '+1 (555) 123-4567',
        shippingAddress: '123 Main St, New York, NY 10001',
        totalAmount: 149.99,
        status: 'processing',
        items: [],
        createdAt: '2024-01-15T10:30:00Z',
        paymentMethod: 'Credit Card'
      },
      {
        id: 'ORD-002',
        customerName: 'John Smith',
        customerEmail: 'john@example.com',
        customerPhone: '+1 (555) 987-6543',
        shippingAddress: '456 Oak Ave, Los Angeles, CA 90210',
        totalAmount: 89.99,
        status: 'shipped',
        items: [],
        createdAt: '2024-01-14T14:20:00Z',
        paymentMethod: 'PayPal'
      }
    ];

    this.products = [
      {
        id: '1',
        name: 'Rose Gold Beaded Evening Clutch',
        price: 149.99,
        originalPrice: 179.99,
        description: 'Elegant evening clutch featuring handcrafted rose gold beads',
        images: ['/assets/product-rose-bag.jpg'],
        categoryId: 'handbag',
        inStock: true,
        stockQuantity: 5,
        colors: ['Rose Gold', 'Cream', 'Gold'],
        handles: ['Chain Strap', 'Leather Handle'],
        features: ['Handcrafted', 'Premium Materials'],
        isNew: true,
        isBestseller: true,
        customizable: true,
        featured: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        name: 'Black Beaded Statement Bag',
        price: 129.99,
        description: 'Sophisticated black beaded bag with intricate patterns',
        images: ['/assets/product-black-bag.jpg'],
        categoryId: 'handbag',
        inStock: true,
        stockQuantity: 8,
        colors: ['Black', 'Silver'],
        handles: ['Chain Strap', 'Leather Handle'],
        features: ['Handcrafted', 'Premium Materials'],
        isNew: false,
        isBestseller: false,
        customizable: true,
        featured: false,
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      }
    ];

    this.filteredOrders = [...this.orders];
    this.filteredProducts = [...this.products];
    
    // Calculate stats
    const totalSales = this.orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const thisMonthOrders = this.orders.filter(order => 
      new Date(order.createdAt).getMonth() === new Date().getMonth()
    );
    
    this.adminStats = {
      totalSales,
      totalOrders: this.orders.length,
      totalCustomers: 18, // Mock value
      monthlyOrders: thisMonthOrders.length,
      monthlyRevenue: thisMonthOrders.reduce((sum, order) => sum + order.totalAmount, 0),
      pendingOrders: this.orders.filter(o => o.status === 'pending').length
    };
    
    this.isDataLoading = false;
  }

  /**
   * Subscribe to real-time product updates
   */
  private subscribeToProductUpdates(): void {
    this.productService.products$.subscribe(products => {
      this.products = products;
      this.filteredProducts = products;
      this.applyProductFilters();
    });

    this.productService.stats$.subscribe(stats => {
      this.stats = stats;
    });
  }

  refreshData(): void {
    this.refreshing = true;
    this.productService.refreshProducts().then(() => {
      this.refreshing = false;
    });
  }

  openAddProductDialog(): void {
    this.editingProduct = null;
    this.showProductForm = true;
  }

  editProduct(product: ProductDisplay): void {
    this.editingProduct = product;
    this.showProductForm = true;
  }

  async deleteProduct(productId: string): Promise<void> {
    if (confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      const result = await this.productService.deleteProduct(productId);
      if (result.success) {
        console.log('Product deleted successfully');
      } else {
        alert('Failed to delete product: ' + result.error);
      }
    }
  }

  onProductSaved(product: any): void {
    this.showProductForm = false;
    this.editingProduct = null;
    console.log('Product saved:', product?.name);
  }

  onProductFormCancelled(): void {
    this.showProductForm = false;
    this.editingProduct = null;
  }

  async toggleProductFeatured(productId: string): Promise<void> {
    const result = await this.productService.toggleFeatured(productId);
    if (!result.success) {
      alert('Failed to toggle featured status: ' + result.error);
    }
  }

  async updateProductStock(productId: string, newQuantity: number): Promise<void> {
    const result = await this.productService.updateStockQuantity(productId, newQuantity);
    if (!result.success) {
      alert('Failed to update stock: ' + result.error);
    }
  }

  applyProductFilters(): void {
    const filters = {
      search: this.productSearch,
      inStock: this.productStockFilter === 'inStock' ? true : 
               this.productStockFilter === 'outOfStock' ? false : undefined
    };
    this.productService.applyFilters(filters);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'processing': return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'shipped': return 'bg-purple-500/10 text-purple-700 border-purple-200';
      case 'delivered': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'cancelled': return 'bg-red-500/10 text-red-700 border-red-200';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  }
}
