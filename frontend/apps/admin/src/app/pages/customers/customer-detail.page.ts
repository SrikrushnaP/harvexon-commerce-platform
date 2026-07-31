import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '@frontend/shared-data-access';
import { DecimalPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [RouterModule, DecimalPipe, DatePipe],
  template: `
    <div class="page-header">
      <div>
        <h1>{{ customer()?.name || 'Customer Detail' }}</h1>
        @if (customer()?.businessName) {
          <p class="subtitle">{{ customer()?.businessName }}</p>
        }
      </div>
      <div class="header-actions">
        <a routerLink="/customers" class="btn btn-secondary">← Back</a>
        @if (customer()) {
          <a [routerLink]="['/customers/edit', customer().id]" class="btn btn-primary">✏️ Edit</a>
        }
      </div>
    </div>

    @if (loading()) {
      <div class="loading">Loading customer...</div>
    } @else if (customer()) {
      <div class="detail-grid">
        <div class="info-card">
          <h2>Contact Information</h2>
          <div class="info-row">
            <span class="info-label">Phone</span>
            <span class="info-value">{{ customer().phone }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Email</span>
            <span class="info-value">{{ customer().email || '—' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Group</span>
            <span class="info-value group-badge">{{ customer().group?.name || '—' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">GSTIN</span>
            <span class="info-value">{{ customer().gstin || '—' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Status</span>
            <span class="status-badge" [class.active]="customer().isActive" [class.inactive]="!customer().isActive">
              {{ customer().isActive ? 'Active' : 'Inactive' }}
            </span>
          </div>
          @if (customer().tags?.length) {
            <div class="info-row">
              <span class="info-label">Tags</span>
              <div class="tags-list">
                @for (tag of customer().tags; track tag) {
                  <span class="tag">{{ tag }}</span>
                }
              </div>
            </div>
          }
          @if (customer().notes) {
            <div class="info-row">
              <span class="info-label">Notes</span>
              <span class="info-value">{{ customer().notes }}</span>
            </div>
          }
        </div>

        <div class="info-card">
          <h2>Statistics</h2>
          <div class="stats-grid">
            <div class="stat">
              <span class="stat-value">{{ customer().totalOrders }}</span>
              <span class="stat-label">Total Orders</span>
            </div>
            <div class="stat">
              <span class="stat-value">₹{{ customer().totalSpent | number }}</span>
              <span class="stat-label">Total Spent</span>
            </div>
            <div class="stat">
              <span class="stat-value">₹{{ customer().outstandingBalance | number }}</span>
              <span class="stat-label">Outstanding</span>
            </div>
            <div class="stat">
              <span class="stat-value">₹{{ customer().creditBalance | number }}</span>
              <span class="stat-label">Credit Balance</span>
            </div>
          </div>
          @if (customer().lastOrderDate) {
            <div class="info-row" style="margin-top: 1rem;">
              <span class="info-label">Last Order</span>
              <span class="info-value">{{ customer().lastOrderDate | date:'mediumDate' }}</span>
            </div>
          }
        </div>
      </div>

      <div class="section-card">
        <h2>Addresses ({{ addresses().length }})</h2>
        @if (addresses().length) {
          <div class="addresses-grid">
            @for (addr of addresses(); track addr.id) {
              <div class="address-card" [class.default]="addr.isDefault">
                @if (addr.isDefault) {
                  <span class="default-badge">Default</span>
                }
                @if (addr.label) {
                  <strong class="addr-label">{{ addr.label }}</strong>
                }
                <p>{{ addr.line1 }}</p>
                @if (addr.line2) { <p>{{ addr.line2 }}</p> }
                <p>{{ addr.city }}, {{ addr.state }} — {{ addr.pincode }}</p>
                @if (addr.landmark) { <p class="landmark">📍 {{ addr.landmark }}</p> }
              </div>
            }
          </div>
        } @else {
          <p class="empty">No addresses added yet</p>
        }
      </div>

      <div class="section-card">
        <h2>Recent Orders</h2>
        @if (orders().length) {
          <table class="orders-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              @for (order of orders(); track order.id) {
                <tr>
                  <td class="order-num">{{ order.orderNumber }}</td>
                  <td>{{ order.createdAt | date:'shortDate' }}</td>
                  <td>{{ order.items?.length || 0 }} items</td>
                  <td class="amount">₹{{ order.total | number }}</td>
                  <td><span class="order-status" [attr.data-status]="order.status">{{ order.status }}</span></td>
                </tr>
              }
            </tbody>
          </table>
        } @else {
          <p class="empty">No orders placed yet</p>
        }
      </div>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .page-header h1 { margin: 0 0 0.25rem; color: #1e293b; font-size: 1.5rem; }
    .subtitle { color: #64748b; margin: 0; font-size: 0.875rem; }
    .header-actions { display: flex; gap: 0.75rem; }
    .btn { padding: 0.6rem 1.2rem; border-radius: 8px; text-decoration: none; font-size: 0.875rem; font-weight: 500; cursor: pointer; border: none; }
    .btn-primary { background: #3b82f6; color: #fff; }
    .btn-primary:hover { background: #2563eb; }
    .btn-secondary { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
    .btn-secondary:hover { background: #e2e8f0; }
    .loading { color: #64748b; padding: 3rem; text-align: center; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
    @media (max-width: 900px) { .detail-grid { grid-template-columns: 1fr; } }
    .info-card, .section-card {
      background: #fff; border-radius: 12px; padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06); border: 1px solid #f1f5f9;
      h2 { margin: 0 0 1rem; font-size: 1rem; color: #334155; }
    }
    .section-card { margin-bottom: 1.5rem; }
    .info-row { display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0; border-bottom: 1px solid #f8fafc; }
    .info-label { font-size: 0.8rem; color: #64748b; text-transform: uppercase; }
    .info-value { font-size: 0.875rem; color: #1e293b; }
    .group-badge { padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; background: #ede9fe; color: #6d28d9; }
    .status-badge {
      padding: 0.2rem 0.6rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 500;
      &.active { background: #dcfce7; color: #16a34a; }
      &.inactive { background: #fee2e2; color: #dc2626; }
    }
    .tags-list { display: flex; flex-wrap: wrap; gap: 0.4rem; }
    .tag { padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.7rem; background: #f1f5f9; color: #475569; }
    .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .stat { text-align: center; padding: 0.75rem; background: #f8fafc; border-radius: 8px; }
    .stat .stat-value { display: block; font-size: 1.25rem; font-weight: 700; color: #1e293b; }
    .stat .stat-label { font-size: 0.7rem; color: #64748b; text-transform: uppercase; }
    .addresses-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; }
    .address-card {
      padding: 1rem; border: 1px solid #e2e8f0; border-radius: 8px; position: relative;
      p { margin: 0.2rem 0; font-size: 0.85rem; color: #334155; }
      &.default { border-color: #3b82f6; background: #eff6ff; }
    }
    .default-badge { position: absolute; top: 0.5rem; right: 0.5rem; font-size: 0.65rem; background: #3b82f6; color: #fff; padding: 0.1rem 0.4rem; border-radius: 4px; }
    .addr-label { font-size: 0.8rem; color: #1e293b; }
    .landmark { color: #64748b; font-size: 0.8rem; }
    .orders-table { width: 100%; border-collapse: collapse; }
    .orders-table th {
      text-align: left; padding: 0.6rem 0.75rem; font-size: 0.75rem; font-weight: 600;
      text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0;
    }
    .orders-table td { padding: 0.6rem 0.75rem; border-bottom: 1px solid #f1f5f9; font-size: 0.85rem; }
    .order-num { font-weight: 500; color: #3b82f6; }
    .amount { font-weight: 600; color: #16a34a; }
    .order-status {
      padding: 0.2rem 0.5rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 500; text-transform: capitalize;
      background: #f1f5f9; color: #475569;
      &[data-status="confirmed"] { background: #dbeafe; color: #1d4ed8; }
      &[data-status="processing"] { background: #fef3c7; color: #d97706; }
      &[data-status="out_for_delivery"] { background: #cffafe; color: #0891b2; }
      &[data-status="delivered"] { background: #dcfce7; color: #16a34a; }
      &[data-status="cancelled"] { background: #fee2e2; color: #dc2626; }
    }
    .empty { color: #94a3b8; text-align: center; padding: 1rem; font-size: 0.875rem; }
  `],
})
export class CustomerDetailPage implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  customer = signal<any>(null);
  addresses = signal<any[]>([]);
  orders = signal<any[]>([]);
  loading = signal(true);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCustomer(id);
      this.loadAddresses(id);
      this.loadOrders(id);
    }
  }

  loadCustomer(id: string) {
    this.api.get<any>(`/customers/${id}`).subscribe({
      next: (res) => {
        this.customer.set(res.data?.customer);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadAddresses(customerId: string) {
    this.api.get<any>('/customers/addresses', { customer: customerId }).subscribe({
      next: (res) => {
        this.addresses.set(res.data?.addresses || []);
      },
    });
  }

  loadOrders(customerId: string) {
    this.api.getPaginated<any>('/orders', { customer: customerId, limit: 10 }).subscribe({
      next: (res) => {
        this.orders.set(res.data || []);
      },
    });
  }
}
