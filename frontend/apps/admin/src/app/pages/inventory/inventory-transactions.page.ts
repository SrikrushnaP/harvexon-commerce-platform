import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '@frontend/shared-data-access';

interface Transaction {
  id: string;
  product: { id: string; name: string };
  type: string;
  quantity: number;
  direction: 'in' | 'out';
  notes: string;
  transactionDate: string;
  referenceType: string;
}

@Component({
  selector: 'app-inventory-transactions',
  standalone: true,
  imports: [RouterModule, DatePipe, DecimalPipe, FormsModule],
  template: `
    <div class="page-header">
      <div>
        <h1>Inventory Transactions</h1>
        <p class="subtitle">Complete history of stock movements</p>
      </div>
      <div class="header-actions">
        <a routerLink="/inventory" class="btn btn-secondary">← Stock Report</a>
        <a routerLink="/inventory/adjust" class="btn btn-primary">± Adjust Stock</a>
      </div>
    </div>

    <div class="filters-bar">
      <select (change)="onTypeFilter($event)" class="filter-select">
        <option value="">All Types</option>
        @for (t of typeOptions; track t.value) {
          <option [value]="t.value" [selected]="typeFilter() === t.value">
            {{ t.label }}
          </option>
        }
      </select>
    </div>

    @if (loading()) {
      <div class="loading">Loading transactions...</div>
    } @else {
      <div class="table-card">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Product</th>
              <th>Type</th>
              <th>Direction</th>
              <th>Quantity</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            @for (txn of transactions(); track txn.id) {
              <tr>
                <td class="date-cell">{{ txn.transactionDate | date:'medium' }}</td>
                <td class="product-name">{{ txn.product ? txn.product.name : '—' }}</td>
                <td>
                  <span class="type-badge" [attr.data-type]="txn.type">
                    {{ txn.type }}
                  </span>
                </td>
                <td>
                  @if (txn.direction === 'in') {
                    <span class="direction-in">↑ In</span>
                  } @else {
                    <span class="direction-out">↓ Out</span>
                  }
                </td>
                <td class="quantity">{{ txn.quantity | number:'1.0-2' }}</td>
                <td class="notes">{{ txn.notes || '—' }}</td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" class="empty">No transactions found</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (totalPages() > 1) {
        <div class="pagination">
          <button (click)="goToPage(page() - 1)" [disabled]="page() <= 1" class="page-btn">
            ← Prev
          </button>
          <span class="page-info">
            Page {{ page() }} of {{ totalPages() }} ({{ total() }} transactions)
          </span>
          <button (click)="goToPage(page() + 1)" [disabled]="page() >= totalPages()" class="page-btn">
            Next →
          </button>
        </div>
      }
    }
  `,
  styles: [`
    .page-header {
      display: flex; justify-content: space-between;
      align-items: flex-start; margin-bottom: 1.5rem;
    }
    .page-header h1 { margin: 0 0 0.25rem; color: #1e293b; font-size: 1.5rem; }
    .subtitle { color: #64748b; margin: 0; font-size: 0.875rem; }
    .header-actions { display: flex; gap: 0.5rem; }
    .btn {
      padding: 0.55rem 1rem; border-radius: 8px; font-size: 0.85rem;
      font-weight: 500; cursor: pointer; border: none; text-decoration: none;
      display: inline-flex; align-items: center; gap: 0.3rem;
    }
    .btn-primary { background: #3b82f6; color: #fff; }
    .btn-primary:hover { background: #2563eb; }
    .btn-secondary { background: #fff; color: #334155; border: 1px solid #e2e8f0; }
    .btn-secondary:hover { background: #f1f5f9; }
    .filters-bar {
      display: flex; gap: 0.75rem; margin-bottom: 1.5rem;
      align-items: center;
    }
    .filter-select {
      padding: 0.6rem 1rem; border: 1px solid #e2e8f0; border-radius: 8px;
      font-size: 0.875rem; background: #fff; cursor: pointer;
    }
    .loading { color: #64748b; padding: 3rem; text-align: center; }
    .table-card {
      background: #fff; border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      border: 1px solid #f1f5f9; overflow-x: auto;
    }
    table { width: 100%; border-collapse: collapse; }
    th {
      text-align: left; padding: 0.75rem 1rem; font-size: 0.7rem; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.03em; color: #64748b;
      background: #f8fafc; border-bottom: 1px solid #e2e8f0;
    }
    td {
      padding: 0.75rem 1rem; border-bottom: 1px solid #f1f5f9;
      font-size: 0.85rem; color: #334155;
    }
    .product-name { font-weight: 500; color: #1e293b; }
    .date-cell { white-space: nowrap; color: #64748b; font-size: 0.8rem; }
    .quantity { font-weight: 600; }
    .notes {
      color: #64748b; font-size: 0.8rem; max-width: 200px;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .type-badge {
      padding: 0.2rem 0.6rem; border-radius: 9999px;
      font-size: 0.7rem; font-weight: 500;
      text-transform: capitalize; background: #f1f5f9; color: #475569;
    }
    .type-badge[data-type="purchase"] { background: #dbeafe; color: #1d4ed8; }
    .type-badge[data-type="sale"] { background: #dcfce7; color: #16a34a; }
    .type-badge[data-type="return"] { background: #fef3c7; color: #d97706; }
    .type-badge[data-type="damage"] { background: #fee2e2; color: #dc2626; }
    .type-badge[data-type="adjustment"] { background: #e0e7ff; color: #4338ca; }
    .type-badge[data-type="transfer"] { background: #cffafe; color: #0891b2; }
    .direction-in { color: #16a34a; font-weight: 600; font-size: 0.85rem; }
    .direction-out { color: #dc2626; font-weight: 600; font-size: 0.85rem; }
    .empty { text-align: center; color: #94a3b8; padding: 2rem; }
    .pagination {
      display: flex; justify-content: center; align-items: center;
      gap: 1rem; margin-top: 1.5rem; padding: 1rem;
    }
    .page-btn {
      padding: 0.5rem 1rem; border: 1px solid #e2e8f0; border-radius: 6px;
      background: #fff; cursor: pointer; font-size: 0.85rem;
    }
    .page-btn:hover:not(:disabled) { background: #f1f5f9; }
    .page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .page-info { font-size: 0.85rem; color: #64748b; }
  `],
})
export class InventoryTransactionsPage implements OnInit {
  private api = inject(ApiService);

