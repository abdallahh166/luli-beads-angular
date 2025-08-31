import { Injectable } from '@angular/core';
import { Observable, from, throwError, BehaviorSubject } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { supabase } from '../../integrations/supabase/client';
import { 
  CartItemDatabase, 
  CartItemCreate, 
  CartItemUpdate, 
  CartItem 
} from '../../types/cart';
import { ProductDisplay } from '../../types/product';

@Injectable({
  providedIn: 'root'
})
export class CartDatabaseService {
  private syncStatus = new BehaviorSubject<{
    isOnline: boolean;
    lastSync: Date | null;
    pendingChanges: number;
    errors: string[];
  }>({
    isOnline: true,
    lastSync: null,
    pendingChanges: 0,
    errors: []
  });

  public syncStatus$ = this.syncStatus.asObservable();

  constructor() {
    this.initializeNetworkMonitoring();
  }

  private initializeNetworkMonitoring(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.updateOnlineStatus(true));
      window.addEventListener('offline', () => this.updateOnlineStatus(false));
      
      // Check initial status
      this.updateOnlineStatus(navigator.onLine);
    }
  }

  private updateOnlineStatus(isOnline: boolean): void {
    const current = this.syncStatus.value;
    this.syncStatus.next({
      ...current,
      isOnline
    });
  }

  async fetchCartItems(userId: string): Promise<CartItemDatabase[]> {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          products (
            id,
            name,
            description,
            price,
            original_price,
            image_url,
            images,
            colors,
            handle_types,
            in_stock,
            stock_quantity,
            featured,
            is_new,
            is_bestseller,
            customizable,
            category_id
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching cart items:', error);
      throw error;
    }
  }

  async addCartItem(userId: string, item: CartItemCreate): Promise<CartItemDatabase> {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .insert({
          user_id: userId,
          ...item
        })
        .select()
        .single();

      if (error) throw error;

      this.updateSyncStatus({ lastSync: new Date() });
      return data;
    } catch (error) {
      console.error('Error adding cart item:', error);
      throw error;
    }
  }

  async updateCartItem(itemId: string, updates: CartItemUpdate): Promise<CartItemDatabase> {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .update(updates)
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;

      this.updateSyncStatus({ lastSync: new Date() });
      return data;
    } catch (error) {
      console.error('Error updating cart item:', error);
      throw error;
    }
  }

  async removeCartItem(itemId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      this.updateSyncStatus({ lastSync: new Date() });
    } catch (error) {
      console.error('Error removing cart item:', error);
      throw error;
    }
  }

  async clearUserCart(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      this.updateSyncStatus({ lastSync: new Date() });
    } catch (error) {
      console.error('Error clearing user cart:', error);
      throw error;
    }
  }

  async syncCartWithDatabase(userId: string, localItems: CartItem[]): Promise<CartItem[]> {
    try {
      // Fetch current database state
      const dbItems = await this.fetchCartItems(userId);
      
      // Find items that exist locally but not in database (need to be added)
      const itemsToAdd = localItems.filter(localItem => 
        !dbItems.some(dbItem => 
          dbItem.product_id === localItem.product.id &&
          dbItem.selected_color === localItem.selectedColor &&
          dbItem.selected_handle === localItem.selectedHandle &&
          dbItem.custom_name === localItem.customName
        )
      );

      // Find items that exist in database but not locally (need to be removed)
      const itemsToRemove = dbItems.filter(dbItem =>
        !localItems.some(localItem =>
          dbItem.product_id === localItem.product.id &&
          dbItem.selected_color === localItem.selectedColor &&
          dbItem.selected_handle === localItem.selectedHandle &&
          dbItem.custom_name === localItem.customName
        )
      );

      // Find items that need quantity updates
      const itemsToUpdate = localItems.filter(localItem => {
        const dbItem = dbItems.find(dbItem =>
          dbItem.product_id === localItem.product.id &&
          dbItem.selected_color === localItem.selectedColor &&
          dbItem.selected_handle === localItem.selectedHandle &&
          dbItem.custom_name === localItem.customName
        );
        return dbItem && dbItem.quantity !== localItem.quantity;
      });

      // Execute all changes
      const promises: Promise<any>[] = [];

      // Add new items
      itemsToAdd.forEach(item => {
        promises.push(this.addCartItem(userId, {
          product_id: item.product.id,
          quantity: item.quantity,
          selected_color: item.selectedColor,
          selected_handle: item.selectedHandle,
          custom_name: item.customName
        }));
      });

      // Remove items
      itemsToRemove.forEach(item => {
        promises.push(this.removeCartItem(item.id));
      });

      // Update quantities
      itemsToUpdate.forEach(item => {
        const dbItem = dbItems.find(dbItem =>
          dbItem.product_id === item.product.id &&
          dbItem.selected_color === item.selectedColor &&
          dbItem.selected_handle === item.selectedHandle &&
          dbItem.custom_name === item.customName
        );
        if (dbItem) {
          promises.push(this.updateCartItem(dbItem.id, { quantity: item.quantity }));
        }
      });

      await Promise.all(promises);

      // Return the final synchronized state
      const finalDbItems = await this.fetchCartItems(userId);
      this.updateSyncStatus({ 
        lastSync: new Date(),
        pendingChanges: 0,
        errors: []
      });

      return finalDbItems.map(this.transformDatabaseItemToCartItem);
    } catch (error) {
      console.error('Error syncing cart with database:', error);
      this.updateSyncStatus({ 
        errors: [...this.syncStatus.value.errors, error instanceof Error ? error.message : 'Unknown error']
      });
      throw error;
    }
  }

  public transformDatabaseItemToCartItem(dbItem: any): CartItem {
    const product: ProductDisplay = {
      id: dbItem.products.id,
      name: dbItem.products.name,
      description: dbItem.products.description,
      price: parseFloat(dbItem.products.price),
      originalPrice: dbItem.products.original_price ? parseFloat(dbItem.products.original_price) : undefined,
      images: dbItem.products.images || [dbItem.products.image_url],
      colors: dbItem.products.colors || [],
      handles: dbItem.products.handle_types || [],
      inStock: dbItem.products.in_stock,
      stockQuantity: dbItem.products.stock_quantity,
      featured: dbItem.products.featured,
      isNew: dbItem.products.is_new,
      isBestseller: dbItem.products.is_bestseller,
      customizable: dbItem.products.customizable,
      categoryId: dbItem.products.category_id,
      features: ['Handmade with premium beads', 'Customizable with your name', 'Choice of handle types', 'Elegant gift packaging'],
      createdAt: dbItem.products.created_at,
      updatedAt: dbItem.products.updated_at
    };

    return {
      id: dbItem.id,
      product,
      quantity: dbItem.quantity,
      selectedColor: dbItem.selected_color,
      selectedHandle: dbItem.selected_handle,
      customName: dbItem.custom_name,
      price: product.price
    };
  }

  private updateSyncStatus(updates: Partial<typeof this.syncStatus.value>): void {
    const current = this.syncStatus.value;
    this.syncStatus.next({ ...current, ...updates });
  }

  // Real-time subscription for cart changes
  subscribeToCartChanges(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`cart-changes-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cart_items',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  }
}
