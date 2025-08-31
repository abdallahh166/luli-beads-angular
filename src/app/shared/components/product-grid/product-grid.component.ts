import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { ProductDisplay } from '../../../types/product';

@Component({
  selector: 'app-product-grid',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './product-grid.component.html',
  styleUrl: './product-grid.component.css'
})
export class ProductGridComponent implements OnInit {
  allProducts: ProductDisplay[] = [];
  filteredProducts: ProductDisplay[] = [];
  isLoading = false;
  
  // Filter and sort properties
  selectedCategory = 'all';
  selectedColor = 'all';
  sortBy = 'name';
  viewMode: 'grid' | 'list' = 'grid';

  constructor(
    private productService: ProductService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading = true;
    this.productService.getNewProducts().subscribe({
      next: (products: ProductDisplay[]) => {
        this.allProducts = products;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading products:', error);
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.allProducts];

    // Apply category filter
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.categoryId === this.selectedCategory);
    }

    // Apply color filter
    if (this.selectedColor !== 'all') {
      filtered = filtered.filter(product => product.colors.includes(this.selectedColor));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    this.filteredProducts = filtered;
  }

  onCategoryChange(): void {
    this.applyFilters();
  }

  onColorChange(): void {
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
  }

  clearFilters(): void {
    this.selectedCategory = 'all';
    this.selectedColor = 'all';
    this.applyFilters();
  }

  trackByProductId(index: number, product: ProductDisplay): string {
    return product.id;
  }

  addToCart(product: ProductDisplay): void {
    this.cartService.addToCart(product);
  }

  addToWishlist(product: ProductDisplay): void {
    // TODO: Implement wishlist functionality
    console.log('Add to wishlist:', product.id);
  }

  quickView(product: ProductDisplay): void {
    // TODO: Implement quick view functionality
    console.log('Quick view:', product.id);
  }
}
