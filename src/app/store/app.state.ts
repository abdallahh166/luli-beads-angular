import { AuthState } from '../core/services/auth.service';
import { Product } from '../types/product';
import { CartItem } from '../types/cart';

export interface AppState {
  auth: AuthState;
  products: ProductState;
  cart: CartState;
  ui: UIState;
}

export interface ProductState {
  products: Product[];
  featuredProducts: Product[];
  loading: boolean;
  error: string | null;
  selectedProduct: Product | null;
  filters: ProductFilters;
}

export interface ProductFilters {
  category?: string;
  priceRange?: [number, number];
  colors?: string[];
  handleTypes?: string[];
  inStock?: boolean;
  featured?: boolean;
}

export interface CartState {
  items: CartItem[];
  loading: boolean;
  error: string | null;
  total: number;
  itemCount: number;
}

export interface UIState {
  loading: boolean;
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  timestamp: Date;
}
