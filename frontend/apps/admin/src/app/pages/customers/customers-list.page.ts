import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { ApiService } from '@frontend/shared-data-access';

@Component({
  selector: 'app-customers-list',
  standalone: true,
  imports: [RouterModule, DecimalPipe],
  template: `
    <div class="page-header">
      <div>
        <h1>Customers</h1>
        <p class="subtitle">Manage your customer base</p>
      </div>
      <div class="header-actions">
        <a routerLink="groups" class="btn btn-secondary">👥 Groups</a>
        <a routerLink="create" class="btn btn-primary">+ Add Customer</a>
      </div>
    </div>

    <div class="filters-bar">
      <input
        type="text"
        placeholder="Search by name, phone, email..."
        [value]="search()"
        (input)="onSearch($event)"
        class="search-input"
      />
      <select (change)="onGroupFilter($event)" class="filter-select">
        <option value="">All Groups</option>
        @for (group of groups(); track group.id) {
          <option [value]="group.id" [selected]="groupFilter() === group.id">{{ group.name }}</option>
        }
      </select>
    </div>

    @if (loading()) {
      <div class="loading">Loading customers...</div>
    } @else {
      <div class="table-card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Group</th>
              <th>Orders</th>
              <th>Total Spent</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (customer of customers(); track customer.id) {
              <tr>
                <td class="name-cell">
                  <a [routerLink]="['detail', customer.id]">{{ customer.name }}</a>
                  @if (customer.businessName) {
                    <span class="business-name">{{ customer.businessName }}</span>
                  }
                </td>
                <td>{{ customer.phone }}</td>
                <td>{{ customer.email || '—' }}</td>
                <td><span class="group-badge">{{ customer.group?.name || '—' }}</span></td>
                <td>{{ customer.totalOrders }}</td>
                <td class="amount">₹{{ customer.totalSpent | number }}</td>
                <td>
                  <span class="status-badge" [class.active]="customer.isActive" [class.inactive]="!customer.isActive">
                    {{ customer.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="actions-cell">
                  <a [routerLink]="['detail', customer.id]" class="action-btn" title="View">👁</a>
                  <a [routerLink]="['edit', customer.id]" class="action-btn" title="Edit">✏️</a>
                  <button (click)="deleteCustomer(customer)" class="action-btn delete" title="Delete">🗑️</button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="8" class="empty">No customers found</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (totalPages() > 1) {
        <div class="pagination">
          <button (click)="goToPage(page() - 1)" [disabled]="page() <= 1" class="page-btn">← Prev</button>
          <span class="page-info">Page {{ page() }} of {{ totalPages() }} ({{ total() }} customers)</span>
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
    .btn-secondary { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
    .btn-secondary:hover { background: #e2e8f0; }
    .filters-bar { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
    .search-input {
      flex: 1; max-width: 400px; padding: 0.6rem 1rem; border: 1px solid #e2e8f0;
      border-radius: 8px; font-size: 0.875rem; outline: none;
      &:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
    }
    .filter-select { padding: 0.6rem 1rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.875rem; background: #fff; }
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
    .name-cell a { color: #3b82f6; text-decoration: none; font-weight: 500; }
    .name-cell a:hover { text-decoration: underline; }
    .business-name { display: block; font-size: 0.75rem; color: #94a3b8; }
    .amount { font-weight: 600; color: #16a34a; }
    .group-badge {
      padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem;
      background: #ede9fe; color: #6d28d9;
    }
    .status-badge {
      padding: 0.2rem 0.6rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 500;
      &.active { background: #dcfce7; color: #16a34a; }
      &.inactive { background: #fee2e2; color: #dc2626; }
    }
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
export class CustomersListPage implements OnInit {
  private api = inject(ApiService);

  customers = signal<any[]>([]);
  groups = signal<any[]>([]);
  loading = signal(true);
  search = signal('');
  groupFilter = signal('');
  page = signal(1);
  total = signal(0);
  totalPages = signal(0);
  private searchTimeout: any;

  ngOnInit() {
    this.loadGroups();
    this.loadCustomers();
  }

  loadGroups() {
    this.api.get<any>('/customers/groups').subscribe({
      next: (res) => {
        this.groups.set(res.data?.groups || []);
      },
    });
  }

  loadCustomers() {
    this.loading.set(true);
    const params: Record<string, any> = { page: this.page(), limit: 20 };
    if (this.search()) params['search'] = this.search();
    if (this.groupFilter()) params['group'] = this.groupFilter();

    this.api.getPaginated<any>('/customers', params).subscribe({
      next: (res) => {
        this.customers.set(res.data || []);
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
      this.loadCustomers();
    }, 400);
  }

  onGroupFilter(event: Event) {
    this.groupFilter.set((event.target as HTMLSelectElement).value);
    this.page.set(1);
    this.loadCustomers();
  }

  goToPage(p: number) {
    this.page.set(p);
    this.loadCustomers();
  }

  deleteCustomer(customer: any) {
    if (!confirm(`Delete customer "${customer.name}"? This cannot be undone.`)) return;
    this.api.delete(`/customers/${customer.id}`).subscribe({
      next: () => this.loadCustomers(),
    });
  }
}
