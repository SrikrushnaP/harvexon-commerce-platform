import { Component, HostListener, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@frontend/shared-data-access';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="admin-layout">
      <!-- Sidebar -->
      <aside class="sidebar">
        <a routerLink="/dashboard" class="sidebar-brand" aria-label="Go to dashboard">
          <div class="brand-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div class="brand-text">
            <span class="brand-name">HCP Admin</span>
            <span class="brand-sub">Management Portal</span>
          </div>
        </a>

        <nav class="sidebar-nav">
          <div class="nav-section-label">Main</div>
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
            <span>Dashboard</span>
          </a>
          <a routerLink="/orders" routerLinkActive="active" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            <span>Orders</span>
          </a>

          <div class="nav-section-label">Catalog</div>
          <a routerLink="/catalog" routerLinkActive="active" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
            <span>Catalog</span>
          </a>
          <a routerLink="/inventory" routerLinkActive="active" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
              <line x1="9" y1="12" x2="15" y2="12"/>
              <line x1="9" y1="16" x2="15" y2="16"/>
            </svg>
            <span>Inventory</span>
          </a>

          <div class="nav-section-label">People</div>
          <a routerLink="/customers" routerLinkActive="active" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87"/>
              <path d="M16 3.13a4 4 0 010 7.75"/>
            </svg>
            <span>Customers</span>
          </a>
          <a routerLink="/delivery" routerLinkActive="active" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="1" y="3" width="15" height="13" rx="2"/>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
              <circle cx="5.5" cy="18.5" r="2.5"/>
              <circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
            <span>Delivery</span>
          </a>

          <div class="nav-section-label">Operations</div>
          <a routerLink="/purchasing" routerLinkActive="active" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span>Purchasing</span>
          </a>
          <a routerLink="/coupons" routerLinkActive="active" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
              <line x1="7" y1="7" x2="7.01" y2="7"/>
            </svg>
            <span>Coupons</span>
          </a>
          <a routerLink="/banners" routerLinkActive="active" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
            <span>Banners</span>
          </a>
          <a routerLink="/settings" routerLinkActive="active" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
            <span>Settings</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <div class="user-profile">
            <div class="user-avatar">
              {{ auth.user()?.name?.charAt(0)?.toUpperCase() || 'A' }}
            </div>
            <div class="user-details">
              <span class="user-name">{{ auth.user()?.name || 'Admin' }}</span>
              <span class="user-role">Administrator</span>
            </div>
          </div>
          <button (click)="auth.logout()" class="logout-btn" title="Logout">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </aside>

      <!-- Main Content Area -->
      <div class="main-wrapper">
        <!-- Top Header -->
        <header class="top-header">
          <div class="header-left">
            <div class="breadcrumb">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <span class="breadcrumb-separator">/</span>
              <span class="breadcrumb-current">Admin Panel</span>
            </div>
          </div>
          <div class="header-right">
            <div class="search-box">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input type="text" placeholder="Search..." class="search-input" />
            </div>
            <button class="header-icon-btn notification-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
              <span class="notification-dot"></span>
            </button>
            <div class="header-user-trigger" (click)="toggleUserMenu()">
              <div class="header-avatar">
                {{ auth.user()?.name?.charAt(0)?.toUpperCase() || 'A' }}
              </div>
              @if (showUserMenu()) {
                <div class="user-dropdown">
                  <div class="dropdown-header">
                    <div class="dropdown-avatar">
                      {{ auth.user()?.name?.charAt(0)?.toUpperCase() || 'A' }}
                    </div>
                    <div class="dropdown-user-info">
                      <span class="dropdown-user-name">{{ auth.user()?.name || 'Admin' }}</span>
                      <span class="dropdown-user-role">Administrator</span>
                    </div>
                  </div>
                  <div class="dropdown-divider"></div>
                  <a routerLink="/dashboard" class="dropdown-item" (click)="showUserMenu.set(false)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="3" width="7" height="7" rx="1"/>
                      <rect x="14" y="3" width="7" height="7" rx="1"/>
                      <rect x="3" y="14" width="7" height="7" rx="1"/>
                      <rect x="14" y="14" width="7" height="7" rx="1"/>
                    </svg>
                    <span>Dashboard</span>
                  </a>
                  <a routerLink="/settings" class="dropdown-item" (click)="showUserMenu.set(false)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
                    </svg>
                    <span>Settings</span>
                  </a>
                  <div class="dropdown-divider"></div>
                  <button class="dropdown-item dropdown-logout" (click)="logout()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    <span>Logout</span>
                  </button>
                </div>
              }
            </div>
          </div>
        </header>

        <!-- Page Content -->
        <main class="page-content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    .admin-layout {
      display: flex;
      height: 100vh;
      overflow: hidden;
    }

    /* --- Sidebar --- */
    .sidebar {
      width: var(--sidebar-width, 260px);
      background: var(--sidebar-bg, linear-gradient(180deg, #1e293b 0%, #0f172a 100%));
      display: flex;
      flex-direction: column;
      z-index: var(--z-sidebar, 40);
      position: relative;
      overflow: hidden;

      &::after {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        width: 1px;
        height: 100%;
        background: linear-gradient(180deg, transparent, rgba(148, 163, 184, 0.1), transparent);
      }
    }

    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid rgba(51, 65, 85, 0.4);
      text-decoration: none;
      cursor: pointer;
      transition: background 200ms ease;

      &:hover {
        background: rgba(51, 65, 85, 0.3);
      }
    }

    .brand-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: linear-gradient(135deg, #10b981, #059669);
      color: #fff;

      svg {
        width: 20px;
        height: 20px;
      }
    }

    .brand-text {
      display: flex;
      flex-direction: column;
    }

    .brand-name {
      font-size: 1rem;
      font-weight: 700;
      color: #f8fafc;
      letter-spacing: -0.01em;
    }

    .brand-sub {
      font-size: 0.6875rem;
      color: #64748b;
      margin-top: 1px;
    }

    .sidebar-nav {
      flex: 1;
      overflow-y: auto;
      padding: 0.75rem 0;
    }

    .nav-section-label {
      padding: 1rem 1.5rem 0.4rem;
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #475569;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.6rem 1.5rem;
      margin: 1px 0.5rem;
      border-radius: 6px;
      color: #94a3b8;
      font-size: 0.875rem;
      font-weight: 450;
      text-decoration: none;
      transition: all 200ms ease;
      position: relative;

      svg {
        flex-shrink: 0;
        opacity: 0.7;
        transition: opacity 200ms ease;
      }

      &:hover {
        color: #e2e8f0;
        background: rgba(51, 65, 85, 0.4);

        svg { opacity: 1; }
      }

      &.active {
        color: #ffffff;
        background: rgba(16, 185, 129, 0.12);
        border-left: 3px solid #10b981;
        padding-left: calc(1.5rem - 3px);

        svg {
          opacity: 1;
          color: #10b981;
        }
      }
    }

    .sidebar-footer {
      padding: 1rem 1.25rem;
      border-top: 1px solid rgba(51, 65, 85, 0.4);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      min-width: 0;
    }

    .user-avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: linear-gradient(135deg, #10b981, #059669);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 0.8125rem;
      font-weight: 600;
      flex-shrink: 0;
    }

    .user-details {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .user-name {
      font-size: 0.8125rem;
      font-weight: 500;
      color: #e2e8f0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .user-role {
      font-size: 0.6875rem;
      color: #64748b;
    }

    .logout-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 6px;
      border: none;
      background: transparent;
      color: #64748b;
      cursor: pointer;
      transition: all 200ms ease;

      &:hover {
        background: rgba(239, 68, 68, 0.12);
        color: #f87171;
      }
    }

    /* --- Main Content Wrapper --- */
    .main-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: var(--content-bg, #f9fafb);
    }

    /* --- Top Header --- */
    .top-header {
      height: var(--header-height, 64px);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 2rem;
      background: #ffffff;
      border-bottom: 1px solid #f1f5f9;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
      z-index: var(--z-header, 30);
      flex-shrink: 0;
    }

    .header-left {
      display: flex;
      align-items: center;
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #94a3b8;
      font-size: 0.875rem;

      svg { color: #94a3b8; }
    }

    .breadcrumb-separator {
      color: #d1d5db;
    }

    .breadcrumb-current {
      color: #374151;
      font-weight: 500;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 0.4rem 0.75rem;
      transition: all 200ms ease;

      svg { color: #9ca3af; flex-shrink: 0; }

      &:focus-within {
        border-color: #10b981;
        background: #fff;
        box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.08);
      }
    }

    .search-input {
      border: none;
      background: transparent;
      outline: none;
      font-size: 0.8125rem;
      color: #374151;
      width: 180px;

      &::placeholder {
        color: #9ca3af;
      }
    }

    .header-icon-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 8px;
      border: none;
      background: transparent;
      color: #6b7280;
      cursor: pointer;
      position: relative;
      transition: all 150ms ease;

      &:hover {
        background: #f3f4f6;
        color: #374151;
      }
    }

    .notification-dot {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #ef4444;
      border: 2px solid #ffffff;
    }

    .header-user-trigger {
      cursor: pointer;
      margin-left: 0.25rem;
      position: relative;
    }

    .header-avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: linear-gradient(135deg, #10b981, #059669);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 0.8125rem;
      font-weight: 600;
      transition: box-shadow 150ms ease;

      &:hover {
        box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
      }
    }

    /* --- User Dropdown --- */
    .user-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      width: 240px;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04);
      z-index: 100;
      overflow: hidden;
      animation: dropdownFadeIn 150ms ease;
    }

    @keyframes dropdownFadeIn {
      from {
        opacity: 0;
        transform: translateY(-4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .dropdown-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
    }

    .dropdown-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: linear-gradient(135deg, #10b981, #059669);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 0.875rem;
      font-weight: 600;
      flex-shrink: 0;
    }

    .dropdown-user-info {
      display: flex;
      flex-direction: column;
    }

    .dropdown-user-name {
      font-size: 0.875rem;
      font-weight: 600;
      color: #1f2937;
    }

    .dropdown-user-role {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .dropdown-divider {
      height: 1px;
      background: #f3f4f6;
      margin: 0;
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem 1rem;
      font-size: 0.8125rem;
      color: #374151;
      text-decoration: none;
      border: none;
      background: transparent;
      width: 100%;
      cursor: pointer;
      transition: background 150ms ease;

      svg {
        color: #6b7280;
        flex-shrink: 0;
      }

      &:hover {
        background: #f9fafb;
      }
    }

    .dropdown-logout {
      color: #dc2626;

      svg {
        color: #dc2626;
      }

      &:hover {
        background: #fef2f2;
      }
    }

    /* --- Page Content --- */
    .page-content {
      flex: 1;
      overflow-y: auto;
      padding: 2rem;
    }

    /* --- Responsive --- */
    @media (max-width: 1024px) {
      .search-input {
        width: 140px;
      }
    }

    @media (max-width: 768px) {
      .sidebar {
        position: fixed;
        left: -260px;
        transition: left 300ms ease;
      }

      .top-header {
        padding: 0 1rem;
      }

      .page-content {
        padding: 1.25rem;
      }

      .search-box {
        display: none;
      }
    }
  `],
})
export class LayoutComponent {
  auth = inject(AuthService);
  private router = inject(Router);
  showUserMenu = signal(false);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.header-user-trigger')) {
      this.showUserMenu.set(false);
    }
  }

  toggleUserMenu() {
    this.showUserMenu.update(v => !v);
  }

  logout() {
    this.showUserMenu.set(false);
    this.auth.logout();
  }
}