  transactions = signal<Transaction[]>([]);
  loading = signal(true);
  typeFilter = signal('');
  page = signal(1);
  total = signal(0);
  totalPages = signal(0);

  typeOptions = [
    { value: 'purchase', label: 'Purchase' },
    { value: 'sale', label: 'Sale' },
    { value: 'return', label: 'Return' },
    { value: 'damage', label: 'Damage' },
    { value: 'adjustment', label: 'Adjustment' },
    { value: 'transfer', label: 'Transfer' },
  ];

  ngOnInit() {
    this.loadTransactions();
  }

  loadTransactions() {
    this.loading.set(true);
    const params: Record<string, any> = { page: this.page(), limit: 20 };
    if (this.typeFilter()) params['type'] = this.typeFilter();

    this.api.getPaginated<Transaction>('/inventory/transactions', params).subscribe({
      next: (res) => {
        this.transactions.set(res.data || []);
        this.total.set(res.pagination?.total || 0);
        this.totalPages.set(res.pagination?.totalPages || 0);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onTypeFilter(event: Event) {
    this.typeFilter.set((event.target as HTMLSelectElement).value);
    this.page.set(1);
    this.loadTransactions();
  }

  goToPage(p: number) {
    this.page.set(p);
    this.loadTransactions();
  }
}
