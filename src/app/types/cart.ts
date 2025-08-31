import { ProductDisplay } from './product';

export interface CartItem {
  id: string;
  product: ProductDisplay;
  quantity: number;
  selectedColor?: string;
  selectedHandle?: string;
  customName?: string;
  price: number;
}

export interface CartItemDatabase {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  selected_color?: string;
  selected_handle?: string;
  custom_name?: string;
  created_at: string;
  updated_at: string;
}

export interface CartItemCreate {
  product_id: string;
  quantity: number;
  selected_color?: string;
  selected_handle?: string;
  custom_name?: string;
}

export interface CartItemUpdate {
  quantity?: number;
  selected_color?: string;
  selected_handle?: string;
  custom_name?: string;
}

export interface CartSummary {
  totalItems: number;
  totalPrice: number;
  totalDiscount: number;
  subtotal: number;
  shipping: number;
  tax: number;
}

export interface CartState {
  items: CartItem[];
  summary: CartSummary;
  isLoading: boolean;
  error: string | null;
  lastSync: Date | null;
}

export interface CartSyncState {
  isOnline: boolean;
  lastSyncAttempt: Date | null;
  pendingChanges: CartItemChange[];
  syncErrors: string[];
}

export interface CartItemChange {
  type: 'add' | 'update' | 'remove';
  item: CartItem | CartItemCreate;
  timestamp: Date;
  retryCount: number;
}
