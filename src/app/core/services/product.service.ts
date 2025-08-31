import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { supabase } from '../../integrations/supabase/client';
import { 
  Product, 
  ProductDisplay, 
  CreateProductInput, 
  UpdateProductInput, 
  ProductFilters, 
  ProductStats,
  ProductLifecycleEvent,
  transformProduct, 
  transformToDatabase,
  validateProduct,
  calculateDiscountPercentage,
  isLowStock,
  isNewProduct
} from '../../types/product';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  // Core observables for real-time updates
  private products = new BehaviorSubject<ProductDisplay[]>([]);
  private filteredProducts = new BehaviorSubject<ProductDisplay[]>([]);
  private isLoading = new BehaviorSubject<boolean>(false);
  private error = new BehaviorSubject<string | null>(null);
  private stats = new BehaviorSubject<ProductStats>({
    totalProducts: 0,
    inStockProducts: 0,
    outOfStockProducts: 0,
    lowStockProducts: 0,
    featuredProducts: 0,
    newProducts: 0,
    bestsellerProducts: 0,
    totalValue: 0
  });

  // Public observables
  public products$ = this.products.asObservable();
  public filteredProducts$ = this.filteredProducts.asObservable();
  public isLoading$ = this.isLoading.asObservable();
  public error$ = this.error.asObservable();
  public stats$ = this.stats.asObservable();

  // Current filters
  private currentFilters: ProductFilters = {};

  constructor() {
    this.initializeProductSystem();
  }

  /**
   * Initialize the product system with real-time subscriptions
   */
  private async initializeProductSystem(): Promise<void> {
    // Load initial data
    await this.loadProducts();
    
    // Set up real-time subscriptions
    this.setupRealtimeSubscriptions();
    
    // Calculate initial stats
    this.updateStats();
  }

  /**
   * Set up real-time subscriptions for product changes
   */
  private setupRealtimeSubscriptions(): void {
    // Subscribe to product table changes
    supabase
      .channel('products_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        (payload) => {
          console.log('Product change detected:', payload);
          this.handleProductChange(payload);
        }
      )
      .subscribe();
  }

  /**
   * Handle real-time product changes
   */
  private handleProductChange(payload: any): void {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch (eventType) {
      case 'INSERT':
        this.addProductToCache(transformProduct(newRecord));
        break;
      case 'UPDATE':
        this.updateProductInCache(transformProduct(newRecord));
        break;
      case 'DELETE':
        this.removeProductFromCache(oldRecord.id);
        break;
    }

    // Update stats and filters
    this.updateStats();
    this.applyFilters(this.currentFilters);
    
    // Log lifecycle event
    this.logLifecycleEvent(eventType, newRecord?.id || oldRecord?.id, { newRecord, oldRecord });
  }

  /**
   * Load all products from database
   */
  private async loadProducts(): Promise<void> {
    this.setLoading(true);
    this.setError(null);

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedProducts = data.map(transformProduct);
      this.products.next(transformedProducts);
      this.filteredProducts.next(transformedProducts);
    } catch (err: any) {
      this.setError(err.message || 'Failed to load products');
      // Fallback to mock data for development
      this.loadMockProducts();
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Load mock products for development/testing
   */
  private loadMockProducts(): void {
    const mockProducts: ProductDisplay[] = [
      {
        id: '1',
        name: 'Elegant Beaded Handbag',
        price: 299.99,
        originalPrice: 399.99,
        description: 'Handcrafted luxury beaded handbag with premium materials',
        images: ['/assets/product-black-bag.jpg'],
        categoryId: 'handbag',
        inStock: true,
        stockQuantity: 15,
        colors: ['Black', 'Rose Gold', 'Cream'],
        handles: ['Chain', 'Leather', 'Beaded'],
        features: ['Handmade with premium beads', 'Customizable with your name', 'Choice of handle types', 'Elegant gift packaging'],
        isNew: true,
        isBestseller: true,
        customizable: true,
        featured: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Rose Gold Beaded Clutch',
        price: 199.99,
        description: 'Elegant evening clutch with rose gold beading',
        images: ['/assets/product-rose-bag.jpg'],
        categoryId: 'clutch',
        inStock: true,
        stockQuantity: 10,
        colors: ['Rose Gold', 'Cream'],
        handles: ['Chain', 'Beaded'],
        features: ['Handmade with premium beads', 'Customizable with your name', 'Choice of handle types', 'Elegant gift packaging'],
        isNew: false,
        isBestseller: false,
        customizable: true,
        featured: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    this.products.next(mockProducts);
    this.filteredProducts.next(mockProducts);
  }

  /**
   * Create a new product
   */
  async createProduct(productData: CreateProductInput): Promise<{ success: boolean; product?: ProductDisplay; error?: string }> {
    try {
      // Validate product data
      const validationErrors = validateProduct(productData);
      if (validationErrors.length > 0) {
        return { success: false, error: validationErrors.join(', ') };
      }

      // Prepare data for database
      const dbProduct = {
        ...productData,
        in_stock: productData.in_stock ?? true,
        stock_quantity: productData.stock_quantity ?? 10,
        featured: productData.featured ?? false,
        is_new: productData.is_new ?? true,
        is_bestseller: productData.is_bestseller ?? false,
        customizable: productData.customizable ?? true,
        category_id: productData.category_id ?? 'handbag',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('products')
        .insert([dbProduct])
        .select()
        .single();

      if (error) throw error;

      const transformedProduct = transformProduct(data);
      this.addProductToCache(transformedProduct);
      this.updateStats();
      this.applyFilters(this.currentFilters);

      return { success: true, product: transformedProduct };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create product';
      this.setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Update an existing product
   */
  async updateProduct(productData: UpdateProductInput): Promise<{ success: boolean; product?: ProductDisplay; error?: string }> {
    try {
      const { id, ...updateData } = productData;
      
      // Add updated timestamp
      const dbUpdateData = {
        ...updateData,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('products')
        .update(dbUpdateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const transformedProduct = transformProduct(data);
      this.updateProductInCache(transformedProduct);
      this.updateStats();
      this.applyFilters(this.currentFilters);

      return { success: true, product: transformedProduct };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update product';
      this.setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Delete a product
   */
  async deleteProduct(productId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      this.removeProductFromCache(productId);
      this.updateStats();
      this.applyFilters(this.currentFilters);

      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete product';
      this.setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get a single product by ID
   */
  getProductById(id: string): Observable<ProductDisplay | null> {
    const currentProducts = this.products.value;
    const product = currentProducts.find(p => p.id === id);
    
    if (product) {
      return of(product);
    }

    // If not in cache, fetch from database
    return from(supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) return null;
        return transformProduct(data);
      }),
      catchError(() => of(null))
    );
  }

  /**
   * Get new products
   */
  getNewProducts(): Observable<ProductDisplay[]> {
    return this.products$.pipe(
      map(products => products.filter(p => p.isNew))
    );
  }

  /**
   * Get featured products
   */
  getFeaturedProducts(): Observable<ProductDisplay[]> {
    return this.products$.pipe(
      map(products => products.filter(p => p.featured))
    );
  }

  /**
   * Get bestseller products
   */
  getBestsellerProducts(): Observable<ProductDisplay[]> {
    return this.products$.pipe(
      map(products => products.filter(p => p.isBestseller))
    );
  }

  /**
   * Apply filters to products
   */
  applyFilters(filters: ProductFilters): void {
    this.currentFilters = filters;
    
    this.products$.pipe(
      map(products => this.filterProducts(products, filters))
    ).subscribe(filtered => {
      this.filteredProducts.next(filtered);
    });
  }

  /**
   * Filter products based on criteria
   */
  private filterProducts(products: ProductDisplay[], filters: ProductFilters): ProductDisplay[] {
    return products.filter(product => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesSearch = 
          product.name.toLowerCase().includes(searchTerm) ||
          product.description.toLowerCase().includes(searchTerm);
        if (!matchesSearch) return false;
      }

      // Category filter
      if (filters.category && filters.category !== 'all') {
        if (product.categoryId !== filters.category) return false;
      }

      // Price range filter
      if (filters.priceRange) {
        const [min, max] = filters.priceRange;
        if (product.price < min || product.price > max) return false;
      }

      // Color filter
      if (filters.colors?.length) {
        const hasMatchingColor = filters.colors.some(color => 
          product.colors.includes(color)
        );
        if (!hasMatchingColor) return false;
      }

      // Handle types filter
      if (filters.handleTypes?.length) {
        const hasMatchingHandle = filters.handleTypes.some(handle => 
          product.handles.includes(handle)
        );
        if (!hasMatchingHandle) return false;
      }

      // Stock filter
      if (filters.inStock !== undefined) {
        if (product.inStock !== filters.inStock) return false;
      }

      // Featured filter
      if (filters.featured !== undefined) {
        if (product.featured !== filters.featured) return false;
      }

      // New products filter
      if (filters.isNew !== undefined) {
        if (product.isNew !== filters.isNew) return false;
      }

      // Bestseller filter
      if (filters.isBestseller !== undefined) {
        if (product.isBestseller !== filters.isBestseller) return false;
      }

      return true;
    });
  }

  /**
   * Update product stock quantity
   */
  async updateStockQuantity(productId: string, newQuantity: number): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('products')
        .update({ 
          stock_quantity: newQuantity,
          in_stock: newQuantity > 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (error) throw error;

      // Update cache
      const currentProducts = this.products.value;
      const updatedProducts = currentProducts.map(p => 
        p.id === productId 
          ? { ...p, stockQuantity: newQuantity, inStock: newQuantity > 0 }
          : p
      );
      this.products.next(updatedProducts);
      this.updateStats();
      this.applyFilters(this.currentFilters);

      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update stock quantity';
      this.setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Toggle product featured status
   */
  async toggleFeatured(productId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const currentProduct = this.products.value.find(p => p.id === productId);
      if (!currentProduct) {
        return { success: false, error: 'Product not found' };
      }

      const newFeaturedStatus = !currentProduct.featured;

      const { error } = await supabase
        .from('products')
        .update({ 
          featured: newFeaturedStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (error) throw error;

      // Update cache
      const updatedProducts = this.products.value.map(p => 
        p.id === productId 
          ? { ...p, featured: newFeaturedStatus }
          : p
      );
      this.products.next(updatedProducts);
      this.updateStats();
      this.applyFilters(this.currentFilters);

      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to toggle featured status';
      this.setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Update product statistics
   */
  private updateStats(): void {
    const products = this.products.value;
    
    const stats: ProductStats = {
      totalProducts: products.length,
      inStockProducts: products.filter(p => p.inStock).length,
      outOfStockProducts: products.filter(p => !p.inStock).length,
      lowStockProducts: products.filter(p => isLowStock(p.stockQuantity)).length,
      featuredProducts: products.filter(p => p.featured).length,
      newProducts: products.filter(p => p.isNew).length,
      bestsellerProducts: products.filter(p => p.isBestseller).length,
      totalValue: products.reduce((sum, p) => sum + (p.price * p.stockQuantity), 0)
    };

    this.stats.next(stats);
  }

  /**
   * Cache management methods
   */
  private addProductToCache(product: ProductDisplay): void {
    const currentProducts = this.products.value;
    this.products.next([product, ...currentProducts]);
  }

  private updateProductInCache(product: ProductDisplay): void {
    const currentProducts = this.products.value;
    const updatedProducts = currentProducts.map(p => 
      p.id === product.id ? product : p
    );
    this.products.next(updatedProducts);
  }

  private removeProductFromCache(productId: string): void {
    const currentProducts = this.products.value;
    const filteredProducts = currentProducts.filter(p => p.id !== productId);
    this.products.next(filteredProducts);
  }

  /**
   * Log lifecycle events
   */
  private async logLifecycleEvent(eventType: string, productId: string, eventData: any): Promise<void> {
    try {
      const lifecycleEvent: ProductLifecycleEvent = {
        id: crypto.randomUUID(),
        product_id: productId,
        event_type: eventType as any,
        event_data: eventData,
        created_at: new Date().toISOString()
      };

      await supabase
        .from('product_lifecycle_events')
        .insert([lifecycleEvent]);
    } catch (error) {
      console.error('Failed to log lifecycle event:', error);
    }
  }

  /**
   * Utility methods
   */
  private setLoading(loading: boolean): void {
    this.isLoading.next(loading);
  }

  private setError(error: string | null): void {
    this.error.next(error);
  }

  /**
   * Get current filters
   */
  getCurrentFilters(): ProductFilters {
    return { ...this.currentFilters };
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.currentFilters = {};
    this.filteredProducts.next(this.products.value);
  }

  /**
   * Refresh products from database
   */
  async refreshProducts(): Promise<void> {
    await this.loadProducts();
  }
}
