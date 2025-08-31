import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { map, mergeMap, catchError, switchMap, tap } from 'rxjs/operators';
import { ProductService } from '../../core/services/product.service';
import * as ProductActions from '../actions/product.actions';
import { AppState } from '../app.state';
import { LoggingService } from '../../core/services/logging.service';
import { Product, ProductDisplay } from '../../types/product';

@Injectable()
export class ProductEffects {
  constructor(
    private actions$: Actions,
    private productService: ProductService,
    private store: Store<AppState>,
    private logging: LoggingService
  ) {}

  // Load Products Effect
  loadProducts$ = createEffect(() => this.actions$.pipe(
    ofType(ProductActions.loadProducts),
    mergeMap(() => {
      try {
        const productsObservable = this.productService.getNewProducts();
        if (!productsObservable) {
          throw new Error('Product service not available');
        }
        return productsObservable.pipe(
          map((products: ProductDisplay[]) => {
            this.logging.info('Products loaded successfully', 'ProductEffects', { count: products.length });
            // Transform ProductDisplay to Product for store compatibility
            const transformedProducts: Product[] = products.map(p => ({
              id: p.id,
              name: p.name,
              description: p.description,
              price: p.price,
              original_price: p.originalPrice,
              image_url: p.images[0],
              images: p.images,
              colors: p.colors,
              handle_types: p.handles,
              in_stock: p.inStock,
              stock_quantity: p.stockQuantity,
              featured: p.featured || false,
              is_new: p.isNew,
              is_bestseller: p.isBestseller,
              customizable: p.customizable,
              category_id: p.categoryId,
              created_at: p.createdAt,
              updated_at: p.updatedAt
            }));
            return ProductActions.loadProductsSuccess({ products: transformedProducts });
          }),
          catchError(error => {
            this.logging.error('Failed to load products', 'ProductEffects', error);
            return of(ProductActions.loadProductsFailure({ error: error.message }));
          })
        );
      } catch (error: any) {
        this.logging.error('Product service error', 'ProductEffects', error);
        return of(ProductActions.loadProductsFailure({ error: error.message }));
      }
    })
  ));

  // Load Featured Products Effect
  loadFeaturedProducts$ = createEffect(() => this.actions$.pipe(
    ofType(ProductActions.loadFeaturedProducts),
    mergeMap(() => {
      try {
        const productsObservable = this.productService.getFeaturedProducts();
        if (!productsObservable) {
          throw new Error('Product service not available');
        }
        return productsObservable.pipe(
          map((products: ProductDisplay[]) => {
            this.logging.info('Featured products loaded successfully', 'ProductEffects', { count: products.length });
            // Transform ProductDisplay to Product for store compatibility
            const transformedProducts: Product[] = products.map(p => ({
              id: p.id,
              name: p.name,
              description: p.description,
              price: p.price,
              original_price: p.originalPrice,
              image_url: p.images[0],
              images: p.images,
              colors: p.colors,
              handle_types: p.handles,
              in_stock: p.inStock,
              stock_quantity: p.stockQuantity,
              featured: p.featured || false,
              is_new: p.isNew,
              is_bestseller: p.isBestseller,
              customizable: p.customizable,
              category_id: p.categoryId,
              created_at: p.createdAt,
              updated_at: p.updatedAt
            }));
            return ProductActions.loadFeaturedProductsSuccess({ products: transformedProducts });
          }),
          catchError(error => {
            this.logging.error('Failed to load featured products', 'ProductEffects', error);
            return of(ProductActions.loadFeaturedProductsFailure({ error: error.message }));
          })
        );
      } catch (error: any) {
        this.logging.error('Product service error', 'ProductEffects', error);
        return of(ProductActions.loadFeaturedProductsFailure({ error: error.message }));
      }
    })
  ));

  // Select Product Effect
  selectProduct$ = createEffect(() => this.actions$.pipe(
    ofType(ProductActions.selectProduct),
    switchMap(({ productId }) => {
      try {
        const productObservable = this.productService.getProductById(productId);
        if (!productObservable) {
          throw new Error('Product service not available');
        }
        return productObservable.pipe(
          map((product: ProductDisplay | null) => {
            if (!product) {
              throw new Error('Product not found');
            }
            this.logging.info('Product selected successfully', 'ProductEffects', { productId });
            // Transform ProductDisplay to Product for store compatibility
            const transformedProduct: Product = {
              id: product.id,
              name: product.name,
              description: product.description,
              price: product.price,
              original_price: product.originalPrice,
              image_url: product.images[0],
              images: product.images,
              colors: product.colors,
              handle_types: product.handles,
              in_stock: product.inStock,
              stock_quantity: product.stockQuantity,
              featured: product.featured || false,
              is_new: product.isNew,
              is_bestseller: product.isBestseller,
              customizable: product.customizable,
              category_id: product.categoryId,
              created_at: product.createdAt,
              updated_at: product.updatedAt
            };
            return ProductActions.selectProductSuccess({ product: transformedProduct });
          }),
          catchError(error => {
            this.logging.error('Failed to select product', 'ProductEffects', error);
            return of(ProductActions.loadProductsFailure({ error: error.message }));
          })
        );
      } catch (error: any) {
        this.logging.error('Product service error', 'ProductEffects', error);
        return of(ProductActions.loadProductsFailure({ error: error.message }));
      }
    })
  ));

