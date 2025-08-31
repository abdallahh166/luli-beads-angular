// Standardized Product interface for the entire application
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price?: number;
  image_url?: string;
  images: string[];
  colors: string[];
  handle_types: string[];
  in_stock: boolean;
  stock_quantity: number;
  featured: boolean;
  is_new: boolean;
  is_bestseller: boolean;
  customizable: boolean;
  category_id: string;
  created_at: string;
  updated_at: string;
}

// Interface for creating new products (omits auto-generated fields)
export interface CreateProductInput {
  name: string;
  description: string;
  price: number;
  original_price?: number;
  image_url?: string;
  images: string[];
  colors: string[];
  handle_types: string[];
  in_stock?: boolean;
  stock_quantity?: number;
  featured?: boolean;
  is_new?: boolean;
  is_bestseller?: boolean;
  customizable?: boolean;
  category_id?: string;
}

// Interface for updating products (all fields optional except id)
export interface UpdateProductInput {
  id: string;
  name?: string;
  description?: string;
  price?: number;
  original_price?: number;
  image_url?: string;
  images?: string[];
  colors?: string[];
  handle_types?: string[];
  in_stock?: boolean;
  stock_quantity?: number;
  featured?: boolean;
  is_new?: boolean;
  is_bestseller?: boolean;
  customizable?: boolean;
  category_id?: string;
}

// Product filters interface for search and filtering
export interface ProductFilters {
  category?: string;
  priceRange?: [number, number];
  colors?: string[];
  handleTypes?: string[];
  inStock?: boolean;
  featured?: boolean;
  isNew?: boolean;
  isBestseller?: boolean;
  search?: string;
}

// Product categories
export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

// Product inventory tracking
export interface ProductInventory {
  product_id: string;
  stock_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  low_stock_threshold: number;
  last_updated: string;
}

// Product lifecycle events
export interface ProductLifecycleEvent {
  id: string;
  product_id: string;
  event_type: 'created' | 'updated' | 'deleted' | 'stock_updated' | 'featured_changed' | 'price_changed';
  event_data: any;
  user_id?: string;
  created_at: string;
}

// Transformed product for display (maintains compatibility with existing components)
export interface ProductDisplay {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  description: string;
  images: string[];
  categoryId: string;
  inStock: boolean;
  stockQuantity: number;
  colors: string[];
  handles: string[];
  features: string[];
  isNew: boolean;
  isBestseller: boolean;
  customizable: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

// Product statistics for admin dashboard
export interface ProductStats {
  totalProducts: number;
  inStockProducts: number;
  outOfStockProducts: number;
  lowStockProducts: number;
  featuredProducts: number;
  newProducts: number;
  bestsellerProducts: number;
  totalValue: number;
}

// Transform database product to display format
export const transformProduct = (dbProduct: Product): ProductDisplay => ({
  id: dbProduct.id,
  name: dbProduct.name,
  price: Number(dbProduct.price),
  originalPrice: dbProduct.original_price ? Number(dbProduct.original_price) : undefined,
  description: dbProduct.description || 'Handcrafted with premium beads and elegant finishing.',
  images: dbProduct.images?.length ? dbProduct.images : [dbProduct.image_url || '/assets/product-black-bag.jpg'],
  categoryId: dbProduct.category_id || 'handbag',
  inStock: dbProduct.in_stock,
  stockQuantity: dbProduct.stock_quantity || 0,
  colors: dbProduct.colors || [],
  handles: dbProduct.handle_types || [],
  features: ['Handmade with premium beads', 'Customizable with your name', 'Choice of handle types', 'Elegant gift packaging'],
  isNew: dbProduct.is_new || false,
  isBestseller: dbProduct.is_bestseller || false,
  customizable: dbProduct.customizable !== false, // Default to true
  featured: dbProduct.featured || false,
  createdAt: dbProduct.created_at,
  updatedAt: dbProduct.updated_at
});

// Transform display product back to database format
export const transformToDatabase = (displayProduct: Partial<ProductDisplay>): Partial<Product> => ({
  id: displayProduct.id,
  name: displayProduct.name,
  description: displayProduct.description,
  price: displayProduct.price,
  original_price: displayProduct.originalPrice,
  image_url: displayProduct.images?.[0],
  images: displayProduct.images,
  colors: displayProduct.colors,
  handle_types: displayProduct.handles,
  in_stock: displayProduct.inStock,
  stock_quantity: displayProduct.stockQuantity,
  featured: displayProduct.featured,
  is_new: displayProduct.isNew,
  is_bestseller: displayProduct.isBestseller,
  customizable: displayProduct.customizable,
  category_id: displayProduct.categoryId
});

// Product validation functions
export const validateProduct = (product: CreateProductInput): string[] => {
  const errors: string[] = [];
  
  if (!product.name?.trim()) errors.push('Product name is required');
  if (!product.description?.trim()) errors.push('Product description is required');
  if (!product.price || product.price <= 0) errors.push('Valid price is required');
  if (product.original_price && product.original_price <= product.price) {
    errors.push('Original price must be greater than current price');
  }
  if (!product.colors?.length) errors.push('At least one color is required');
  if (!product.handle_types?.length) errors.push('At least one handle type is required');
  if (!product.images?.length) errors.push('At least one image is required');
  
  return errors;
};

// Product utility functions
export const calculateDiscountPercentage = (originalPrice: number, currentPrice: number): number => {
  if (!originalPrice || originalPrice <= currentPrice) return 0;
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
};

export const isLowStock = (stockQuantity: number, threshold: number = 5): boolean => {
  return stockQuantity <= threshold;
};

export const isNewProduct = (createdAt: string, daysThreshold: number = 30): boolean => {
  const createdDate = new Date(createdAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - createdDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= daysThreshold;
};
