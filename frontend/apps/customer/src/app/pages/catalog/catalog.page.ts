import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '@frontend/shared-data-access';
import { CartService } from '../../services/cart.service';
import { SettingsService } from '../../services/settings.service';

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  basePrice: number;
  category?: { id?: string; name: string };
  unit?: { name: string; shortName: string };
  isAvailable: boolean;
  images: string[];
  tags: string[];
  isFeatured: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="catalog-container">
      <!-- Delivery ETA Banner -->
      @if (settings.deliveryMessage()) {
        <div class="delivery-banner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>{{ settings.deliveryMessage() }}</span>
        </div>
      }

      <header class="catalog-header">
        <h1>Our Products</h1>
        <p>Fresh vegetables and fruits sourced daily from local farms.</p>
      </header>

      <!-- Category Chips -->
      @if (categories().length > 0) {
        <div class="category-chips-wrapper">
          <div class="category-chips">
            <button
              class="chip"
              [class.active]="selectedCategory() === ''"
              (click)="selectedCategory.set('')"
            >All</button>
            @for (cat of categories(); track cat.id) {
              <button
                class="chip"
                [class.active]="selectedCategory() === cat.id"
                (click)="selectedCategory.set(cat.id)"
              >{{ cat.name }}</button>
            }
          </div>
        </div>
      }

      <!-- Search & Sort Bar -->
      <div class="filter-bar">
        <div class="search-box">
          <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input type="text" placeholder="Search products..." [value]="searchTerm()" (input)="searchTerm.set($any($event.target).value)" class="search-input" />
        </div>
        <select class="filter-select" [value]="sortBy()" (change)="sortBy.set($any($event.target).value)">
          <option value="name">Sort: A-Z</option>
          <option value="price_low">Price: Low to High</option>
          <option value="price_high">Price: High to Low</option>
        </select>
      </div>

      <!-- Loading Skeleton -->
      @if (loading()) {
        <div class="products-grid">
          @for (item of [1,2,3,4,5,6]; track item) {
            <div class="product-card skeleton-card">
              <div class="skeleton-image"></div>
              <div class="skeleton-badge"></div>
              <div class="skeleton-title"></div>
              <div class="skeleton-price"></div>
              <div class="skeleton-actions">
                <div class="skeleton-btn"></div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Products Grid -->
      @if (!loading()) {
        <div class="products-grid">
          @for (product of filteredProducts(); track product.id) {
            <div class="product-card">
              <!-- Product Image -->
              <a [routerLink]="['/product', product.slug]" class="product-image-wrapper">
                @if (product.images && product.images.length > 0) {
                  <img [src]="product.images[0]" [alt]="product.name" class="product-image" loading="lazy" />
                } @else {
                  <div class="product-image-placeholder">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4">
                      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>
                    </svg>
                  </div>
                }

                <!-- Badges -->
                <div class="badges">
                  @if (product.isFeatured) {
                    <span class="badge badge-bestseller">★ Bestseller</span>
                  }
                  @if (isNewProduct(product)) {
                    <span class="badge badge-new">New</span>
                  }
                  @if (hasTag(product, 'organic')) {
                    <span class="badge badge-organic">🌿 Organic</span>
                  }
                </div>

                @if (!product.isAvailable) {
                  <div class="out-of-stock-overlay">
                    <span>Out of Stock</span>
                  </div>
                }
              </a>

              <!-- Card Body -->
              <div class="card-body">
                @if (product.category?.name) {
                  <span class="category-label">{{ product.category!.name }}</span>
                }
                <h3 class="product-name">
                  <a [routerLink]="['/product', product.slug]">{{ product.name }}</a>
                </h3>

                <!-- Pricing -->
                <div class="product-pricing">
                  @if (getDiscountedPrice(product) !== null) {
                    <span class="product-mrp">₹{{ product.basePrice }}</span>
                    <span class="product-price">₹{{ getDiscountedPrice(product) }}</span>
                    <span class="discount-badge">{{ getDiscountPercent(product) }}% OFF</span>
                  } @else {
                    <span class="product-price">₹{{ product.basePrice }}</span>
                  }
                  @if (product.unit) {
                    <span class="product-unit">/ {{ product.unit.shortName || product.unit.name }}</span>
                  }
                </div>

                <!-- Quantity Controls / Add to Cart -->
                <div class="card-actions">
                  @if (getCartQuantity(product.id) > 0) {
                    <div class="qty-controls">
                      <button class="qty-btn" (click)="decrementQty(product)">−</button>
                      <span class="qty-value">{{ getCartQuantity(product.id) }}</span>
                      <button class="qty-btn" (click)="incrementQty(product)">+</button>
                    </div>
                  } @else {
                    <button
                      class="btn-add"
                      [disabled]="!product.isAvailable"
                      (click)="addToCart(product)"
                    >
                      <span class="plus-icon">+</span> ADD
                    </button>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      }

      @if (!loading() && products().length === 0) {
        <div class="empty-state">
          <p>No products available at the moment. Check back soon!</p>
        </div>
      }

      @if (!loading() && products().length > 0 && filteredProducts().length === 0) {
        <div class="empty-state">
          <p>No products match your search or filter criteria. Try adjusting your filters.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }

    .catalog-container {
      padding: 1rem 1rem 4rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    /* Delivery ETA Banner */
    .delivery-banner {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #065f46;
      padding: 0.6rem 1rem;
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
    }

    /* Header */
    .catalog-header {
      text-align: center;
      margin-bottom: 1.5rem;
    }
    .catalog-header h1 {
      font-size: 1.75rem;
      font-weight: 800;
      color: #1a1a1a;
      margin: 0 0 0.3rem;
    }
    .catalog-header p {
      font-size: 0.9rem;
      color: #6b7280;
      margin: 0;
    }

    /* Category Chips */
    .category-chips-wrapper {
      margin-bottom: 1.25rem;
      overflow: hidden;
    }
    .category-chips {
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
      padding-bottom: 0.5rem;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
    .category-chips::-webkit-scrollbar { display: none; }
    .chip {
      flex-shrink: 0;
      padding: 0.5rem 1rem;
      border: 1.5px solid #e5e7eb;
      border-radius: 50px;
      background: #ffffff;
      font-size: 0.82rem;
      font-weight: 600;
      color: #4b5563;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .chip:hover { border-color: #16a34a; color: #16a34a; }
    .chip.active {
      background: #16a34a;
      color: #ffffff;
      border-color: #16a34a;
    }

    /* Filter Bar */
    .filter-bar { display: flex; gap: 10px; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .search-box { position: relative; flex: 1; min-width: 200px; }
    .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #9ca3af; pointer-events: none; }
    .search-input { width: 100%; padding: 9px 12px 9px 38px; border: 1.5px solid #e5e7eb; border-radius: 10px; font-size: 0.875rem; outline: none; box-sizing: border-box; }
    .search-input:focus { border-color: #16a34a; box-shadow: 0 0 0 3px rgba(22,163,74,0.1); }
    .filter-select { padding: 9px 14px; border: 1.5px solid #e5e7eb; border-radius: 10px; font-size: 0.82rem; background: white; cursor: pointer; outline: none; }
    .filter-select:focus { border-color: #16a34a; }

    /* Products Grid */
    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 1rem;
    }

    /* Product Card */
    .product-card {
      background: #ffffff;
      border: 1px solid #f3f4f6;
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: box-shadow 0.2s, transform 0.15s;
    }
    .product-card:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      transform: translateY(-2px);
    }

    /* Product Image */
    .product-image-wrapper {
      position: relative;
      width: 100%;
      aspect-ratio: 1;
      background: #f9fafb;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      text-decoration: none;
      cursor: pointer;
    }
    .product-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .product-image-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      background: #f3f4f6;
      color: #9ca3af;
    }

    /* Badges */
    .badges {
      position: absolute;
      top: 6px;
      left: 6px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .badge {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      line-height: 1.3;
    }
    .badge-bestseller { background: #fef3c7; color: #92400e; }
    .badge-new { background: #dbeafe; color: #1e40af; }
    .badge-organic { background: #dcfce7; color: #166534; }

    /* Out of Stock */
    .out-of-stock-overlay {
      position: absolute;
      inset: 0;
      background: rgba(255,255,255,0.75);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .out-of-stock-overlay span {
      background: #fee2e2;
      color: #dc2626;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.25rem 0.75rem;
      border-radius: 6px;
    }

    /* Card Body */
    .card-body {
      padding: 0.75rem;
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .category-label {
      font-size: 0.7rem;
      font-weight: 600;
      color: #16a34a;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      margin-bottom: 0.2rem;
    }
    .product-name {
      font-size: 0.88rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 0.4rem;
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .product-name a {
      color: inherit;
      text-decoration: none;
    }
    .product-name a:hover { color: #16a34a; }

    /* Pricing */
    .product-pricing {
      display: flex;
      align-items: baseline;
      gap: 0.4rem;
      flex-wrap: wrap;
      margin-bottom: 0.75rem;
      margin-top: auto;
    }
    .product-price {
      font-size: 1rem;
      font-weight: 800;
      color: #1a1a1a;
    }
    .product-mrp {
      font-size: 0.82rem;
      color: #9ca3af;
      text-decoration: line-through;
    }
    .product-unit {
      font-size: 0.72rem;
      color: #9ca3af;
      font-weight: 500;
    }
    .discount-badge {
      font-size: 0.68rem;
      font-weight: 700;
      color: #16a34a;
      background: #ecfdf5;
      padding: 1px 5px;
      border-radius: 4px;
    }

    /* Card Actions */
    .card-actions {
      margin-top: auto;
    }
    .btn-add {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.3rem;
      padding: 0.55rem 0.75rem;
      background: #ffffff;
      color: #16a34a;
      font-size: 0.85rem;
      font-weight: 700;
      border: 1.5px solid #16a34a;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-add:hover:not(:disabled) {
      background: #16a34a;
      color: #ffffff;
    }
    .btn-add:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      border-color: #d1d5db;
      color: #9ca3af;
    }
    .plus-icon { font-size: 1.1rem; font-weight: 700; line-height: 1; }

    /* Quantity Controls */
    .qty-controls {
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1.5px solid #16a34a;
      border-radius: 8px;
      overflow: hidden;
    }
    .qty-btn {
      width: 36px;
      height: 36px;
      border: none;
      background: #16a34a;
      color: #ffffff;
      font-size: 1.1rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s;
    }
    .qty-btn:hover { background: #15803d; }
    .qty-value {
      flex: 1;
      text-align: center;
      font-size: 0.9rem;
      font-weight: 700;
      color: #16a34a;
      min-width: 32px;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 3rem 1.5rem;
      color: #6b7280;
      font-size: 0.95rem;
    }

    /* Skeleton Loading */
    .skeleton-card { pointer-events: none; }
    .skeleton-image {
      width: 100%;
      aspect-ratio: 1;
      background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }
    .skeleton-badge {
      width: 60px;
      height: 16px;
      border-radius: 4px;
      background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      margin: 0.75rem 0.75rem 0.4rem;
    }
    .skeleton-title {
      width: 80%;
      height: 16px;
      border-radius: 4px;
      background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      margin: 0 0.75rem 0.5rem;
    }
    .skeleton-price {
      width: 40%;
      height: 18px;
      border-radius: 4px;
      background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      margin: 0 0.75rem 0.75rem;
    }
    .skeleton-actions { padding: 0 0.75rem 0.75rem; }
    .skeleton-btn {
      width: 100%;
      height: 36px;
      border-radius: 8px;
      background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* Responsive */
    @media (max-width: 639px) {
      .products-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 0.75rem;
      }
      .catalog-header h1 { font-size: 1.4rem; }
      .card-body { padding: 0.6rem; }
      .product-name { font-size: 0.8rem; }
      .product-price { font-size: 0.9rem; }
    }

    @media (min-width: 1024px) {
      .products-grid {
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      }
    }
  `]
})
export class CatalogPage implements OnInit {
  private api = inject(ApiService);
  private cart = inject(CartService);
  private route = inject(ActivatedRoute);
  settings = inject(SettingsService);

  products = signal<Product[]>([]);
  loading = signal(true);

  categories = signal<Category[]>([]);
  searchTerm = signal<string>('');
  selectedCategory = signal<string>('');
  sortBy = signal<string>('name');

  filteredProducts = computed(() => {
    let result = this.products();

    // Filter by search term
    const term = this.searchTerm().toLowerCase().trim();
    if (term) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(term) ||
        (p.description && p.description.toLowerCase().includes(term))
      );
    }

    // Filter by category
    const catId = this.selectedCategory();
    if (catId) {
      result = result.filter(p => p.category?.id === catId);
    }

    // Sort
    const sort = this.sortBy();
    switch (sort) {
      case 'name':
        result = [...result].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price_low':
        result = [...result].sort((a, b) => a.basePrice - b.basePrice);
        break;
      case 'price_high':
        result = [...result].sort((a, b) => b.basePrice - a.basePrice);
        break;
    }

    return result;
  });

  ngOnInit(): void {
    const categorySlug = this.route.snapshot.queryParamMap.get('category') || '';

    this.api.getPaginated<Product>('/catalog/products').subscribe({
      next: (response) => {
        this.products.set(response.data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });

    this.api.get<any>('/catalog/categories').subscribe({
      next: (res) => {
        const cats = res.data || [];
        this.categories.set(cats);
        // Auto-select category from query param
        if (categorySlug) {
          const match = cats.find((c: Category) =>
            c.slug === categorySlug || c.name.toLowerCase() === categorySlug.toLowerCase()
          );
          if (match) {
            this.selectedCategory.set(match.id);
          }
        }
      }
    });
  }

  addToCart(product: Product): void {
    this.cart.addItem(product);
  }

  incrementQty(product: Product): void {
    const current = this.getCartQuantity(product.id);
    this.cart.updateQuantity(product.id, current + 1);
  }

  decrementQty(product: Product): void {
    const current = this.getCartQuantity(product.id);
    this.cart.updateQuantity(product.id, current - 1);
  }

  getCartQuantity(productId: string): number {
    const item = this.cart.items().find(i => i.productId === productId);
    return item?.quantity ?? 0;
  }

  isNewProduct(product: Product): boolean {
    if (!product.createdAt) return false;
    const created = new Date(product.createdAt);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return created > sevenDaysAgo;
  }

  hasTag(product: Product, tag: string): boolean {
    return product.tags?.some(t => t.toLowerCase() === tag.toLowerCase()) ?? false;
  }

  getDiscountedPrice(product: Product): number | null {
    // Check if product has a 'sale' or 'discount' tag with format "discount:XX"
    // or if isFeatured with a discount tag
    const discountTag = product.tags?.find(t => t.toLowerCase().startsWith('discount:'));
    if (discountTag) {
      const percent = parseFloat(discountTag.split(':')[1]);
      if (!isNaN(percent) && percent > 0 && percent <= 100) {
        return Math.round(product.basePrice * (1 - percent / 100));
      }
    }
    return null;
  }

  getDiscountPercent(product: Product): number {
    const discountTag = product.tags?.find(t => t.toLowerCase().startsWith('discount:'));
    if (discountTag) {
      const percent = parseFloat(discountTag.split(':')[1]);
      if (!isNaN(percent)) return Math.round(percent);
    }
    return 0;
  }
}
