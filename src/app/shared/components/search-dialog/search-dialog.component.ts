import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { ProductService } from '../../../core/services/product.service';
import { ProductDisplay } from '../../../types/product';

@Component({
  selector: 'app-search-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatDialogModule,
    MatAutocompleteModule,
    MatChipsModule
  ],
  templateUrl: './search-dialog.component.html',
  styleUrl: './search-dialog.component.css'
})
export class SearchDialogComponent {
  @Output() close = new EventEmitter<void>();
  
  searchQuery = '';
  searchResults: ProductDisplay[] = [];
  isSearching = false;
  
  popularTags = [
    'Handbags',
    'Rose Gold',
    'Black',
    'Customizable',
    'Bestseller',
    'New Arrivals',
    'Clutches',
    'Evening Bags'
  ];

  constructor(
    private productService: ProductService,
    private router: Router
  ) {}

  onSearchChange(query: string): void {
    this.searchQuery = query;
    
    if (!query.trim()) {
      this.searchResults = [];
      return;
    }

    this.isSearching = true;
    
    // Simulate search delay
    setTimeout(() => {
      this.performSearch(query);
      this.isSearching = false;
    }, 300);
  }

  private performSearch(query: string): void {
    const filters = { search: query };
    this.productService.applyFilters(filters);
    
    // Get filtered products
    this.productService.filteredProducts$.subscribe(products => {
      this.searchResults = products.slice(0, 10); // Limit to 10 results
    });
  }

  selectProduct(product: ProductDisplay): void {
    this.router.navigate(['/product', product.id]);
    this.close.emit();
  }

  getColorValue(color: string): string {
    const colorMap: { [key: string]: string } = {
      'Black': '#000000',
      'White': '#FFFFFF',
      'Rose Gold': '#E8B4B8',
      'Cream': '#F5F5DC',
      'Gold': '#FFD700',
      'Silver': '#C0C0C0'
    };
    return colorMap[color] || '#CCCCCC';
  }
}
