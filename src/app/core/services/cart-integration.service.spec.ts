import { TestBed } from '@angular/core/testing';
import { CartIntegrationService } from './cart-integration.service';
import { CartStateService } from './cart-state.service';
import { CartItem, CartSummary, CartState } from '../../types/cart';
import { ProductDisplay } from '../../types/product';

describe('CartIntegrationService', () => {
  let service: CartIntegrationService;
  let mockCartStateService: jasmine.SpyObj<CartStateService>;

  const mockProduct: ProductDisplay = {
    id: '1',
    name: 'Test Product',
    price: 100,
    description: 'Test Description',
    images: ['test-image.jpg'],
    categoryId: 'handbag',
    inStock: true,
    stockQuantity: 10,
    colors: ['Red', 'Blue'],
    handles: ['Leather', 'Canvas'],
    features: ['Feature 1', 'Feature 2'],
    isNew: true,
    isBestseller: false,
    customizable: true,
    featured: false,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  };

  const mockCartState: CartState = {
    items: [],
    summary: {
      totalItems: 0,
      totalPrice: 0,
      totalDiscount: 0,
      subtotal: 0,
      shipping: 0,
      tax: 0
    },
    isLoading: false,
    error: null,
    lastSync: null
  };

  beforeEach(() => {
    const spy = jasmine.createSpyObj('CartStateService', [
      'addToCart',
      'removeFromCart',
      'updateItemQuantity',
      'clearCart',
      'getCartState',
      'getSyncState',
      'getPendingChangesCount'
    ], {
      cartState$: { subscribe: () => {} },
      items$: { subscribe: () => {} },
      summary$: { subscribe: () => {} },
      totalItems$: { subscribe: () => {} },
      syncState$: { subscribe: () => {} }
    });

    TestBed.configureTestingModule({
      providers: [
        CartIntegrationService,
        { provide: CartStateService, useValue: spy }
      ]
    });

    service = TestBed.inject(CartIntegrationService);
    mockCartStateService = TestBed.inject(CartStateService) as jasmine.SpyObj<CartStateService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add item to cart', async () => {
    mockCartStateService.addToCart.and.returnValue(Promise.resolve());
    
    await service.addToCart(mockProduct, 2, 'Red', 'Leather', 'Custom Name');
    
    expect(mockCartStateService.addToCart).toHaveBeenCalledWith(
      mockProduct, 2, 'Red', 'Leather', 'Custom Name'
    );
  });

  it('should remove item from cart', async () => {
    mockCartStateService.removeFromCart.and.returnValue(Promise.resolve());
    
    await service.removeFromCart('item-id');
    
    expect(mockCartStateService.removeFromCart).toHaveBeenCalledWith('item-id');
  });

  it('should update item quantity', async () => {
    mockCartStateService.updateItemQuantity.and.returnValue(Promise.resolve());
    
    await service.updateItemQuantity('item-id', 3);
    
    expect(mockCartStateService.updateItemQuantity).toHaveBeenCalledWith('item-id', 3);
  });

  it('should clear cart', async () => {
    mockCartStateService.clearCart.and.returnValue(Promise.resolve());
    
    await service.clearCart();
    
    expect(mockCartStateService.clearCart).toHaveBeenCalled();
  });

  it('should get cart state', () => {
    mockCartStateService.getCartState.and.returnValue(mockCartState);
    
    const result = service.getCartState();
    
    expect(result).toEqual(mockCartState);
    expect(mockCartStateService.getCartState).toHaveBeenCalled();
  });

  it('should check if cart is empty', () => {
    mockCartStateService.getCartState.and.returnValue(mockCartState);
    
    const result = service.isCartEmpty();
    
    expect(result).toBe(true);
  });

  it('should get cart item count', () => {
    mockCartStateService.getCartState.and.returnValue(mockCartState);
    
    const result = service.getCartItemCount();
    
    expect(result).toBe(0);
  });

  it('should validate cart for checkout', () => {
    mockCartStateService.getCartState.and.returnValue(mockCartState);
    
    const validation = service.validateCartForCheckout();
    
    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain('Cart is empty');
  });

  it('should export cart for checkout', () => {
    mockCartStateService.getCartState.and.returnValue(mockCartState);
    
    const exportData = service.exportCartForCheckout();
    
    expect(exportData.items).toEqual([]);
    expect(exportData.summary).toEqual(mockCartState.summary);
    expect(exportData.validation.isValid).toBe(false);
  });

  it('should check if product is in cart', () => {
    mockCartStateService.getCartState.and.returnValue(mockCartState);
    
    const result = service.isProductInCart('1', 'Red', 'Leather', 'Custom Name');
    
    expect(result).toBe(false);
  });

  it('should get product quantity in cart', () => {
    mockCartStateService.getCartState.and.returnValue(mockCartState);
    
    const result = service.getProductQuantityInCart('1', 'Red', 'Leather', 'Custom Name');
    
    expect(result).toBe(0);
  });
});
