import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ApiService } from '@frontend/shared-data-access';

@Component({
  selector: 'app-coupons-list',
  standalone: true,
  imports: [RouterModule, DatePipe],
  template: `
    <div class="page-header">
      <div>
        <h1>Coupons</h1>
        <p class="subtitle">Manage discount coupons and promotions</p>
      </div>
      <div class="header-actions">
        <a routerLink="create" class="btn btn-primary">+ Create Coupon</a>
      </div>
    </div>

    <div class="filters-bar">
      <input
        type="text"
        placeholder="Search by code or title..."
        [value]="search()"
        (input)="onSearch($event)"
        class="search-input"
      />
      <select (change)="onTypeFilter($event)" class="filter-select">
        <option value="">All Types</option>
        @for (t of couponTypes; track t.value) {
          <option [value]="t.value" [selected]="typeFilter() === t.value">{{ t.label }}</option>
        }
      </select>
      <select (change)="onStatusFilter($event)" class="filter-select">
        <option value="">All Status</option>
        <option value="active" [selected]="statusFilter() === 'active'">Active</option>
        <option value="inactive" [selected]="statusFilter() === 'inactive'">Inactive</option>
        <option value="expired" [selected]="statusFilter() === 'expired'">Expired</option>
      </select>
    </div>

    @if (loading()) {
      <div class="loading">Loading coupons...</div>
    } @else {
      <div class="table-card">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Title</th>
              <th>Type</th>
              <th>Discount</th>
              <th>Min Cart</th>
              <th>Usage</th>
              <th>Status</th>
              <th>Valid Period</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (coupon of coupons(); track coupon.id) {
              <tr>
                <td class="code-cell">{{ coupon.code }}</td>
                <td>{{ coupon.title }}</td>
                <td><span class="type-badge">{{ getTypeLabel(coupon.type) }}</span></td>
                <td>{{ formatDiscount(coupon) }}</td>
                <td>{{ coupon.minCartValue ? '₹' + coupon.minCartValue : '—' }}</td>
                <td>{{ coupon.currentUses || 0 }}/{{ coupon.maxTotalUses || '∞' }}</td>
                <td>
                  <span class="status-badge" [class]="getStatusClass(coupon)">
                    {{ getStatusLabel(coupon) }}
                  </span>
                </td>
                <td class="date-cell">
                  {{ coupon.startDate | date:'dd MMM yy' }} – {{ coupon.endDate | date:'dd MMM yy' }}
                </td>
                <td class="actions-cell">
                  <a [routerLink]="['edit', coupon.id]" class="action-btn" title="Edit">✏️</a>
                  <button (click)="toggleActive(coupon)" class="action-btn" [title]="coupon.isActive ? 'Deactivate' : 'Activate'">
                    {{ coupon.isActive ? '🔴' : '🟢' }}
                  </button>
                  <button (click)="deleteCoupon(coupon)" class="action-btn delete" title="Delete">🗑️</button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="9" class="empty">No coupons found</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (totalPages() > 1) {
        <div class="pagination">
          <button (click)="goToPage(page() - 1)" [disabled]="page() <= 1" class="page-btn">← Prev</button>
          <span class="page-info">Page {{ page() }} of {{ totalPages() }} ({{ total() }} coupons)</span>
          <button (click)="goToPage(page() + 1)" [disabled]="page() >= totalPages()" class="page-btn">Next →</button>
        </div>
      }
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
    .filters-bar { display: flex; gap: 0.75rem; margin-bottom: 1.5rem; align-items: center; }
    .search-input {
      flex: 1; min-width: 160px; max-width: 300px; padding: 0.6rem 1rem; border: 1px solid #e2e8f0;
      border-radius: 8px; font-size: 0.875rem; outline: none;
      &:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
    }
    .filter-select { padding: 0.6rem 1rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.875rem; background: #fff; white-space: nowrap; }
    .loading { color: #64748b; padding: 3rem; text-align: center; }
    .table-card {
      background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      border: 1px solid #f1f5f9; overflow-x: auto;
    }
    table { width: 100%; border-collapse: collapse; }
    th {
      text-align: left; padding: 0.75rem 1rem; font-size: 0.75rem; font-weight: 600;
      text-transform: uppercase; color: #64748b; background: #f8fafc; border-bottom: 1px solid #e2e8f0;
    }
    td { padding: 0.75rem 1rem; border-bottom: 1px solid #f1f5f9; font-size: 0.875rem; color: #334155; }
    .code-cell { font-weight: 600; font-family: monospace; color: #1e293b; }
    .type-badge {
      padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem;
      background: #ede9fe; color: #6d28d9;
    }
    .status-badge {
      padding: 0.2rem 0.6rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 500;
      &.active { background: #dcfce7; color: #16a34a; }
      &.inactive { background: #fee2e2; color: #dc2626; }
      &.expired { background: #f1f5f9; color: #64748b; }
    }
    .date-cell { white-space: nowrap; font-size: 0.8rem; }
    .actions-cell { white-space: nowrap; }
    .action-btn {
      background: none; border: none; cursor: pointer; padding: 0.25rem 0.4rem;
      border-radius: 4px; text-decoration: none; font-size: 0.875rem;
      &:hover { background: #f1f5f9; }
      &.delete:hover { background: #fee2e2; }
    }
    .empty { text-align: center; color: #94a3b8; padding: 2rem; }
    .pagination {
      display: flex; justify-content: center; align-items: center; gap: 1rem;
      margin-top: 1.5rem; padding: 1rem;
    }
    .page-btn {
      padding: 0.5rem 1rem; border: 1px solid #e2e8f0; border-radius: 6px; background: #fff;
      cursor: pointer; font-size: 0.875rem;
      &:hover:not(:disabled) { background: #f1f5f9; }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
    .page-info { font-size: 0.875rem; color: #64748b; }
  `],
})
export class CouponsListPage implements OnInit {
  private api = inject(ApiService);

