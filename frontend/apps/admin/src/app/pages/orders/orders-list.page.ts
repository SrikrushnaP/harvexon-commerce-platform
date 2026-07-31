import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '@frontend/shared-data-access';

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [RouterModule, DecimalPipe, DatePipe, FormsModule],
  template: `
    <div class="page-header">
      <div>
        <h1>Orders</h1>
        <p class="subtitle">Manage order lifecycle — draft to delivery</p>
      </div>
    </div>

    <div class="filters-bar">
      <input
        type="text"
        placeholder="Search by order #, customer name..."
        [value]="search()"
        (input)="onSearch($event)"
        class="search-input"
      />
      <select (change)="onStatusFilter($event)" class="filter-select">
        <option value="">All Statuses</option>
        @for (s of statusOptions; track s.value) {
          <option [value]="s.value" [selected]="statusFilter() === s.value">{{ s.label }}</option>
        }
      </select>
      <input
        type="date"
        [value]="dateFrom()"
        (change)="onDateFrom($event)"
        class="filter-date"
        placeholder="From date"
      />
      <input
        type="date"
        [value]="dateTo()"
        (change)="onDateTo($event)"
        class="filter-date"
        placeholder="To date"
      />
      @if (hasActiveFilters()) {
        <button (click)="clearFilters()" class="btn btn-ghost">Clear</button>
      }
    </div>

    <div class="stats-row">
      @for (stat of statusStats(); track stat.status) {
        <button
          class="stat-chip"
          [class.active]="statusFilter() === stat.status"
          (click)="onStatusChip(stat.status)"
        >
          <span class="stat-count">{{ stat.count }}</span>
          <span class="stat-label">{{ stat.label }}</span>
        </button>
      }
    </div>

    @if (loading()) {
      <div class="loading">Loading orders...</div>
    } @else {
      <div class="table-card">
        <table>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (order of orders(); track order.id) {
              <tr class="clickable-row" (click)="goToDetail(order.id)">
                <td class="order-num">{{ order.orderNumber }}</td>
                <td class="customer-cell">
                  <span class="customer-name">{{ order.customer?.name || '—' }}</span>
                  @if (order.customer?.phone) {
                    <span class="customer-phone">{{ order.customer.phone }}</span>
                  }
                </td>
                <td>{{ order.items?.length || 0 }} items</td>
                <td class="amount">₹{{ order.total | number:'1.0-0' }}</td>
                <td>
                  <span class="status-badge" [attr.data-status]="order.status">
                    {{ formatStatus(order.status) }}
                  </span>
                </td>
                <td>
                  <span class="payment-badge" [attr.data-payment]="order.paymentStatus">
                    {{ order.paymentStatus }}
                  </span>
                  <span class="payment-method">{{ formatPaymentMethod(order.paymentMethod) }}</span>
                </td>
                <td class="date-cell">{{ order.orderDate || order.createdAt | date:'shortDate' }}</td>
                <td class="actions-cell">
                  <button class="btn-view" (click)="goToDetail(order.id); $event.stopPropagation()">👁 View</button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="8" class="empty">No orders found</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (totalPages() > 1) {
        <div class="pagination">
          <button (click)="goToPage(page() - 1)" [disabled]="page() <= 1" class="page-btn">← Prev</button>
          <span class="page-info">Page {{ page() }} of {{ totalPages() }} ({{ total() }} orders)</span>
          <button (click)="goToPage(page() + 1)" [disabled]="page() >= totalPages()" class="page-btn">Next →</button>
        </div>
      }
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .page-header h1 { margin: 0 0 0.25rem; color: #1e293b; font-size: 1.5rem; }
    .subtitle { color: #64748b; margin: 0; font-size: 0.875rem; }

    .filters-bar { display: flex; gap: 0.75rem; margin-bottom: 1rem; align-items: center; }
    .search-input {
      flex: 1; min-width: 160px; max-width: 280px; padding: 0.6rem 1rem;
      border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.875rem; outline: none;
      &:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
    }
    .filter-select {
      padding: 0.6rem 1rem; border: 1px solid #e2e8f0; border-radius: 8px;
      font-size: 0.875rem; background: #fff; cursor: pointer; white-space: nowrap;
    }
    .filter-date {
      padding: 0.55rem 0.75rem; border: 1px solid #e2e8f0; border-radius: 8px;
      font-size: 0.825rem; background: #fff; cursor: pointer; color: #334155;
    }
    .btn { padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.825rem; font-weight: 500; cursor: pointer; border: none; }
    .btn-ghost { background: transparent; color: #64748b; border: 1px solid #e2e8f0; }
    .btn-ghost:hover { background: #f1f5f9; }

    .stats-row { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .stat-chip {
      display: flex; flex-direction: column; align-items: center; padding: 0.5rem 1rem;
      background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer;
      transition: all 0.15s;
      &:hover { border-color: #3b82f6; background: #eff6ff; }
      &.active { border-color: #3b82f6; background: #eff6ff; }
    }
    .stat-count { font-size: 1.1rem; font-weight: 700; color: #1e293b; }
    .stat-label { font-size: 0.65rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.03em; }

    .loading { color: #64748b; padding: 3rem; text-align: center; }
    .table-card {
      background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      border: 1px solid #f1f5f9; overflow-x: auto;
    }
    table { width: 100%; border-collapse: collapse; }
    th {
      text-align: left; padding: 0.75rem 1rem; font-size: 0.7rem; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.03em; color: #64748b; background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }
    td { padding: 0.75rem 1rem; border-bottom: 1px solid #f1f5f9; font-size: 0.85rem; color: #334155; }
    .clickable-row { cursor: pointer; transition: background 0.12s; }
    .clickable-row:hover { background: #f8fafc; }
    .order-num { font-weight: 600; color: #3b82f6; }
    .customer-cell { display: flex; flex-direction: column; }
    .customer-name { font-weight: 500; color: #1e293b; }
    .customer-phone { font-size: 0.75rem; color: #94a3b8; }
    .amount { font-weight: 600; color: #16a34a; }
    .date-cell { white-space: nowrap; color: #64748b; font-size: 0.8rem; }

    .status-badge {
      padding: 0.2rem 0.6rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 500;
      text-transform: capitalize; background: #f1f5f9; color: #475569;
      &[data-status="draft"] { background: #f1f5f9; color: #64748b; }
      &[data-status="confirmed"] { background: #dbeafe; color: #1d4ed8; }
      &[data-status="processing"] { background: #fef3c7; color: #d97706; }
      &[data-status="packed"] { background: #e0e7ff; color: #4338ca; }
      &[data-status="assigned"] { background: #cffafe; color: #0891b2; }
      &[data-status="out_for_delivery"] { background: #d1fae5; color: #059669; }
      &[data-status="delivered"] { background: #dcfce7; color: #16a34a; }
      &[data-status="cancelled"] { background: #fee2e2; color: #dc2626; }
    }
    .payment-badge {
      padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: 500;
      text-transform: capitalize; background: #fef9c3; color: #a16207;
      &[data-payment="paid"] { background: #dcfce7; color: #16a34a; }
      &[data-payment="partial"] { background: #fef3c7; color: #d97706; }
      &[data-payment="pending"] { background: #fee2e2; color: #dc2626; }
    }
    .payment-method { font-size: 0.7rem; color: #94a3b8; margin-left: 0.4rem; text-transform: uppercase; }

    .empty { text-align: center; color: #94a3b8; padding: 2rem; }
    .actions-cell { white-space: nowrap; }
    .btn-view {
      padding: 0.3rem 0.7rem; border-radius: 6px; border: 1px solid #e2e8f0;
      background: #f8fafc; color: #475569; font-size: 0.75rem; cursor: pointer;
      font-weight: 500; transition: all 0.12s;
      &:hover { background: #3b82f6; color: #fff; border-color: #3b82f6; }
    }
    .pagination {
      display: flex; justify-content: center; align-items: center; gap: 1rem;
      margin-top: 1.5rem; padding: 1rem;
    }
    .page-btn {
      padding: 0.5rem 1rem; border: 1px solid #e2e8f0; border-radius: 6px; background: #fff;
      cursor: pointer; font-size: 0.85rem;
      &:hover:not(:disabled) { background: #f1f5f9; }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
    .page-info { font-size: 0.85rem; color: #64748b; }
  `],
})
export class OrdersListPage implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);

  orders = signal<any[]>([]);
  loading = signal(true);
  search = signal('');
  statusFilter = signal('');
  dateFrom = signal('');
  dateTo = signal('');
  page = signal(1);
  total = signal(0);
  totalPages = signal(0);
  statusStats = signal<{ status: string; label: string; count: number }[]>([]);

  private searchTimeout: any;

  statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'processing', label: 'Processing' },
    { value: 'packed', label: 'Packed' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'out_for_delivery', label: 'Out for Delivery' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  hasActiveFilters(): boolean {
    return !!(this.search() || this.statusFilter() || this.dateFrom() || this.dateTo());
  }

  ngOnInit() {
    this.loadOrders();
    this.loadStats();
  }

  loadOrders() {
    this.loading.set(true);
    const params: Record<string, any> = { page: this.page(), limit: 20 };
    if (this.search()) params['search'] = this.search();
    if (this.statusFilter()) params['status'] = this.statusFilter();
    if (this.dateFrom()) params['dateFrom'] = this.dateFrom();
    if (this.dateTo()) params['dateTo'] = this.dateTo();

    this.api.getPaginated<any>('/orders', params).subscribe({
      next: (res) => {
        this.orders.set(res.data || []);
        this.total.set(res.pagination?.total || 0);
        this.totalPages.set(res.pagination?.totalPages || 0);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadStats() {
    this.api.get<any>('/orders/stats').subscribe({
      next: (res) => {
        const data = res.data;
        if (data && typeof data === 'object') {
          const stats = this.statusOptions
            .map(s => ({ status: s.value, label: s.label, count: data[s.value] || 0 }))
            .filter(s => s.count > 0);
          this.statusStats.set(stats);
        }
      },
      error: () => {},
    });
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.search.set(value);
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.page.set(1);
      this.loadOrders();
    }, 400);
  }

  onStatusFilter(event: Event) {
    this.statusFilter.set((event.target as HTMLSelectElement).value);
    this.page.set(1);
    this.loadOrders();
  }

  onStatusChip(status: string) {
    if (this.statusFilter() === status) {
      this.statusFilter.set('');
    } else {
      this.statusFilter.set(status);
    }
    this.page.set(1);
    this.loadOrders();
  }

  onDateFrom(event: Event) {
    this.dateFrom.set((event.target as HTMLInputElement).value);
    this.page.set(1);
    this.loadOrders();
  }

  onDateTo(event: Event) {
    this.dateTo.set((event.target as HTMLInputElement).value);
    this.page.set(1);
    this.loadOrders();
  }

  clearFilters() {
    this.search.set('');
    this.statusFilter.set('');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.page.set(1);
    this.loadOrders();
  }

  goToPage(p: number) {
    this.page.set(p);
    this.loadOrders();
  }

  goToDetail(id: string) {
    this.router.navigate(['/orders/detail', id]);
  }

  formatStatus(status: string): string {
    if (!status) return '—';
    return status.replace(/_/g, ' ');
  }

  formatPaymentMethod(method: string): string {
    if (!method) return '';
    const map: Record<string, string> = {
      cash: 'Cash',
      upi: 'UPI',
      bank_transfer: 'Bank',
      credit: 'Credit',
    };
    return map[method] || method;
  }
}
