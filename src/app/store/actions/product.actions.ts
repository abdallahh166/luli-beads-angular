import { createAction, props } from '@ngrx/store';
import { Product, ProductFilters } from '../../types/product';

// Load Products
export const loadProducts = createAction('[Product] Load Products');
export const loadProductsSuccess = createAction(
  '[Product] Load Products Success',
  props<{ products: Product[] }>()
);
export const loadProductsFailure = createAction(
  '[Product] Load Products Failure',
  props<{ error: string }>()
);

// Load Featured Products
export const loadFeaturedProducts = createAction('[Product] Load Featured Products');
export const loadFeaturedProductsSuccess = createAction(
  '[Product] Load Featured Products Success',
  props<{ products: Product[] }>()
);
export const loadFeaturedProductsFailure = createAction(
  '[Product] Load Featured Products Failure',
  props<{ error: string }>()
);

// Select Product
export const selectProduct = createAction(
  '[Product] Select Product',
  props<{ productId: string }>()
);
export const selectProductSuccess = createAction(
  '[Product] Select Product Success',
  props<{ product: Product }>()
);
export const clearSelectedProduct = createAction('[Product] Clear Selected Product');

// Filter Products
export const updateProductFilters = createAction(
  '[Product] Update Filters',
  props<{ filters: Partial<ProductFilters> }>()
);
export const clearProductFilters = createAction('[Product] Clear Filters');

// Search Products
export const searchProducts = createAction(
  '[Product] Search Products',
  props<{ query: string }>()
);
export const searchProductsSuccess = createAction(
  '[Product] Search Products Success',
  props<{ products: Product[] }>()
);

// Product CRUD Operations
export const createProduct = createAction(
  '[Product] Create Product',
  props<{ product: Partial<Product> }>()
);
export const createProductSuccess = createAction(
  '[Product] Create Product Success',
  props<{ product: Product }>()
);
export const createProductFailure = createAction(
  '[Product] Create Product Failure',
  props<{ error: string }>()
);

export const updateProduct = createAction(
  '[Product] Update Product',
  props<{ product: Partial<Product> }>()
);
export const updateProductSuccess = createAction(
  '[Product] Update Product Success',
  props<{ product: Product }>()
);
export const updateProductFailure = createAction(
  '[Product] Update Product Failure',
  props<{ error: string }>()
);

export const deleteProduct = createAction(
  '[Product] Delete Product',
  props<{ productId: string }>()
);
export const deleteProductSuccess = createAction(
  '[Product] Delete Product Success',
  props<{ productId: string }>()
);
export const deleteProductFailure = createAction(
  '[Product] Delete Product Failure',
  props<{ error: string }>()
);