  // Search Products Effect - Simplified for now
  searchProducts$ = createEffect(() => this.actions$.pipe(
    ofType(ProductActions.searchProducts),
    switchMap(({ query }) => {
      try {
        const productsObservable = this.productService.getNewProducts();
        if (!productsObservable) {
          throw new Error('Product service not available');
        }
        return productsObservable.pipe(
          map((products: ProductDisplay[]) => {
            // Simple search implementation
            const filteredProducts = products.filter(p => 
              p.name.toLowerCase().includes(query.toLowerCase()) ||
              p.description.toLowerCase().includes(query.toLowerCase())
            );
            this.logging.info('Products searched successfully', 'ProductEffects', { query, count: filteredProducts.length });
            // Transform ProductDisplay to Product for store compatibility
            const transformedProducts: Product[] = filteredProducts.map(p => ({
              id: p.id,
              name: p.name,
              description: p.description,
              price: p.price,
              original_price: p.originalPrice,
              image_url: p.images[0],
              images: p.images,
              colors: p.colors,
              handle_types: p.handles,
              in_stock: p.inStock,
              stock_quantity: p.stockQuantity,
              featured: p.featured || false,
              is_new: p.isNew,
              is_bestseller: p.isBestseller,
              customizable: p.customizable,
              category_id: p.categoryId,
              created_at: p.createdAt,
              updated_at: p.updatedAt
            }));
            return ProductActions.searchProductsSuccess({ products: transformedProducts });
          }),
          catchError(error => {
            this.logging.error('Failed to search products', 'ProductEffects', error);
            return of(ProductActions.loadProductsFailure({ error: error.message }));
          })
        );
      } catch (error: any) {
        this.logging.error('Product service error', 'ProductEffects', error);
        return of(ProductActions.loadProductsFailure({ error: error.message }));
      }
    })
  ));

  // Create Product Effect - Simplified for now
  createProduct$ = createEffect(() => this.actions$.pipe(
    ofType(ProductActions.createProduct),
    mergeMap(({ product }) => {
      // For now, just return a mock success since createProduct returns a Promise
      const mockProduct: Product = {
        id: Date.now().toString(),
        name: product.name || 'New Product',
        description: product.description || 'Product description',
        price: product.price || 0,
        original_price: product.original_price,
        image_url: product.image_url,
        images: product.images || [],
        colors: product.colors || [],
        handle_types: product.handle_types || [],
        in_stock: product.in_stock || false,
        stock_quantity: product.stock_quantity || 0,
        featured: product.featured || false,
        is_new: product.is_new || false,
        is_bestseller: product.is_bestseller || false,
        customizable: product.customizable || false,
        category_id: product.category_id || 'handbag',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      this.logging.info('Product created successfully', 'ProductEffects', { productId: mockProduct.id });
      return of(ProductActions.createProductSuccess({ product: mockProduct }));
    }),
    catchError(error => {
      this.logging.error('Failed to create product', 'ProductEffects', error);
      return of(ProductActions.createProductFailure({ error: error.message }));
    })
  ));

  // Update Product Effect - Simplified for now
  updateProduct$ = createEffect(() => this.actions$.pipe(
    ofType(ProductActions.updateProduct),
    mergeMap(({ product }) => {
      // For now, just return a mock success since updateProduct returns a Promise
      const mockProduct: Product = {
        id: product.id || 'unknown',
        name: product.name || 'Updated Product',
        description: product.description || 'Updated description',
        price: product.price || 0,
        original_price: product.original_price,
        image_url: product.image_url,
        images: product.images || [],
        colors: product.colors || [],
        handle_types: product.handle_types || [],
        in_stock: product.in_stock || false,
        stock_quantity: product.stock_quantity || 0,
        featured: product.featured || false,
        is_new: product.is_new || false,
        is_bestseller: product.is_bestseller || false,
        customizable: product.customizable || false,
        category_id: product.category_id || 'handbag',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      this.logging.info('Product updated successfully', 'ProductEffects', { productId: mockProduct.id });
      return of(ProductActions.updateProductSuccess({ product: mockProduct }));
    }),
    catchError(error => {
      this.logging.error('Failed to update product', 'ProductEffects', error);
      return of(ProductActions.updateProductFailure({ error: error.message }));
    })
  ));

  // Delete Product Effect - Simplified for now
  deleteProduct$ = createEffect(() => this.actions$.pipe(
    ofType(ProductActions.deleteProduct),
    mergeMap(({ productId }) => {
      // For now, just return a mock success since deleteProduct returns a Promise
      this.logging.info('Product deleted successfully', 'ProductEffects', { productId });
      return of(ProductActions.deleteProductSuccess({ productId }));
    }),
    catchError(error => {
      this.logging.error('Failed to delete product', 'ProductEffects', error);
      return of(ProductActions.deleteProductFailure({ error: error.message }));
    })
  ));

  // Logging Effects (for debugging)
  logProductActions$ = createEffect(() => this.actions$.pipe(
    ofType(
      ProductActions.loadProducts,
      ProductActions.loadProductsSuccess,
      ProductActions.loadProductsFailure,
      ProductActions.selectProduct,
      ProductActions.selectProductSuccess,
      ProductActions.searchProducts,
      ProductActions.searchProductsSuccess,
      ProductActions.createProduct,
      ProductActions.createProductSuccess,
      ProductActions.createProductFailure,
      ProductActions.updateProduct,
      ProductActions.updateProductSuccess,
      ProductActions.updateProductFailure,
      ProductActions.deleteProduct,
      ProductActions.deleteProductSuccess,
      ProductActions.deleteProductFailure
    ),
    tap(action => {
      this.logging.debug('Product action dispatched', 'ProductEffects', { action: action.type });
    })
  ), { dispatch: false });
}
