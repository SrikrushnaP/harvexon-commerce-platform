import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '@frontend/shared-data-access';
import { CartService } from '../../services/cart.service';

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  basePrice: number;
  category?: { name: string };
  unit?: { name: string; shortName: string };
  tags: string[];
  images: string[];
  isAvailable: boolean;
  isFeatured: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-product-page',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="product-page">
      <nav class="breadcrumb">
        <a routerLink="/catalog" class="back-link">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Back to Catalog
        </a>
      </nav>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading product...</p>
        </div>
      } @else if (product()) {
        <div class="product-detail">
          <!-- Image Gallery -->
          <div class="image-section">
            <div class="main-image-wrapper">
              @if (product()!.images && product()!.images.length > 0) {
                <img [src]="selectedImage()" [alt]="product()!.name" class="main-image" />
              } @else {
                <div class="image-placeholder">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>
                  </svg>
                </div>
              }

              <!-- Badges on image -->
              <div class="image-badges">
                @if (product()!.isFeatured) {
                  <span class="badge badge-bestseller">★ Bestseller</span>
                }
                @if (isNewProduct()) {
                  <span class="badge badge-new">New</span>
                }
                @if (hasTag('organic')) {
                  <span class="badge badge-organic">🌿 Organic</span>
                }
                @if (discountPercent() > 0) {
                  <span class="badge badge-discount">{{ discountPercent() }}% OFF</span>
                }
              </div>
            </div>

            <!-- Image thumbnails -->
            @if (product()!.images && product()!.images.length > 1) {
              <div class="image-thumbnails">
                @for (img of product()!.images; track img; let i = $index) {
                  <button
                    class="thumb"
                    [class.active]="selectedImage() === img"
                    (click)="selectedImage.set(img)"
                  >
                    <img [src]="img" [alt]="product()!.name + ' - Image ' + (i + 1)" />
                  </button>
                }
              </div>
            }
          </div>

          <!-- Product Info -->
          <div class="info-section">
            @if (product()!.category?.name) {
              <span class="category-badge">{{ product()!.category!.name }}</span>
            }

            <h1 class="product-name">{{ product()!.name }}</h1>

            @if (product()!.description) {
              <p class="product-description">{{ product()!.description }}</p>
            }

            <!-- Pricing -->
            <div class="price-section">
              @if (discountedPrice() !== null) {
                <div class="price-row">
                  <span class="price-current">₹{{ discountedPrice() }}</span>
                  <span class="price-mrp">₹{{ product()!.basePrice }}</span>
                  <span class="price-save">You save ₹{{ product()!.basePrice - discountedPrice()! }}</span>
                </div>
              } @else {
                <span class="price-current">₹{{ product()!.basePrice }}</span>
              }
              @if (product()!.unit) {
                <span class="price-unit">per {{ product()!.unit!.name }}</span>
              }
            </div>

            <!-- Availability -->
            <div class="availability" [class.available]="product()!.isAvailable" [class.unavailable]="!product()!.isAvailable">
              <span class="availability-dot"></span>
              <span class="availability-text">
                {{ product()!.isAvailable ? 'In Stock' : 'Out of Stock' }}
              </span>
            </div>

            <!-- Tags -->
            @if (displayTags().length > 0) {
              <div class="tags-container">
                @for (tag of displayTags(); track tag) {
                  <span class="tag-chip">{{ tag }}</span>
                }
              </div>
            }

            <!-- Quantity & Add to Cart -->
            <div class="purchase-section">
              <div class="quantity-section">
                <span class="quantity-label">Quantity</span>
                <div class="quantity-selector">
                  <button class="qty-btn" (click)="decreaseQty()" [disabled]="quantity() <= 1">−</button>
                  <span class="qty-value">{{ quantity() }}</span>
                  <button class="qty-btn" (click)="quantity.set(quantity() + 1)">+</button>
                </div>
              </div>

              @if (added()) {
                <div class="success-state">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13L9 17L19 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <span>Added to Cart!</span>
                  <a routerLink="/cart" class="view-cart-link">View Cart →</a>
                </div>
              } @else {
                <button class="add-to-cart-btn" (click)="addToCart()" [disabled]="!product()!.isAvailable">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                  <span class="btn-text">Add to Cart</span>
                  <span class="btn-price">₹{{ totalPrice() }}</span>
                </button>
              }
            </div>
          </div>
        </div>
      } @else {
        <div class="error-state">
          <p>Product not found.</p>
          <a routerLink="/catalog" class="back-btn">← Browse Catalog</a>
        </div>
      }
    </div>
  `,
  styles: [`
    .product-page {
      min-height: 100vh;
      padding: 16px 16px 80px;
      background: #f8faf8;
      max-width: 900px;
      margin: 0 auto;
    }

    .breadcrumb { margin-bottom: 16px; }
    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: #4a5568;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      transition: color 0.2s;
    }
    .back-link:hover { color: #16a34a; }

    /* Loading */
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 20px;
      gap: 16px;
    }
    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid #e2e8f0;
      border-top-color: #16a34a;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading-state p { color: #718096; font-size: 14px; }

    /* Layout */
    .product-detail {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
      background: #ffffff;
      border-radius: 16px;
      padding: 1.25rem;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    }

    @media (min-width: 640px) {
      .product-detail {
        grid-template-columns: 1fr 1fr;
        padding: 1.5rem;
        gap: 2rem;
      }
    }

    /* Image Section */
    .image-section { display: flex; flex-direction: column; gap: 0.75rem; }

    .main-image-wrapper {
      position: relative;
      width: 100%;
      aspect-ratio: 1;
      background: #f9fafb;
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .main-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .image-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      color: #9ca3af;
    }

    /* Image Badges */
    .image-badges {
      position: absolute;
      top: 10px;
      left: 10px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .badge {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      line-height: 1.3;
      width: fit-content;
    }
    .badge-bestseller { background: #fef3c7; color: #92400e; }
    .badge-new { background: #dbeafe; color: #1e40af; }
    .badge-organic { background: #dcfce7; color: #166534; }
    .badge-discount { background: #fee2e2; color: #dc2626; }

    /* Thumbnails */
    .image-thumbnails {
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
      padding-bottom: 4px;
    }
    .thumb {
      width: 56px;
      height: 56px;
      border-radius: 8px;
      overflow: hidden;
      border: 2px solid #e5e7eb;
      cursor: pointer;
      flex-shrink: 0;
      padding: 0;
      background: none;
      transition: border-color 0.2s;
    }
    .thumb.active { border-color: #16a34a; }
    .thumb:hover { border-color: #86efac; }
    .thumb img { width: 100%; height: 100%; object-fit: cover; }

    /* Info Section */
    .info-section { display: flex; flex-direction: column; gap: 0.75rem; }

    .category-badge {
      display: inline-block;
      padding: 4px 12px;
      background: #ecfdf5;
      color: #16a34a;
      border-radius: 20px;
      font-size: 0.72rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      width: fit-content;
    }

    .product-name {
      font-size: 1.5rem;
      font-weight: 800;
      color: #1a202c;
      margin: 0;
      line-height: 1.25;
    }

    .product-description {
      color: #4a5568;
      font-size: 0.9rem;
      line-height: 1.6;
      margin: 0;
    }

    /* Pricing */
    .price-section { margin: 0.25rem 0; }
    .price-row { display: flex; align-items: baseline; gap: 0.5rem; flex-wrap: wrap; }
    .price-current { font-size: 1.75rem; font-weight: 800; color: #1a202c; }
    .price-mrp { font-size: 1rem; color: #9ca3af; text-decoration: line-through; }
    .price-save {
      font-size: 0.78rem;
      font-weight: 600;
      color: #16a34a;
      background: #ecfdf5;
      padding: 2px 8px;
      border-radius: 4px;
    }
    .price-unit { font-size: 0.82rem; color: #6b7280; display: block; margin-top: 2px; }

    /* Availability */
    .availability { display: flex; align-items: center; gap: 8px; }
    .availability-dot { width: 8px; height: 8px; border-radius: 50%; }
    .availability.available .availability-dot { background: #16a34a; box-shadow: 0 0 6px rgba(22,163,74,0.4); }
    .availability.unavailable .availability-dot { background: #dc2626; }
    .availability-text { font-size: 0.82rem; font-weight: 600; }
    .availability.available .availability-text { color: #16a34a; }
    .availability.unavailable .availability-text { color: #dc2626; }

    /* Tags */
    .tags-container { display: flex; flex-wrap: wrap; gap: 6px; }
    .tag-chip {
      padding: 4px 10px;
      background: #f3f4f6;
      color: #4b5563;
      border-radius: 16px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    /* Purchase Section */
    .purchase-section {
      margin-top: auto;
      padding-top: 1rem;
      border-top: 1px solid #f3f4f6;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .quantity-section {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .quantity-label { font-size: 0.9rem; font-weight: 600; color: #374151; }
    .quantity-selector {
      display: flex;
      align-items: center;
      border: 1.5px solid #e5e7eb;
      border-radius: 10px;
      overflow: hidden;
    }
    .qty-btn {
      width: 40px;
      height: 40px;
      border: none;
      background: #f9fafb;
      color: #374151;
      font-size: 1.2rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s;
    }
    .qty-btn:hover:not(:disabled) { background: #ecfdf5; color: #16a34a; }
    .qty-btn:disabled { opacity: 0.3; cursor: not-allowed; }
    .qty-value {
      min-width: 44px;
      text-align: center;
      font-size: 1rem;
      font-weight: 700;
      color: #1f2937;
    }

    .add-to-cart-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 14px 20px;
      background: #16a34a;
      color: #ffffff;
      border: none;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(22,163,74,0.25);
    }
    .add-to-cart-btn:hover:not(:disabled) {
      background: #15803d;
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(22,163,74,0.35);
    }
    .add-to-cart-btn:active:not(:disabled) { transform: translateY(0); }
    .add-to-cart-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-text { flex: 1; text-align: left; }
    .btn-price { font-weight: 800; }

    .success-state {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 20px;
      background: #ecfdf5;
      border: 1.5px solid #a7f3d0;
      border-radius: 12px;
      color: #16a34a;
      font-weight: 600;
      font-size: 0.9rem;
    }
    .view-cart-link {
      margin-left: auto;
      color: #16a34a;
      text-decoration: none;
      font-size: 0.82rem;
      font-weight: 700;
    }
    .view-cart-link:hover { text-decoration: underline; }

    /* Error State */
    .error-state {
      text-align: center;
      padding: 4rem 1.5rem;
      color: #6b7280;
    }
    .error-state .back-btn {
      display: inline-block;
      margin-top: 1rem;
      padding: 10px 20px;
      background: #16a34a;
      color: white;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.9rem;
    }

    @media (max-width: 639px) {
      .product-name { font-size: 1.25rem; }
      .price-current { font-size: 1.5rem; }
    }
  `]
})
export class ProductPage implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private cart = inject(CartService);

  product = signal<Product | null>(null);
  loading = signal(true);
  quantity = signal(1);
  added = signal(false);
  selectedImage = signal<string>('');

  displayTags = computed(() => {
    const p = this.product();
    if (!p || !p.tags) return [];
    return p.tags.filter(t => !t.toLowerCase().startsWith('discount:'));
  });

  discountPercent = computed(() => {
    const p = this.product();
    if (!p || !p.tags) return 0;
    const tag = p.tags.find(t => t.toLowerCase().startsWith('discount:'));
    if (tag) {
      const val = parseFloat(tag.split(':')[1]);
      if (!isNaN(val) && val > 0 && val <= 100) return Math.round(val);
    }
    return 0;
  });

  discountedPrice = computed(() => {
    const p = this.product();
    const pct = this.discountPercent();
    if (!p || pct === 0) return null;
    return Math.round(p.basePrice * (1 - pct / 100));
  });

  totalPrice = computed(() => {
    const p = this.product();
    if (!p) return 0;
    const unitPrice = this.discountedPrice() ?? p.basePrice;
    return unitPrice * this.quantity();
  });

  ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.api.get<{ product: Product }>(`/catalog/products/slug/${slug}`).subscribe({
        next: (res) => {
          const p = res.data?.product || null;
          this.product.set(p);
          if (p && p.images && p.images.length > 0) {
            this.selectedImage.set(p.images[0]);
          }
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        }
      });
    }
  }

  isNewProduct(): boolean {
    const p = this.product();
    if (!p || !p.createdAt) return false;
    const created = new Date(p.createdAt);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return created > sevenDaysAgo;
  }

  hasTag(tag: string): boolean {
    const p = this.product();
    return p?.tags?.some(t => t.toLowerCase() === tag.toLowerCase()) ?? false;
  }

  decreaseQty() {
    if (this.quantity() > 1) {
      this.quantity.set(this.quantity() - 1);
    }
  }

  addToCart() {
    const p = this.product();
    if (!p) return;
    this.cart.addItem(p, this.quantity());
    this.added.set(true);
    setTimeout(() => this.added.set(false), 3000);
  }
}
