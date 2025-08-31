import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';

interface WishlistItem {
  id: string;
  name: string;
  price: number;
  image: string;
}

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.css'
})
export class WishlistComponent implements OnInit {
  wishlistItems: WishlistItem[] = [];

  constructor(
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadWishlist();
  }

  private loadWishlist(): void {
    // Mock wishlist data - in real app, this would come from a service
    this.wishlistItems = [
      {
        id: '1',
        name: 'Rose Gold Beaded Evening Clutch',
        price: 149.99,
        image: '/assets/product-rose-bag.jpg'
      },
      {
        id: '2',
        name: 'Black Beaded Statement Bag',
        price: 129.99,
        image: '/assets/product-black-bag.jpg'
      },
      {
        id: '3',
        name: 'White Pearl Beaded Clutch',
        price: 119.99,
        image: '/assets/product-white-bag.jpg'
      }
    ];
  }

  trackByItemId(index: number, item: WishlistItem): string {
    return item.id;
  }

  removeFromWishlist(itemId: string): void {
    this.wishlistItems = this.wishlistItems.filter(item => item.id !== itemId);
    // TODO: Implement remove from wishlist service
    console.log('Removed from wishlist:', itemId);
  }

  addToCart(item: WishlistItem): void {
    // Convert WishlistItem to ProductDisplay for cart service
    const productDisplay = {
      id: item.id,
      name: item.name,
      price: item.price,
      originalPrice: undefined,
      description: 'Handcrafted with premium beads and elegant finishing.',
      images: [item.image],
      categoryId: 'handbag',
      inStock: true,
      stockQuantity: 10,
      colors: [],
      handles: [],
      features: ['Handmade with premium beads', 'Customizable with your name', 'Choice of handle types', 'Elegant gift packaging'],
      isNew: false,
      isBestseller: false,
      customizable: true,
      featured: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.cartService.addToCart(productDisplay);
    // TODO: Show success message
    console.log('Added to cart:', item.id);
  }
}
