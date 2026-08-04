import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
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
  basePrice: number;
  category?: { name: string };
  unit?: { name: string; shortName: string };
  isAvailable: boolean;
  images: string[];
  isFeatured: boolean;
}

interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  link?: string;
  type: 'offer' | 'announcement' | 'promo';
  bgColor: string;
  textColor: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule],
  template: `
    <!-- Hero -->
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-badge">🌿 Farm to Doorstep</div>
        <h1>Fresh Groceries,<br/>Delivered <span class="highlight">Today</span></h1>
        <p>Handpicked vegetables & fruits from local farms. Order now, get it within hours.</p>
        <div class="hero-actions">
          <a routerLink="/catalog" class="btn-primary">Shop Now →</a>
        </div>
        <div class="hero-stats">
          <div class="stat"><span class="stat-value">500+</span><span class="stat-label">Products</span></div>
          <div class="stat-divider"></div>
          <div class="stat"><span class="stat-value">2hr</span><span class="stat-label">Delivery</span></div>
          <div class="stat-divider"></div>
          <div class="stat"><span class="stat-value">10k+</span><span class="stat-label">Happy Customers</span></div>
        </div>
      </div>
    </section>

    <!-- Offers / Banners -->
    @if (banners().length > 0) {
      <section class="banners-section">
        <div class="banners-scroll">
          @for (banner of banners(); track banner.id) {
            <a
              [routerLink]="banner.link || '/catalog'"
              class="banner-card"
              [style.background]="banner.bgColor"
              [style.color]="banner.textColor"
            >
              @if (banner.image) {
                <img [src]="banner.image" [alt]="banner.title" class="banner-img" />
              }
              <div class="banner-content">
                <span class="banner-type">{{ banner.type === 'offer' ? '🏷️ OFFER' : banner.type === 'promo' ? '🎉 PROMO' : '📢' }}</span>
                <strong class="banner-title">{{ banner.title }}</strong>
                @if (banner.subtitle) {
                  <span class="banner-subtitle">{{ banner.subtitle }}</span>
                }
              </div>
            </a>
          }
        </div>
      </section>
    }

    <!-- Delivery Banner -->
    @if (settings.deliveryMessage()) {
      <div class="delivery-strip">
        <span class="strip-icon">⚡</span>
        <span>{{ settings.deliveryMessage() }}</span>
      </div>
    }

    <!-- Shop by Category -->
    @if (categories().length > 0) {
      <section class="section">
        <div class="section-head">
          <h2>Shop by Category</h2>
          <a routerLink="/catalog" class="view-all">View All →</a>
        </div>
        <div class="category-scroll">
          @for (cat of categories(); track cat.id) {
            <a [routerLink]="['/catalog']" [queryParams]="{category: cat.slug}" class="category-item">
              <div class="category-icon">
                @switch (cat.name.toLowerCase()) {
                  @case ('vegetables') { 🥦 }
                  @case ('fruits') { 🍎 }
                  @case ('leafy greens') { 🥬 }
                  @case ('dairy') { 🥛 }
                  @case ('grains') { 🌾 }
                  @case ('spices') { 🌶️ }
                  @default { 🛒 }
                }
              </div>
              <span class="category-name">{{ cat.name }}</span>
            </a>
          }
        </div>
      </section>
    }

    <!-- Featured Products -->
    @if (featuredProducts().length > 0) {
      <section class="section">
        <div class="section-head">
          <h2>🔥 Popular Items</h2>
          <a routerLink="/catalog" class="view-all">View All →</a>
        </div>
        <div class="products-scroll">
          @for (product of featuredProducts(); track product.id) {
            <div class="product-card">
              <a [routerLink]="['/product', product.slug || product.id]" class="product-image-wrap">
                @if (product.images.length) {
                  <img [src]="product.images[0]" [alt]="product.name" loading="lazy" />
                } @else {
                  <div class="product-placeholder">🥬</div>
                }
              </a>
              <div class="product-info">
                <div class="product-category">{{ product.category?.name || '' }}</div>
                <a [routerLink]="['/product', product.slug || product.id]" class="product-name">{{ product.name }}</a>
                <div class="product-bottom">
                  <div class="product-price">
                    {{ settings.currencySymbol() }}{{ product.basePrice }}
                    @if (product.unit) {
                      <span class="product-unit">/{{ product.unit.shortName }}</span>
                    }
                  </div>
                  <button
                    class="add-btn"
                    (click)="addToCart(product)"
                    [disabled]="!product.isAvailable"
                  >
                    @if (!product.isAvailable) { Out of Stock } @else { + Add }
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      </section>
    }

    <!-- USP Strip -->
    <section class="usp-strip">
      <div class="usp-item">
        <span class="usp-icon">🌱</span>
        <div>
          <strong>100% Fresh</strong>
          <p>Sourced every morning</p>
        </div>
      </div>
      <div class="usp-item">
        <span class="usp-icon">🚀</span>
        <div>
          <strong>Same Day Delivery</strong>
          <p>Order before cutoff</p>
        </div>
      </div>
      <div class="usp-item">
        <span class="usp-icon">💯</span>
        <div>
          <strong>Best Prices</strong>
          <p>No middlemen, fair pricing</p>
        </div>
      </div>
      <div class="usp-item">
        <span class="usp-icon">🔒</span>
        <div>
          <strong>Secure Payments</strong>
          <p>Safe & easy checkout</p>
        </div>
      </div>
    </section>

    <!-- New Arrivals -->
    @if (newProducts().length > 0) {
      <section class="section">
        <div class="section-head">
          <h2>🆕 Just Added</h2>
          <a routerLink="/catalog" class="view-all">View All →</a>
        </div>
        <div class="products-scroll">
          @for (product of newProducts(); track product.id) {
            <div class="product-card">
              <a [routerLink]="['/product', product.slug || product.id]" class="product-image-wrap">
                @if (product.images.length) {
                  <img [src]="product.images[0]" [alt]="product.name" loading="lazy" />
                } @else {
                  <div class="product-placeholder">🍅</div>
                }
                <span class="new-tag">NEW</span>
              </a>
              <div class="product-info">
                <div class="product-category">{{ product.category?.name || '' }}</div>
                <a [routerLink]="['/product', product.slug || product.id]" class="product-name">{{ product.name }}</a>
                <div class="product-bottom">
                  <div class="product-price">
                    {{ settings.currencySymbol() }}{{ product.basePrice }}
                    @if (product.unit) {
                      <span class="product-unit">/{{ product.unit.shortName }}</span>
                    }
                  </div>
                  <button
                    class="add-btn"
                    (click)="addToCart(product)"
                    [disabled]="!product.isAvailable"
                  >
                    @if (!product.isAvailable) { Out of Stock } @else { + Add }
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      </section>
    }

    <!-- Bottom CTA -->
    <section class="bottom-cta">
      <div class="cta-card">
        <div class="cta-emoji">🛒</div>
        <h2>Start shopping fresh today</h2>
        <p>Order now and taste the difference of farm-fresh produce.</p>
        <a routerLink="/catalog" class="btn-white">Browse All Products →</a>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }

    /* Hero */
    .hero {
      background: linear-gradient(160deg, #ecfdf5 0%, #d1fae5 40%, #ffffff 100%);
      padding: 3rem 1.5rem 2.5rem;
      text-align: center;
    }
    .hero-inner { max-width: 560px; margin: 0 auto; }
    .hero-badge {
      display: inline-block;
      padding: 6px 14px;
      background: rgba(22, 163, 74, 0.1);
      border: 1px solid rgba(22, 163, 74, 0.2);
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      color: #15803d;
      margin-bottom: 1rem;
    }
    .hero h1 {
      font-size: 2rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.15;
      margin: 0 0 0.75rem;
      letter-spacing: -0.5px;
    }
    .hero h1 .highlight {
      background: linear-gradient(135deg, #16a34a, #059669);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .hero p {
      font-size: 0.95rem;
      color: #4b5563;
      margin: 0 0 1.5rem;
      line-height: 1.5;
    }
    .hero-actions { margin-bottom: 2rem; }
    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 14px 32px;
      background: linear-gradient(135deg, #16a34a, #15803d);
      color: #fff;
      font-size: 1rem;
      font-weight: 600;
      border-radius: 12px;
      text-decoration: none;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(22, 163, 74, 0.3);
    }
    .hero-stats {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1.5rem;
      padding: 1rem 0 0;
    }
    .stat { display: flex; flex-direction: column; align-items: center; gap: 2px; }
    .stat-value { font-size: 1.25rem; font-weight: 800; color: #0f172a; }
    .stat-label { font-size: 0.7rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500; }
    .stat-divider { width: 1px; height: 32px; background: #d1d5db; }

    /* Delivery Strip */
    .delivery-strip {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 16px;
      background: linear-gradient(135deg, #fefce8, #fef9c3);
      border-bottom: 1px solid #fde68a;
      font-size: 0.85rem;
      font-weight: 500;
      color: #92400e;
    }
    .strip-icon { font-size: 1rem; }

    /* Banners/Offers */
    .banners-section {
      padding: 1.25rem 1rem 0.5rem;
    }
    .banners-scroll {
      display: flex;
      gap: 12px;
      overflow-x: auto;
      padding: 4px 4px 8px;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
    .banners-scroll::-webkit-scrollbar { display: none; }
    .banner-card {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 280px;
      max-width: 320px;
      padding: 16px;
      border-radius: 14px;
      text-decoration: none;
      transition: transform 0.2s, box-shadow 0.2s;
      border: 1px solid rgba(0,0,0,0.04);
    }
    .banner-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0,0,0,0.1);
    }
    .banner-img {
      width: 60px;
      height: 60px;
      border-radius: 12px;
      object-fit: cover;
      flex-shrink: 0;
    }
    .banner-content {
      display: flex;
      flex-direction: column;
      gap: 3px;
      min-width: 0;
    }
    .banner-type {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.8;
    }
    .banner-title {
      font-size: 0.9rem;
      font-weight: 700;
      line-height: 1.2;
    }
    .banner-subtitle {
      font-size: 0.78rem;
      opacity: 0.8;
      line-height: 1.3;
    }

    /* Section */
    .section {
      padding: 2rem 1rem;
    }
    .section-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
      padding: 0 4px;
    }
    .section-head h2 {
      font-size: 1.15rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }
    .view-all {
      font-size: 0.8rem;
      font-weight: 600;
      color: #16a34a;
      text-decoration: none;
    }
    .view-all:hover { text-decoration: underline; }

    /* Category Scroll */
    .category-scroll {
      display: flex;
      gap: 12px;
      overflow-x: auto;
      padding: 4px 4px 8px;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
    .category-scroll::-webkit-scrollbar { display: none; }
    .category-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 88px;
      height: 88px;
      min-width: 88px;
      padding: 12px 8px;
      background: #ffffff;
      border: 1px solid #f3f4f6;
      border-radius: 16px;
      text-decoration: none;
      transition: all 0.2s;
    }
    .category-item:hover {
      border-color: #bbf7d0;
      background: #f0fdf4;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(22, 163, 74, 0.1);
    }
    .category-icon { font-size: 1.75rem; }
    .category-name {
      font-size: 0.68rem;
      font-weight: 600;
      color: #374151;
      text-align: center;
      line-height: 1.2;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      word-break: break-word;
    }

    /* Product Scroll */
    .products-scroll {
      display: flex;
      gap: 12px;
      overflow-x: auto;
      padding: 4px 4px 8px;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
    .products-scroll::-webkit-scrollbar { display: none; }

    /* Product Card */
    .product-card {
      min-width: 160px;
      max-width: 160px;
      background: #fff;
      border-radius: 14px;
      border: 1px solid #f3f4f6;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: all 0.2s;
    }
    .product-card:hover {
      box-shadow: 0 4px 16px rgba(0,0,0,0.08);
      transform: translateY(-2px);
    }
    .product-image-wrap {
      position: relative;
      width: 100%;
      height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f9fafb;
      overflow: hidden;
      text-decoration: none;
    }
    .product-image-wrap img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .product-placeholder {
      font-size: 2.5rem;
      opacity: 0.6;
    }
    .new-tag {
      position: absolute;
      top: 8px;
      left: 8px;
      padding: 2px 8px;
      background: #ef4444;
      color: #fff;
      font-size: 0.6rem;
      font-weight: 700;
      border-radius: 4px;
      letter-spacing: 0.5px;
    }
    .product-info {
      padding: 10px 12px 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
    }
    .product-category {
      font-size: 0.65rem;
      font-weight: 500;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .product-name {
      font-size: 0.85rem;
      font-weight: 600;
      color: #1f2937;
      line-height: 1.3;
      text-decoration: none;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .product-name:hover { color: #16a34a; }
    .product-bottom {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: auto;
      padding-top: 8px;
    }
    .product-price {
      font-size: 0.95rem;
      font-weight: 700;
      color: #0f172a;
    }
    .product-unit {
      font-size: 0.7rem;
      font-weight: 400;
      color: #6b7280;
    }
    .add-btn {
      padding: 6px 12px;
      background: #f0fdf4;
      border: 1.5px solid #22c55e;
      color: #16a34a;
      font-size: 0.75rem;
      font-weight: 700;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .add-btn:hover:not(:disabled) {
      background: #22c55e;
      color: #fff;
    }
    .add-btn:disabled {
      border-color: #d1d5db;
      color: #9ca3af;
      background: #f9fafb;
      cursor: not-allowed;
    }

    /* USP Strip */
    .usp-strip {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      padding: 2rem 1rem;
      background: #f8fafc;
    }
    .usp-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 14px;
      background: #fff;
      border-radius: 12px;
      border: 1px solid #f1f5f9;
    }
    .usp-icon { font-size: 1.5rem; flex-shrink: 0; }
    .usp-item strong { font-size: 0.8rem; color: #1e293b; display: block; }
    .usp-item p { font-size: 0.7rem; color: #64748b; margin: 2px 0 0; }

    /* Bottom CTA */
    .bottom-cta { padding: 2rem 1rem 3rem; }
    .cta-card {
      max-width: 100%;
      margin: 0 auto;
      background: linear-gradient(135deg, #065f46 0%, #047857 50%, #059669 100%);
      border-radius: 20px;
      padding: 2.5rem 2rem;
      text-align: center;
      color: #fff;
    }
    .cta-emoji { font-size: 2.5rem; margin-bottom: 0.75rem; }
    .cta-card h2 { font-size: 1.5rem; font-weight: 700; margin: 0 0 0.6rem; line-height: 1.3; }
    .cta-card p { font-size: 1rem; color: #ffffff; opacity: 1; margin: 0 0 1.5rem; line-height: 1.6; font-weight: 400; letter-spacing: 0.2px; }
    .btn-white {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 14px 32px;
      background: #fff;
      color: #065f46;
      font-size: 1rem;
      font-weight: 600;
      border-radius: 12px;
      text-decoration: none;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .btn-white:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    }

    /* Responsive */
    @media (min-width: 640px) {
      .hero h1 { font-size: 2.75rem; }
      .hero-stats { gap: 2.5rem; }
      .section { padding: 2.5rem 2rem; max-width: 1200px; margin-left: auto; margin-right: auto; }
      .banners-section { padding: 1.5rem 2rem 0.5rem; max-width: 1200px; margin-left: auto; margin-right: auto; }
      .products-scroll { gap: 16px; }
      .product-card { min-width: 180px; max-width: 180px; }
      .category-item { width: 96px; height: 96px; min-width: 96px; padding: 14px 10px; }
      .usp-strip { max-width: 1200px; margin-left: auto; margin-right: auto; grid-template-columns: repeat(4, 1fr); padding: 2.5rem 2rem; }
      .bottom-cta { max-width: 1200px; margin-left: auto; margin-right: auto; }
    }

    @media (min-width: 900px) {
      .hero {
        padding: 4.5rem 2rem 3.5rem;
      }
      .hero-inner { max-width: 700px; }
      .hero h1 { font-size: 3.5rem; letter-spacing: -1px; }
      .hero p { font-size: 1.15rem; max-width: 500px; margin-left: auto; margin-right: auto; }
      .hero-stats { gap: 3rem; padding-top: 1.5rem; }
      .stat-value { font-size: 1.5rem; }
      .stat-divider { height: 40px; }

      .banners-scroll { flex-wrap: wrap; overflow: visible; }
      .banner-card {
        min-width: 0;
        max-width: none;
        flex: 1 1 300px;
        padding: 24px;
        border-radius: 18px;
        gap: 16px;
      }
      .banner-img {
        width: 80px;
        height: 80px;
        border-radius: 14px;
      }
      .banner-type { font-size: 0.72rem; }
      .banner-title { font-size: 1.05rem; }
      .banner-subtitle { font-size: 0.85rem; }

      .category-scroll { flex-wrap: wrap; overflow: visible; justify-content: flex-start; gap: 16px; }
      .category-item { width: 110px; height: 110px; min-width: 110px; flex: 0 0 auto; padding: 16px 12px; border-radius: 18px; }
      .category-icon { font-size: 2.2rem; }
      .category-name { font-size: 0.78rem; }

      .products-scroll {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        overflow: visible;
        gap: 20px;
      }
      .product-card { min-width: 0; max-width: none; }
      .product-image-wrap { height: 160px; }
      .product-info { padding: 12px 14px 14px; }
      .product-name { font-size: 0.9rem; }
      .product-price { font-size: 1rem; }

      .section-head h2 { font-size: 1.35rem; }

      .usp-item { padding: 20px; }
      .usp-icon { font-size: 1.75rem; }
      .usp-item strong { font-size: 0.88rem; }
      .usp-item p { font-size: 0.78rem; }

      .cta-card {
        padding: 4rem 3rem;
        border-radius: 28px;
      }
      .cta-emoji { font-size: 3.5rem; margin-bottom: 1rem; }
      .cta-card h2 { font-size: 2.2rem; margin-bottom: 0.75rem; }
      .cta-card p { font-size: 1.15rem; max-width: 500px; margin-left: auto; margin-right: auto; margin-bottom: 2rem; }
      .btn-white { padding: 16px 40px; font-size: 1.05rem; border-radius: 14px; }
    }

    @media (min-width: 1200px) {
      .hero {
        padding: 5rem 2rem 4rem;
      }
      .hero-inner { max-width: 800px; }
      .hero h1 { font-size: 4rem; }
      .hero p { font-size: 1.2rem; }
      .btn-primary {
        padding: 16px 40px;
        font-size: 1.05rem;
      }

      .section { max-width: 1320px; padding: 3rem 3rem; }
      .banners-section { max-width: 1320px; padding: 2rem 3rem 1rem; }
      .usp-strip { max-width: 1320px; padding: 3rem; gap: 20px; }
      .bottom-cta { max-width: 1320px; padding: 3rem; }

      .products-scroll {
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 24px;
      }
      .product-image-wrap { height: 180px; }
      .product-info { padding: 14px 16px 16px; gap: 6px; }

      .banner-card { padding: 28px; border-radius: 20px; }
      .banner-img { width: 90px; height: 90px; }
      .banner-title { font-size: 1.15rem; }
      .banner-subtitle { font-size: 0.9rem; }

      .cta-card { padding: 5rem 4rem; }
      .cta-emoji { font-size: 4rem; }
      .cta-card h2 { font-size: 2.5rem; }
      .cta-card p { font-size: 1.25rem; }
      .btn-white { padding: 18px 48px; font-size: 1.1rem; }

      .delivery-strip {
        max-width: 1320px;
        margin: 0 auto;
        border-radius: 0;
        font-size: 0.9rem;
      }
    }
  `]
})
export class HomePage implements OnInit {
  private api = inject(ApiService);
  cart = inject(CartService);
  settings = inject(SettingsService);

