import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { ApiService } from '@frontend/shared-data-access';
import { forkJoin } from 'rxjs';

interface DashboardStats {
  totalOrders: number;
  ordersByStatus: Record<string, number>;
  totalCustomers: number;
  totalProducts: number;
  lowStockCount: number;
  totalSuppliers: number;
  deliveryStaff: number;
  recentOrders: Array<{
    orderNumber: string;
    customer: { name: string };
    total: number;
    status: string;
    createdAt: string;
  }>;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterModule, DatePipe, CurrencyPipe],
  template: `
    <!-- Welcome Banner -->
    <div class="welcome-banner">
      <div class="welcome-content">
        <h1 class="welcome-title">Welcome back, Admin</h1>
        <p class="welcome-subtitle">Here's what's happening with your store today.</p>
      </div>
      <div class="welcome-decoration">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" opacity="0.15">
          <circle cx="60" cy="60" r="50" stroke="white" stroke-width="2"/>
          <circle cx="60" cy="60" r="35" stroke="white" stroke-width="2"/>
          <circle cx="60" cy="60" r="20" stroke="white" stroke-width="2"/>
        </svg>
      </div>
    </div>

    @if (loading()) {
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <span>Loading dashboard data...</span>
      </div>
    } @else {
      <!-- Stats Grid -->
      <div class="stats-grid">
        <a routerLink="/orders" class="stat-card">
          <div class="stat-icon-wrap orders-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
          </div>
          <div class="stat-body">
            <span class="stat-value">{{ stats().totalOrders }}</span>
            <span class="stat-label">Total Orders</span>
          </div>
          <div class="stat-trend trend-up">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
              <polyline points="17 6 23 6 23 12"/>
            </svg>
          </div>
        </a>

        <a routerLink="/customers" class="stat-card">
          <div class="stat-icon-wrap customers-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87"/>
              <path d="M16 3.13a4 4 0 010 7.75"/>
            </svg>
          </div>
          <div class="stat-body">
            <span class="stat-value">{{ stats().totalCustomers }}</span>
            <span class="stat-label">Customers</span>
          </div>
          <div class="stat-trend trend-up">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
              <polyline points="17 6 23 6 23 12"/>
            </svg>
          </div>
        </a>

        <a routerLink="/catalog" class="stat-card">
          <div class="stat-icon-wrap products-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
          </div>
          <div class="stat-body">
            <span class="stat-value">{{ stats().totalProducts }}</span>
            <span class="stat-label">Products</span>
          </div>
          <div class="stat-trend trend-neutral">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </div>
        </a>

        <a routerLink="/inventory" class="stat-card" [class.alert-card]="stats().lowStockCount > 0">
          <div class="stat-icon-wrap" [class.alert-icon]="stats().lowStockCount > 0" [class.inventory-icon]="stats().lowStockCount === 0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div class="stat-body">
            <span class="stat-value">{{ stats().lowStockCount }}</span>
            <span class="stat-label">Low Stock Items</span>
          </div>
          @if (stats().lowStockCount > 0) {
            <div class="stat-trend trend-down">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
                <polyline points="17 18 23 18 23 12"/>
              </svg>
            </div>
          }
        </a>

        <a routerLink="/purchasing" class="stat-card">
          <div class="stat-icon-wrap suppliers-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="1" y="3" width="15" height="13" rx="2"/>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
              <circle cx="5.5" cy="18.5" r="2.5"/>
              <circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
          </div>
          <div class="stat-body">
            <span class="stat-value">{{ stats().totalSuppliers }}</span>
            <span class="stat-label">Suppliers</span>
          </div>
          <div class="stat-trend trend-neutral">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </div>
        </a>

        <a routerLink="/delivery" class="stat-card">
          <div class="stat-icon-wrap delivery-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div class="stat-body">
            <span class="stat-value">{{ stats().deliveryStaff }}</span>
            <span class="stat-label">Delivery Staff</span>
          </div>
          <div class="stat-trend trend-up">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
              <polyline points="17 6 23 6 23 12"/>
            </svg>
          </div>
        </a>
      </div>

      <!-- Content Grid -->
      <div class="content-grid">
        <!-- Order Status Breakdown -->
        <div class="panel status-panel">
          <div class="panel-header">
            <h2 class="panel-title">Order Status</h2>
            <a routerLink="/orders" class="panel-action">View all</a>
          </div>
          <div class="status-bars">
            @for (entry of orderStatusEntries(); track entry.status) {
              <div class="status-bar-row">
                <div class="status-bar-info">
                  <span class="status-badge" [attr.data-status]="entry.status">{{ entry.status }}</span>
                  <span class="status-count">{{ entry.count }}</span>
                </div>
                <div class="status-bar-track">
                  <div class="status-bar-fill" [attr.data-status]="entry.status" [style.width.%]="getStatusPercent(entry.count)"></div>
                </div>
              </div>
            }
            @if (orderStatusEntries().length === 0) {
              <div class="empty-panel">
                <p>No order data available</p>
              </div>
            }
          </div>
        </div>

        <!-- Recent Orders Table -->
        <div class="panel orders-panel">
          <div class="panel-header">
            <h2 class="panel-title">Recent Orders</h2>
            <a routerLink="/orders" class="panel-action">View all</a>
          </div>
          <div class="table-container">
            <table class="orders-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                @for (order of stats().recentOrders; track order.orderNumber) {
                  <tr>
                    <td class="order-number-cell">{{ order.orderNumber }}</td>
                    <td class="customer-cell">{{ order.customer ? order.customer.name : 'Unknown' }}</td>
                    <td class="amount-cell">{{ order.total | currency:'INR':'symbol':'1.0-0' }}</td>
                    <td>
                      <span class="status-badge" [attr.data-status]="order.status">{{ order.status }}</span>
                    </td>
                    <td class="date-cell">{{ order.createdAt | date:'mediumDate' }}</td>
                  </tr>
                }
                @if (stats().recentOrders.length === 0) {
                  <tr>
                    <td colspan="5" class="empty-table">No orders yet</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
      animation: fadeInUp 0.4s ease;
    }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Welcome Banner */
    .welcome-banner {
      background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%);
      border-radius: 16px;
      padding: 2rem 2.5rem;
      margin-bottom: 1.75rem;
      position: relative;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
    }

    .welcome-content {
      position: relative;
      z-index: 1;
    }

    .welcome-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #fff;
      margin: 0 0 0.375rem;
    }

    .welcome-subtitle {
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.8);
      margin: 0;
    }

    .welcome-decoration {
      position: absolute;
      right: 2rem;
      top: 50%;
      transform: translateY(-50%);
    }

    /* Loading State */
    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 4rem;
      color: #6b7280;
      font-size: 0.9rem;
    }

    .loading-spinner {
      width: 20px;
      height: 20px;
      border: 2.5px solid #e5e7eb;
      border-top-color: #10b981;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.75rem;
    }

    .stat-card {
      background: #ffffff;
      border: 1px solid #f1f5f9;
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      text-decoration: none;
      transition: all 200ms ease;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      position: relative;
      overflow: hidden;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
        border-color: #e2e8f0;
      }

      &.alert-card {
        border-color: #fecaca;
        background: #fffbfb;
      }
    }

    .stat-icon-wrap {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .orders-icon { background: #dbeafe; color: #2563eb; }
    .customers-icon { background: #ede9fe; color: #7c3aed; }
    .products-icon { background: #d1fae5; color: #059669; }
    .inventory-icon { background: #fef3c7; color: #d97706; }
    .alert-icon { background: #fee2e2; color: #dc2626; }
    .suppliers-icon { background: #cffafe; color: #0891b2; }
    .delivery-icon { background: #fce7f3; color: #db2777; }

    .stat-body {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
    }

    .stat-value {
      font-size: 1.625rem;
      font-weight: 700;
      color: #111827;
      line-height: 1.2;
    }

    .stat-label {
      font-size: 0.75rem;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      font-weight: 500;
      margin-top: 0.15rem;
    }

    .stat-trend {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .trend-up { background: #dcfce7; color: #16a34a; }
    .trend-down { background: #fee2e2; color: #dc2626; }
    .trend-neutral { background: #f3f4f6; color: #6b7280; }

    /* Content Grid */
    .content-grid {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 1.5rem;
    }

    @media (max-width: 1024px) {
      .content-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 640px) {
      .stats-grid {
        grid-template-columns: 1fr 1fr;
      }

      .welcome-banner {
        padding: 1.5rem;
      }

      .welcome-decoration {
        display: none;
      }
    }

    /* Panels */
    .panel {
      background: #ffffff;
      border: 1px solid #f1f5f9;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      overflow: hidden;
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .panel-title {
      font-size: 0.9375rem;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }

    .panel-action {
      font-size: 0.8125rem;
      color: #10b981;
      font-weight: 500;
      text-decoration: none;
      transition: color 150ms ease;

      &:hover {
        color: #059669;
      }
    }

    /* Status Bars */
    .status-bars {
      padding: 1.25rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .status-bar-row {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .status-bar-info {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .status-count {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #374151;
    }

    .status-bar-track {
      height: 6px;
      background: #f3f4f6;
      border-radius: 99px;
      overflow: hidden;
    }

    .status-bar-fill {
      height: 100%;
      border-radius: 99px;
      transition: width 600ms ease;
      min-width: 4px;

      &[data-status="draft"] { background: #94a3b8; }
      &[data-status="confirmed"] { background: #3b82f6; }
      &[data-status="processing"] { background: #f59e0b; }
      &[data-status="packed"] { background: #6366f1; }
      &[data-status="assigned"] { background: #8b5cf6; }
      &[data-status="out_for_delivery"] { background: #06b6d4; }
      &[data-status="delivered"] { background: #10b981; }
      &[data-status="cancelled"] { background: #ef4444; }
    }

    /* Status Badge */
    .status-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.2rem 0.625rem;
      border-radius: 99px;
      font-size: 0.7rem;
      font-weight: 500;
      text-transform: capitalize;
      white-space: nowrap;
      background: #f3f4f6;
      color: #4b5563;

      &[data-status="draft"] { background: #f8fafc; color: #64748b; }
      &[data-status="confirmed"] { background: #dbeafe; color: #1d4ed8; }
      &[data-status="processing"] { background: #fef3c7; color: #b45309; }
      &[data-status="packed"] { background: #e0e7ff; color: #4338ca; }
      &[data-status="assigned"] { background: #ede9fe; color: #6d28d9; }
      &[data-status="out_for_delivery"] { background: #cffafe; color: #0e7490; }
      &[data-status="delivered"] { background: #dcfce7; color: #15803d; }
      &[data-status="cancelled"] { background: #fee2e2; color: #dc2626; }
    }

    /* Orders Table */
    .table-container {
      overflow-x: auto;
    }

    .orders-table {
      width: 100%;
      border-collapse: collapse;

      thead th {
        padding: 0.75rem 1.25rem;
        text-align: left;
        font-size: 0.6875rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #6b7280;
        background: #f9fafb;
        border-bottom: 1px solid #f1f5f9;
      }

      tbody tr {
        border-bottom: 1px solid #f8fafc;
        transition: background 150ms ease;

        &:hover {
          background: #f9fafb;
        }

        &:last-child {
          border-bottom: none;
        }
      }

      tbody td {
        padding: 0.8rem 1.25rem;
        font-size: 0.8125rem;
        color: #374151;
        vertical-align: middle;
      }
    }

    .order-number-cell {
      font-weight: 600;
      color: #111827 !important;
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 0.75rem !important;
    }

    .customer-cell {
      color: #374151;
    }

    .amount-cell {
      font-weight: 600;
      color: #059669 !important;
    }

    .date-cell {
      color: #6b7280 !important;
      font-size: 0.75rem !important;
    }

    .empty-table {
      text-align: center;
      padding: 2rem !important;
      color: #9ca3af !important;
      font-style: italic;
    }

    .empty-panel {
      text-align: center;
      padding: 2rem;
      color: #9ca3af;

      p { margin: 0; font-size: 0.875rem; }
    }
  `],
})
export class DashboardPage implements OnInit {
  private api = inject(ApiService);

