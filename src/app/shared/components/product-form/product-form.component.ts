import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { CreateProductInput, UpdateProductInput, validateProduct } from '../../../types/product';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.css'
})
export class ProductFormComponent implements OnInit {
  @Input() productId?: string;
  @Input() isEditMode = false;
  @Output() productSaved = new EventEmitter<any>();
  @Output() formCancelled = new EventEmitter<void>();

  // Form data
  formData: CreateProductInput = {
    name: '',
    description: '',
    price: 0,
    original_price: undefined,
    image_url: '',
    images: [],
    colors: [],
    handle_types: [],
    in_stock: true,
    stock_quantity: 10,
    featured: false,
    is_new: true,
    is_bestseller: false,
    customizable: true,
    category_id: 'handbag'
  };

  // Form state
  isLoading = false;
  errors: string[] = [];
  successMessage = '';

  // Available options
  categories = [
    { id: 'handbag', name: 'Handbag' },
    { id: 'clutch', name: 'Clutch' },
    { id: 'crossbody', name: 'Crossbody' },
    { id: 'tote', name: 'Tote' }
  ];

  availableColors = [
    'Black', 'White', 'Cream', 'Rose Gold', 'Gold', 'Silver', 
    'Red', 'Blue', 'Green', 'Purple', 'Pink', 'Brown'
  ];

  availableHandleTypes = [
    'Chain', 'Leather', 'Beaded', 'Fabric', 'Metal', 'Wooden'
  ];

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    if (this.isEditMode && this.productId) {
      this.loadProductForEdit();
    }
  }

  /**
   * Load product data for editing
   */
  private async loadProductForEdit(): Promise<void> {
    if (!this.productId) return;

    this.isLoading = true;
    try {
      const product = await this.productService.getProductById(this.productId).toPromise();
      if (product) {
        this.formData = {
          name: product.name,
          description: product.description,
          price: product.price,
          original_price: product.originalPrice,
          image_url: product.images[0] || '',
          images: product.images,
          colors: product.colors,
          handle_types: product.handles,
          in_stock: product.inStock,
          stock_quantity: product.stockQuantity,
          featured: product.featured,
          is_new: product.isNew,
          is_bestseller: product.isBestseller,
          customizable: product.customizable,
          category_id: product.categoryId
        };
      }
    } catch (error) {
      this.errors = ['Failed to load product data'];
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Handle form submission
   */
  async onSubmit(): Promise<void> {
    this.clearMessages();
    
    // Validate form
    const validationErrors = validateProduct(this.formData);
    if (validationErrors.length > 0) {
      this.errors = validationErrors;
      return;
    }

    this.isLoading = true;

    try {
      let result;
      
      if (this.isEditMode && this.productId) {
        // Update existing product
        const updateData: UpdateProductInput = {
          id: this.productId,
          ...this.formData
        };
        result = await this.productService.updateProduct(updateData);
      } else {
        // Create new product
        result = await this.productService.createProduct(this.formData);
      }

      if (result.success) {
        this.successMessage = this.isEditMode 
          ? 'Product updated successfully!' 
          : 'Product created successfully!';
        
        // Emit success event
        this.productSaved.emit(result.product);
        
        // Reset form if creating new product
        if (!this.isEditMode) {
          this.resetForm();
        }
      } else {
        this.errors = [result.error || 'Operation failed'];
      }
    } catch (error: any) {
      this.errors = [error.message || 'An unexpected error occurred'];
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Add a new color to the product
   */
  addColor(color: string): void {
    if (color && !this.formData.colors.includes(color)) {
      this.formData.colors.push(color);
    }
  }

  /**
   * Remove a color from the product
   */
  removeColor(color: string): void {
    this.formData.colors = this.formData.colors.filter(c => c !== color);
  }

  /**
   * Add a new handle type to the product
   */
  addHandleType(handleType: string): void {
    if (handleType && !this.formData.handle_types.includes(handleType)) {
      this.formData.handle_types.push(handleType);
    }
  }

  /**
   * Remove a handle type from the product
   */
  removeHandleType(handleType: string): void {
    this.formData.handle_types = this.formData.handle_types.filter(h => h !== handleType);
  }

  /**
   * Add a new image URL
   */
  addImage(): void {
    if (this.formData.image_url && !this.formData.images.includes(this.formData.image_url)) {
      this.formData.images.push(this.formData.image_url);
      this.formData.image_url = '';
    }
  }

  /**
   * Remove an image from the product
   */
  removeImage(imageUrl: string): void {
    this.formData.images = this.formData.images.filter(img => img !== imageUrl);
  }

  /**
   * Reset form to initial state
   */
  resetForm(): void {
    this.formData = {
      name: '',
      description: '',
      price: 0,
      original_price: undefined,
      image_url: '',
      images: [],
      colors: [],
      handle_types: [],
      in_stock: true,
      stock_quantity: 10,
      featured: false,
      is_new: true,
      is_bestseller: false,
      customizable: true,
      category_id: 'handbag'
    };
    this.clearMessages();
  }

  /**
   * Cancel form and emit cancel event
   */
  onCancel(): void {
    this.formCancelled.emit();
  }

  /**
   * Clear error and success messages
   */
  private clearMessages(): void {
    this.errors = [];
    this.successMessage = '';
  }

  /**
   * Check if form is valid
   */
  get isFormValid(): boolean {
    return !!(this.formData.name && 
              this.formData.description && 
              this.formData.price > 0 && 
              this.formData.colors.length > 0 && 
              this.formData.handle_types.length > 0);
  }

  /**
   * Get discount percentage
   */
  get discountPercentage(): number {
    if (!this.formData.original_price || this.formData.original_price <= this.formData.price) {
      return 0;
    }
    return Math.round(((this.formData.original_price - this.formData.price) / this.formData.original_price) * 100);
  }
}
