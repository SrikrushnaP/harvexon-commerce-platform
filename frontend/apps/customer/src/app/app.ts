import { Component, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@frontend/shared-data-access';
import { CartService } from './services/cart.service';
import { SettingsService } from './services/settings.service';
import { PincodeService } from './services/pincode.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule],
  template: `
    <!-- Header -->
    <div class="header-wrapper">
      <header class="app-header">
        <a routerLink="/" class="header-brand" aria-label="Go to home page">
          <span class="brand-name">{{ settings.businessName() }}</span>
        </a>

        <!-- Desktop Navigation -->
        <nav class="desktop-nav" aria-label="Main navigation">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" class="desktop-nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Home
          </a>
          <a routerLink="/catalog" routerLinkActive="active" class="desktop-nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/>
            </svg>
            Catalog
          </a>
          <a routerLink="/cart" routerLinkActive="active" class="desktop-nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            Cart
            @if (cart.cartCount() > 0) {
              <span class="desktop-cart-badge">{{ cart.cartCount() }}</span>
            }
          </a>
          <a routerLink="/orders" routerLinkActive="active" class="desktop-nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            Orders
          </a>
        </nav>

        <!-- Pincode Selector -->
        <button class="pincode-trigger" (click)="togglePincodeDropdown()" aria-label="Change delivery pincode">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          @if (pincodeService.pincode()) {
            <span class="pincode-text">{{ pincodeService.pincode() }}</span>
            @if (pincodeService.isServiceable() === true) {
              <span class="pincode-status ok">✓</span>
            } @else if (pincodeService.isServiceable() === false) {
              <span class="pincode-status fail">✗</span>
            }
          } @else {
            <span class="pincode-text placeholder">Enter pincode</span>
          }
          <svg class="chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        <div class="header-actions">
          <button class="header-icon-btn" aria-label="Notifications">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </button>
          <button class="header-avatar" aria-label="Profile" (click)="navigateToProfile()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </button>
        </div>
      </header>
    </div>

    <!-- Pincode Dropdown -->
    @if (showPincodeDropdown()) {
      <div class="pincode-overlay" (click)="closePincodeDropdown()"></div>
      <div class="pincode-dropdown">
        <div class="dropdown-title">Delivery Pincode</div>
        <div class="dropdown-input-row">
          <input
            type="text"
            placeholder="Enter 6-digit pincode"
            maxlength="10"
            [value]="pincodeInputVal()"
            (input)="pincodeInputVal.set($any($event.target).value)"
            (keydown.enter)="applyPincode()"
            autofocus
          />
          <button (click)="applyPincode()" class="apply-btn">Apply</button>
        </div>
        @if (pincodeService.pincode() && pincodeService.isServiceable() === true) {
          <div class="dropdown-result success">✅ We deliver to {{ pincodeService.pincode() }}</div>
        }
        @if (pincodeService.pincode() && pincodeService.isServiceable() === false) {
          <div class="dropdown-result fail">😔 Sorry, we don't deliver to {{ pincodeService.pincode() }} yet</div>
        }
        @if (pincodeService.pincode()) {
          <button class="clear-link" (click)="clearPincode()">Clear pincode</button>
        }
      </div>
    }

    <!-- Not Serviceable Banner -->
    @if (pincodeService.pincode() && pincodeService.isServiceable() === false) {
      <div class="not-serviceable-banner">
        <span>⚠️ Delivery not available at <strong>{{ pincodeService.pincode() }}</strong>.</span>
        <button (click)="togglePincodeDropdown()">Change</button>
      </div>
    }

    <!-- Main Content -->
    <main class="app-content">
      <router-outlet />
    </main>

    <!-- Bottom Navigation -->
    <nav class="bottom-nav" aria-label="Main navigation">
      <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" class="nav-item" aria-label="Home">
        <span class="nav-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </span>
        <span class="nav-label">Home</span>
      </a>

      <a routerLink="/catalog" routerLinkActive="active" class="nav-item" aria-label="Catalog">
        <span class="nav-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/>
          </svg>
        </span>
        <span class="nav-label">Catalog</span>
      </a>

      <a routerLink="/cart" routerLinkActive="active" class="nav-item" aria-label="Cart">
        <span class="nav-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          @if (cart.cartCount() > 0) {
            <span class="cart-badge">{{ cart.cartCount() }}</span>
          }
        </span>
        <span class="nav-label">Cart</span>
      </a>

      <a routerLink="/orders" routerLinkActive="active" class="nav-item" aria-label="Orders">
        <span class="nav-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        </span>
        <span class="nav-label">Orders</span>
      </a>

      <a routerLink="/profile" routerLinkActive="active" class="nav-item" aria-label="Profile">
        <span class="nav-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </span>
        <span class="nav-label">Profile</span>
      </a>
    </nav>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      min-height: 100dvh;
    }

    /* --- Header --- */
    .header-wrapper {
      position: sticky;
      top: 0;
      z-index: 100;
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    }

    .app-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: var(--header-height, 56px);
      padding: 0 16px;
    }

    .header-brand {
      display: flex;
      align-items: center;
      text-decoration: none;
      cursor: pointer;
    }

    .brand-name {
      font-size: 20px;
      font-weight: 800;
      color: var(--gray-800, #1f2937);
      letter-spacing: -0.5px;
    }

    .brand-accent {
      color: var(--primary, #10b981);
    }

    /* --- Desktop Nav (hidden on mobile) --- */
    .desktop-nav {
      display: none;
      align-items: center;
      gap: 2px;
      padding: 4px;
      background: var(--gray-50, #f8fafc);
      border-radius: 12px;
      border: 1px solid rgba(0, 0, 0, 0.04);
    }

    .desktop-nav-item {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 9px 18px;
      border-radius: 9px;
      text-decoration: none;
      color: var(--gray-500, #6b7280);
      font-size: 13.5px;
      font-weight: 500;
      transition: all 180ms ease;
      position: relative;

      svg { flex-shrink: 0; opacity: 0.7; transition: opacity 180ms; }

      &:hover {
        color: var(--gray-800, #1f2937);
        background: #ffffff;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
        svg { opacity: 1; }
      }

      &.active {
        color: #ffffff;
        background: linear-gradient(135deg, #10b981, #059669);
        font-weight: 600;
        box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
        svg { opacity: 1; stroke: #ffffff; }
      }
    }

    .desktop-cart-badge {
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--error, #ef4444);
      color: #ffffff;
      font-size: 10px;
      font-weight: 700;
      line-height: 1;
      border-radius: 9999px;
      box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .header-icon-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 38px;
      height: 38px;
      border-radius: 10px;
      color: var(--gray-600, #4b5563);
      transition: all 150ms ease;

      &:hover {
        background: var(--gray-100, #f3f4f6);
        color: var(--gray-800, #1f2937);
        transform: translateY(-1px);
      }
    }

    .header-avatar {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, #ecfdf5, #d1fae5);
      color: var(--primary, #10b981);
      transition: all 150ms ease;

      &:hover {
        background: linear-gradient(135deg, #10b981, #059669);
        color: #ffffff;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      }
    }

    /* --- Main Content --- */
    .app-content {
      flex: 1;
      padding-bottom: calc(var(--bottom-nav-height, 64px) + env(safe-area-inset-bottom, 0px));
    }

    /* --- Bottom Navigation --- */
    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: space-around;
      height: var(--bottom-nav-height, 64px);
      padding-bottom: env(safe-area-inset-bottom, 0px);
      background: #ffffff;
      border-top: 1px solid var(--gray-100, #f3f4f6);
      box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.04);
    }

    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      padding: 6px 12px;
      text-decoration: none;
      color: var(--gray-400, #9ca3af);
      transition: color 200ms ease;
      -webkit-tap-highlight-color: transparent;

      .nav-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        position: relative;
        transition: background 200ms ease, color 200ms ease;
      }

      .nav-label {
        font-size: 11px;
        font-weight: 500;
        line-height: 1;
        margin-top: 1px;
      }

      &.active {
        color: var(--primary, #10b981);

        .nav-icon {
          background: var(--primary, #10b981);
          color: #ffffff;

          svg {
            stroke: #ffffff;
          }
        }

        .nav-label {
          font-weight: 600;
          color: var(--primary, #10b981);
        }
      }
    }

    /* --- Cart Badge --- */
    .cart-badge {
      position: absolute;
      top: 2px;
      right: 2px;
      min-width: 16px;
      height: 16px;
      padding: 0 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--error, #ef4444);
      color: #ffffff;
      font-size: 10px;
      font-weight: 700;
      line-height: 1;
      border-radius: 9999px;
      border: 2px solid #ffffff;
    }

    /* --- Pincode Trigger --- */
    .pincode-trigger {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 6px 10px;
      border-radius: 20px;
      background: var(--gray-50, #f9fafb);
      border: 1px solid var(--gray-200, #e5e7eb);
      color: var(--gray-700, #374151);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 150ms ease;
      max-width: 150px;
      overflow: hidden;
    }

    .pincode-trigger:hover {
      background: var(--primary-light, #ecfdf5);
      border-color: var(--primary, #10b981);
    }

    .pincode-text {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .pincode-text.placeholder {
      color: var(--gray-400, #9ca3af);
    }

    .pincode-status {
      font-size: 11px;
      font-weight: 700;
    }

    .pincode-status.ok {
      color: #16a34a;
    }

    .pincode-status.fail {
      color: #dc2626;
    }

    .chevron {
      flex-shrink: 0;
      color: var(--gray-400, #9ca3af);
    }

    /* --- Pincode Dropdown --- */
    .pincode-overlay {
      position: fixed;
      inset: 0;
      z-index: 199;
      background: rgba(0, 0, 0, 0.25);
    }

    .pincode-dropdown {
      position: fixed;
      top: var(--header-height, 56px);
      left: 50%;
      transform: translateX(-50%);
      z-index: 200;
      width: calc(100% - 32px);
      max-width: 360px;
      background: #ffffff;
      border-radius: 14px;
      padding: 18px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
      animation: dropIn 0.2s ease;
    }

    @keyframes dropIn {
      from { opacity: 0; transform: translateX(-50%) translateY(-8px); }
      to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }

    .dropdown-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 12px;
    }

    .dropdown-input-row {
      display: flex;
      gap: 8px;
    }

    .dropdown-input-row input {
      flex: 1;
      padding: 10px 14px;
      border: 1.5px solid #e5e7eb;
      border-radius: 10px;
      font-size: 0.9rem;
      outline: none;
      font-family: inherit;
    }

    .dropdown-input-row input:focus {
      border-color: #22c55e;
      box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
    }

    .apply-btn {
      padding: 10px 18px;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: white;
      border: none;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      white-space: nowrap;
    }

    .apply-btn:hover {
      background: linear-gradient(135deg, #16a34a, #15803d);
    }

    .dropdown-result {
      margin-top: 12px;
      padding: 10px 12px;
      border-radius: 8px;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .dropdown-result.success {
      background: #f0fdf4;
      color: #166534;
      border: 1px solid #bbf7d0;
    }

    .dropdown-result.fail {
      background: #fef2f2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }

    .clear-link {
      display: block;
      margin-top: 10px;
      background: none;
      border: none;
      color: #6b7280;
      font-size: 0.8rem;
      cursor: pointer;
      text-decoration: underline;
      padding: 0;
    }

    .clear-link:hover {
      color: #dc2626;
    }

    /* --- Not Serviceable Banner --- */
    .not-serviceable-banner {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 8px 16px;
      background: #fffbeb;
      border-bottom: 1px solid #fde68a;
      font-size: 0.8rem;
      color: #92400e;
    }

    .not-serviceable-banner strong {
      font-weight: 600;
    }

    .not-serviceable-banner button {
      background: none;
      border: 1px solid #f59e0b;
      color: #d97706;
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
    }

    .not-serviceable-banner button:hover {
      background: #fef3c7;
    }

    /* =======================
       DESKTOP LAYOUT (768px+)
       ======================= */
    @media (min-width: 768px) {
      .header-wrapper {
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
      }

      .app-header {
        height: 68px;
        padding: 0 32px;
        max-width: 1400px;
        margin: 0 auto;
        width: 100%;
        gap: 24px;
      }

      :host {
        --header-height: 68px;
      }

      .brand-name {
        font-size: 22px;
        font-weight: 800;
      }

      .desktop-nav {
        display: flex;
      }

      .pincode-trigger {
        max-width: 180px;
        padding: 8px 14px;
        font-size: 13px;
        border-radius: 10px;
      }

      .header-actions {
        gap: 10px;
      }

      .header-icon-btn {
        width: 40px;
        height: 40px;
      }

      .header-avatar {
        width: 38px;
        height: 38px;
      }

      /* Hide bottom nav on desktop */
      .bottom-nav {
        display: none;
      }

      /* Remove bottom padding since no bottom nav */
      .app-content {
        padding-bottom: 0;
      }
    }

    /* Wide desktop - constrain header with full-width background */
    @media (min-width: 1024px) {
      .app-header {
        padding: 0 48px;
      }
    }
  `]
})
export class App {
  private router = inject(Router);
  auth = inject(AuthService);
  cart = inject(CartService);
  settings = inject(SettingsService);
  pincodeService = inject(PincodeService);

  showPincodeDropdown = signal(false);
  pincodeInputVal = signal('');

  navigateToProfile() {
    this.router.navigate(['/profile']);
  }

  togglePincodeDropdown() {
    const current = this.showPincodeDropdown();
    if (!current) {
      this.pincodeInputVal.set(this.pincodeService.pincode());
    }
    this.showPincodeDropdown.set(!current);
  }

  closePincodeDropdown() {
    this.showPincodeDropdown.set(false);
  }

  applyPincode() {
    const pin = this.pincodeInputVal().trim();
    if (!pin || pin.length < 4) return;
    this.pincodeService.setPincode(pin);
    this.showPincodeDropdown.set(false);
  }

  clearPincode() {
    this.pincodeService.clearPincode();
    this.pincodeInputVal.set('');
    this.showPincodeDropdown.set(false);
  }
}
