import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { ProductDisplay } from '../../types/product';

// Component for displaying product details

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent implements OnInit {
  product: ProductDisplay | null = null;
  selectedImage: number = 0;
  selectedColor: string = '';
  selectedHandle: string = '';
  customName: string = '';
  quantity: number = 1;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const productId = params['id'];
      if (productId) {
        this.loadProduct(productId);
      }
    });
  }

  private loadProduct(productId: string): void {
    this.productService.getProductById(productId).subscribe(product => {
      if (product) {
        this.product = product;
        this.selectedColor = product.colors[0] || '';
        this.selectedHandle = product.handles[0] || '';
      } else {
        this.router.navigate(['/not-found']);
      }
    });
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  increaseQuantity(): void {
    this.quantity++;
  }

  addToCart(): void {
    if (this.product && this.selectedColor && this.selectedHandle) {
      this.cartService.addToCart(this.product);
      // TODO: Show success message
      console.log('Added to cart:', this.product.name);
    }
  }

  addToWishlist(): void {
    // TODO: Implement wishlist functionality
    console.log('Add to wishlist:', this.product?.id);
  }

  buyNow(): void {
    this.addToCart();
    if (this.selectedColor && this.selectedHandle) {
      this.router.navigate(['/cart']);
    }
  }

  getDiscountPercentage(): number {
    if (this.product?.originalPrice) {
      return Math.round(((this.product.originalPrice - this.product.price) / this.product.originalPrice) * 100);
    }
    return 0;
  }
}