  categories = signal<Category[]>([]);
  featuredProducts = signal<Product[]>([]);
  newProducts = signal<Product[]>([]);
  banners = signal<Banner[]>([]);

  ngOnInit() {
    this.loadBanners();
    this.loadCategories();
    this.loadFeaturedProducts();
    this.loadNewProducts();
  }

  private loadBanners() {
    this.api.get<any>('/banners').subscribe({
      next: (res) => {
        const items = res.data?.banners || res.data || [];
        this.banners.set(items);
      }
    });
  }

  private loadCategories() {
    this.api.get<any>('/catalog/categories').subscribe({
      next: (res) => {
        const cats = res.data?.categories || res.data || [];
        this.categories.set(cats.slice(0, 8));
      }
    });
  }

  private loadFeaturedProducts() {
    this.api.get<any>('/catalog/products', { isFeatured: 'true', limit: '10' }).subscribe({
      next: (res) => {
        const products = res.data?.products || res.data || [];
        this.featuredProducts.set(products);
      }
    });
  }

  private loadNewProducts() {
    this.api.get<any>('/catalog/products', { sort: '-createdAt', limit: '8' }).subscribe({
      next: (res) => {
        const products = res.data?.products || res.data || [];
        this.newProducts.set(products);
      }
    });
  }

  addToCart(product: Product) {
    this.cart.addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      basePrice: product.basePrice,
      unit: product.unit ? { shortName: product.unit.shortName } : undefined,
    });
  }
}