  coupons = signal<any[]>([]);
  loading = signal(true);
  search = signal('');
  typeFilter = signal('');
  statusFilter = signal('');
  page = signal(1);
  total = signal(0);
  totalPages = signal(0);
  private searchTimeout: any;

  couponTypes = [
    { value: 'percentage', label: 'Percentage' },
    { value: 'flat', label: 'Flat' },
    { value: 'product_special_price', label: 'Special Price' },
    { value: 'buy_x_get_y', label: 'Buy X Get Y' },
    { value: 'free_delivery', label: 'Free Delivery' },
    { value: 'first_order', label: 'First Order' },
  ];

  ngOnInit() {
    this.loadCoupons();
  }

  loadCoupons() {
    this.loading.set(true);
    const params: Record<string, any> = { page: this.page(), limit: 20 };
    if (this.search()) params['search'] = this.search();
    if (this.typeFilter()) params['type'] = this.typeFilter();
    if (this.statusFilter() === 'active') params['isActive'] = true;
    if (this.statusFilter() === 'inactive') params['isActive'] = false;

    this.api.getPaginated<any>('/coupons', params).subscribe({
      next: (res) => {
        let data = res.data || [];
        if (this.statusFilter() === 'expired') {
          data = data.filter((c: any) => new Date(c.endDate) < new Date());
        }
        this.coupons.set(data);
        this.total.set(res.pagination?.total || 0);
        this.totalPages.set(res.pagination?.totalPages || 0);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.search.set(value);
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.page.set(1);
      this.loadCoupons();
    }, 400);
  }

  onTypeFilter(event: Event) {
    this.typeFilter.set((event.target as HTMLSelectElement).value);
    this.page.set(1);
    this.loadCoupons();
  }

  onStatusFilter(event: Event) {
    this.statusFilter.set((event.target as HTMLSelectElement).value);
    this.page.set(1);
    this.loadCoupons();
  }

  goToPage(p: number) {
    this.page.set(p);
    this.loadCoupons();
  }

  toggleActive(coupon: any) {
    this.api.patch(`/coupons/${coupon.id}`, { isActive: !coupon.isActive }).subscribe({
      next: () => this.loadCoupons(),
    });
  }

  deleteCoupon(coupon: any) {
    if (!confirm(`Delete coupon "${coupon.code}"? This cannot be undone.`)) return;
    this.api.delete(`/coupons/${coupon.id}`).subscribe({
      next: () => this.loadCoupons(),
    });
  }

  getTypeLabel(type: string): string {
    return this.couponTypes.find(t => t.value === type)?.label || type;
  }

  formatDiscount(coupon: any): string {
    switch (coupon.type) {
      case 'percentage':
      case 'first_order':
        const max = coupon.maxDiscount ? ` (max ₹${coupon.maxDiscount})` : '';
        return `${coupon.discountPercent}%${max}`;
      case 'flat':
        return `₹${coupon.flatAmount} flat`;
      case 'free_delivery':
        return 'Free delivery';
      case 'product_special_price':
        return `₹${coupon.specialPrice} special`;
      case 'buy_x_get_y':
        return `Buy ${coupon.buyQty} Get ${coupon.getQty}`;
      default:
        return '—';
    }
  }

  getStatusClass(coupon: any): string {
    if (new Date(coupon.endDate) < new Date()) return 'expired';
    return coupon.isActive ? 'active' : 'inactive';
  }

  getStatusLabel(coupon: any): string {
    if (new Date(coupon.endDate) < new Date()) return 'Expired';
    return coupon.isActive ? 'Active' : 'Inactive';
  }
}
