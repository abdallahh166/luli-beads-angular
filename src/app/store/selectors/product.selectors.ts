import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ProductState } from '../app.state';

export const selectProductState = createFeatureSelector<ProductState>('products');

// Basic selectors
export const selectAllProducts = createSelector(
  selectProductState,
  (state: ProductState) => state.products
);

export const selectFeaturedProducts = createSelector(
  selectProductState,
  (state: ProductState) => state.featuredProducts
);

export const selectProductLoading = createSelector(
  selectProductState,
  (state: ProductState) => state.loading
);

export const selectProductError = createSelector(
  selectProductState,
  (state: ProductState) => state.error
);

export const selectSelectedProduct = createSelector(
  selectProductState,
  (state: ProductState) => state.selectedProduct
);

export const selectProductFilters = createSelector(
  selectProductState,
  (state: ProductState) => state.filters
);

// Computed selectors
export const selectProductsByCategory = createSelector(
  selectAllProducts,
  selectProductFilters,
  (products, filters) => {
    if (!filters.category) return products;
    // For now, return all products since Product interface doesn't have categoryId
    // This can be updated when category support is added
    return products;
  }
);

export const selectProductsByPriceRange = createSelector(
  selectAllProducts,
  selectProductFilters,
  (products, filters) => {
    if (!filters.priceRange) return products;
    const [min, max] = filters.priceRange;
    return products.filter(product => 
      product.price >= min && product.price <= max
    );
  }
);

export const selectProductsByColors = createSelector(
  selectAllProducts,
  selectProductFilters,
  (products, filters) => {
    if (!filters.colors || filters.colors.length === 0) return products;
    return products.filter(product => 
      filters.colors!.some(color => product.colors.includes(color))
    );
  }
);

export const selectProductsByHandleTypes = createSelector(
  selectAllProducts,
  selectProductFilters,
  (products, filters) => {
    if (!filters.handleTypes || filters.handleTypes.length === 0) return products;
    return products.filter(product => 
      filters.handleTypes!.some(handle => product.handle_types.includes(handle))
    );
  }
);

export const selectProductsInStock = createSelector(
  selectAllProducts,
  selectProductFilters,
  (products, filters) => {
    if (filters.inStock === undefined) return products;
    return products.filter(product => product.in_stock === filters.inStock);
  }
);

export const selectFeaturedProductsOnly = createSelector(
  selectAllProducts,
  selectProductFilters,
  (products, filters) => {
    if (filters.featured === undefined) return products;
    return products.filter(product => product.featured === filters.featured);
  }
);

// Combined filtered products
export const selectFilteredProducts = createSelector(
  selectProductsByCategory,
  selectProductsByPriceRange,
  selectProductsByColors,
  selectProductsByHandleTypes,
  selectProductsInStock,
  selectFeaturedProductsOnly,
  (byCategory, byPrice, byColors, byHandles, inStock, featured) => {
    // Find intersection of all filtered results
    const allFilters = [byCategory, byPrice, byColors, byHandles, inStock, featured];
    const validFilters = allFilters.filter(filter => filter.length > 0);
    
    if (validFilters.length === 0) return [];
    
    return validFilters.reduce((intersection, filter) => 
      intersection.filter(product => filter.some(p => p.id === product.id))
    );
  }
);

// Product statistics
export const selectProductStats = createSelector(
  selectAllProducts,
  (products) => ({
    total: products.length,
    inStock: products.filter(p => p.in_stock).length,
    outOfStock: products.filter(p => !p.in_stock).length,
    featured: products.filter(p => p.featured).length,
    averagePrice: products.length > 0 
      ? products.reduce((sum, p) => sum + p.price, 0) / products.length 
      : 0
  })
);

// Search functionality
export const selectProductsBySearch = createSelector(
  selectAllProducts,
  (products) => (searchTerm: string) => {
    if (!searchTerm.trim()) return products;
    
    const term = searchTerm.toLowerCase();
    return products.filter(product => 
      product.name.toLowerCase().includes(term) ||
      product.description.toLowerCase().includes(term) ||
      product.colors.some(color => color.toLowerCase().includes(term)) ||
      product.handle_types.some(handle => handle.toLowerCase().includes(term))
    );
  }
);
