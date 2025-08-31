import { createReducer, on } from '@ngrx/store';
import { ProductState, ProductFilters } from '../app.state';
import * as ProductActions from '../actions/product.actions';

export const initialState: ProductState = {
  products: [],
  featuredProducts: [],
  loading: false,
  error: null,
  selectedProduct: null,
  filters: {}
};

export const productReducer = createReducer(
  initialState,
  
  // Load Products
  on(ProductActions.loadProducts, state => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(ProductActions.loadProductsSuccess, (state, { products }) => ({
    ...state,
    products,
    loading: false,
    error: null
  })),
  
  on(ProductActions.loadProductsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Load Featured Products
  on(ProductActions.loadFeaturedProducts, state => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(ProductActions.loadFeaturedProductsSuccess, (state, { products }) => ({
    ...state,
    featuredProducts: products,
    loading: false,
    error: null
  })),
  
  on(ProductActions.loadFeaturedProductsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Select Product
  on(ProductActions.selectProduct, state => ({
    ...state,
    selectedProduct: null,
    loading: true
  })),
  
  on(ProductActions.selectProductSuccess, (state, { product }) => ({
    ...state,
    selectedProduct: product,
    loading: false
  })),
  
  on(ProductActions.clearSelectedProduct, state => ({
    ...state,
    selectedProduct: null
  })),
  
  // Filter Products
  on(ProductActions.updateProductFilters, (state, { filters }) => ({
    ...state,
    filters: { ...state.filters, ...filters }
  })),
  
  on(ProductActions.clearProductFilters, state => ({
    ...state,
    filters: {}
  })),
  
  // Search Products
  on(ProductActions.searchProducts, state => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(ProductActions.searchProductsSuccess, (state, { products }) => ({
    ...state,
    products,
    loading: false,
    error: null
  })),
  
  // Create Product
  on(ProductActions.createProduct, state => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(ProductActions.createProductSuccess, (state, { product }) => ({
    ...state,
    products: [...state.products, product],
    loading: false,
    error: null
  })),
  
  on(ProductActions.createProductFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Update Product
  on(ProductActions.updateProduct, state => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(ProductActions.updateProductSuccess, (state, { product }) => ({
    ...state,
    products: state.products.map(p => p.id === product.id ? product : p),
    selectedProduct: state.selectedProduct?.id === product.id ? product : state.selectedProduct,
    loading: false,
    error: null
  })),
  
  on(ProductActions.updateProductFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Delete Product
  on(ProductActions.deleteProduct, state => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(ProductActions.deleteProductSuccess, (state, { productId }) => ({
    ...state,
    products: state.products.filter(p => p.id !== productId),
    selectedProduct: state.selectedProduct?.id === productId ? null : state.selectedProduct,
    loading: false,
    error: null
  })),
  
  on(ProductActions.deleteProductFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  }))
);
