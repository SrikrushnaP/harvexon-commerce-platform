import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ApiService, AuthService } from '@frontend/shared-data-access';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  items: { name: string; quantity: number }[];
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [RouterModule, DatePipe],
  template: `
    <div class="orders-container">
      <header class="orders-header">
        <h1>My Orders</h1>
        <p class="orders-subtitle">Track and manage your orders</p>
      </header>

      @if (loading()) {
        <div class="loading-state">
          @for (i of [1,2,3]; track i) {
            <div class="skeleton-card"></div>
          }
        </div>
      } @else if (orders().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">📦</div>
          <h3>No orders yet</h3>
          <p>Your order history will appear here</p>
          <a routerLink="/catalog" class="shop-btn">Start Shopping</a>
        </div>
      } @else {
        <div class="orders-list">
          @for (order of orders(); track order.id) {
            <a [routerLink]="['/orders', order.id]" class="order-card" [attr.data-status]="order.status">
              <div class="order-top">
                <span class="order-number">#{{ order.orderNumber }}</span>
                <span class="status-badge" [class]="'status-' + order.status">{{ formatStatus(order.status) }}</span>
              </div>
              <div class="order-meta">
                <span class="order-date">{{ order.createdAt | date:'dd MMM yyyy, hh:mm a' }}</span>
              </div>
              <div class="order-bottom">
                <span class="order-items">{{ order.items.length }} item{{ order.items.length > 1 ? 's' : '' }}</span>
                <span class="order-total">&#8377;{{ order.total }}</span>
              </div>
            </a>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .orders-container { max-width: 600px; margin: 0 auto; padding: 16px; }
    .orders-header { margin-bottom: 24px; }
    .orders-header h1 { font-size: 1.5rem; font-weight: 700; color: #1a1a1a; margin: 0 0 4px; }
    .orders-subtitle { font-size: 0.9rem; color: #6b7280; margin: 0; }

    .loading-state { display: flex; flex-direction: column; gap: 12px; }
    .skeleton-card { height: 100px; border-radius: 14px; background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    .empty-state { text-align: center; padding: 60px 20px; }
    .empty-icon { font-size: 3rem; margin-bottom: 12px; }
    .empty-state h3 { font-size: 1.1rem; font-weight: 600; color: #374151; margin: 0 0 6px; }
    .empty-state p { font-size: 0.9rem; color: #6b7280; margin: 0 0 20px; }
    .shop-btn { display: inline-block; padding: 10px 24px; background: linear-gradient(135deg, #22c55e, #16a34a); color: white; border-radius: 10px; text-decoration: none; font-weight: 500; font-size: 0.9rem; }

    .orders-list { display: flex; flex-direction: column; gap: 12px; }

    .order-card {
      display: block;
      padding: 16px 18px;
      background: white;
      border-radius: 14px;
      border: 1px solid #f0f0f0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      text-decoration: none;
      transition: all 0.2s;
      border-left: 4px solid #d1d5db;
    }
    .order-card:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .order-card[data-status="draft"] { border-left-color: #10b981; }
    .order-card[data-status="pending"] { border-left-color: #f59e0b; }
    .order-card[data-status="confirmed"] { border-left-color: #3b82f6; }
    .order-card[data-status="preparing"] { border-left-color: #a855f7; }
    .order-card[data-status="ready"] { border-left-color: #06b6d4; }
    .order-card[data-status="out_for_delivery"] { border-left-color: #10b981; }
    .order-card[data-status="delivered"] { border-left-color: #22c55e; }
    .order-card[data-status="cancelled"] { border-left-color: #ef4444; }

    .order-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .order-number { font-weight: 600; font-size: 0.95rem; color: #1a1a1a; }

    .status-badge { padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; }
    .status-draft { background: #ecfdf5; color: #065f46; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-confirmed { background: #dbeafe; color: #1e40af; }
    .status-preparing { background: #f3e8ff; color: #7c3aed; }
    .status-ready { background: #cffafe; color: #0e7490; }
    .status-out_for_delivery { background: #d1fae5; color: #065f46; }
    .status-delivered { background: #dcfce7; color: #166534; }
    .status-cancelled { background: #fee2e2; color: #991b1b; }

    .order-meta { margin-bottom: 10px; }
    .order-date { font-size: 0.8rem; color: #9ca3af; }

    .order-bottom { display: flex; justify-content: space-between; align-items: center; }
    .order-items { font-size: 0.85rem; color: #6b7280; }
    .order-total { font-size: 1rem; font-weight: 700; color: #1a1a1a; }
  `]
})
export class OrdersPage implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  orders = signal<Order[]>([]);
  loading = signal<boolean>(true);

  ngOnInit() {
    this.api.getPaginated<Order>('/orders').subscribe({
      next: (res) => {
        this.orders.set(res.data || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  formatStatus(status: string): string {
    if (status === 'draft') return 'Order Placed';
    return status.replace(/_/g, ' ');
  }
}