  loading = signal(true);
  stats = signal<DashboardStats>({
    totalOrders: 0,
    ordersByStatus: {},
    totalCustomers: 0,
    totalProducts: 0,
    lowStockCount: 0,
    totalSuppliers: 0,
    deliveryStaff: 0,
    recentOrders: [],
  });

  orderStatusEntries = signal<Array<{ status: string; count: number }>>([]);

  getStatusPercent(count: number): number {
    const max = Math.max(...this.orderStatusEntries().map(e => e.count), 1);
    return (count / max) * 100;
  }

  ngOnInit() {
    forkJoin({
      orders: this.api.getPaginated<any>('/orders', { limit: 5 }),
      customers: this.api.getPaginated<any>('/customers'),
      products: this.api.getPaginated<any>('/catalog/products'),
      inventory: this.api.get<any>('/inventory/report'),
      suppliers: this.api.get<any>('/purchasing/suppliers'),
      staff: this.api.get<any>('/delivery/staff'),
    }).subscribe({
      next: (res) => {
        const orders = res.orders;
        const totalOrders = orders.pagination?.total || 0;

        // Count by status from what we got
        const statusCounts: Record<string, number> = {};
        (orders.data || []).forEach((o: any) => {
          statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
        });

        const inventoryData = (res.inventory as any)?.data;
        const items = inventoryData?.items || [];
        const lowStockCount = items.filter((i: any) => i.isLowStock).length;

        const suppliersData = (res.suppliers as any)?.data;
        const totalSuppliers = Array.isArray(suppliersData) ? suppliersData.length : 0;

        const staffData = (res.staff as any)?.data;
        const deliveryStaff = Array.isArray(staffData) ? staffData.length : 0;

        this.stats.set({
          totalOrders,
          ordersByStatus: statusCounts,
          totalCustomers: res.customers.pagination?.total || 0,
          totalProducts: res.products.pagination?.total || 0,
          lowStockCount,
          totalSuppliers,
          deliveryStaff,
          recentOrders: orders.data || [],
        });

        this.orderStatusEntries.set(
          Object.entries(statusCounts)
            .map(([status, count]) => ({ status, count }))
            .sort((a, b) => b.count - a.count)
        );

        this.loading.set(false);
      },
      error: (err) => {
        console.error('Dashboard load error:', err);
        this.loading.set(false);
      },
    });
  }
}
