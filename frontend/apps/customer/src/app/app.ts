import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@frontend/shared-data-access';
import { CartService } from './services/cart.service';
import { SettingsService } from './services/settings.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule],
  template: `
    <!-- Header -->
    <header class="app-header">
      <a routerLink="/" class="header-brand" aria-label="Go to home page">
        <span class="brand-name">{{ settings.businessName() }}</span>
      </a>
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
    .app-header {
      position: sticky;
      top: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: var(--header-height, 56px);
      padding: 0 16px;
      background: #ffffff;
      border-bottom: 1px solid var(--gray-100, #f3f4f6);
    }

    .header-brand {
      display: flex;
      align-items: center;
      text-decoration: none;
      cursor: pointer;
    }

    .brand-name {
      font-size: 20px;
      font-weight: 700;
      color: var(--gray-800, #1f2937);
      letter-spacing: -0.3px;
    }

    .brand-accent {
      color: var(--primary, #10b981);
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
      border-radius: 50%;
      color: var(--gray-600, #4b5563);
      transition: background 150ms ease, color 150ms ease;

      &:hover {
        background: var(--gray-100, #f3f4f6);
        color: var(--gray-800, #1f2937);
      }
    }

    .header-avatar {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: var(--primary-light, #ecfdf5);
      color: var(--primary, #10b981);
      transition: background 150ms ease;

      &:hover {
        background: var(--primary, #10b981);
        color: #ffffff;
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
  `]
})
export class App {
  private router = inject(Router);
  auth = inject(AuthService);
  cart = inject(CartService);
  settings = inject(SettingsService);

  navigateToProfile() {
    this.router.navigate(['/profile']);
  }
}
