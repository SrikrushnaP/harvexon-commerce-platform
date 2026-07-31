import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '@frontend/shared-data-access';

interface StockItem {
  product: {
    id: string;
    name: string;
    sku: string;
    unit: { shortName: string };
    category: { name: string };
  };
  currentStock: number;
  lowStockThreshold: number;
  isLowStock: boolean;
  totalIn: number;
  totalOut: number;
}

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [RouterModule, DecimalPipe, FormsModule],
  template: `
    <div class="page-header">
      <div>
        <h1>Inventory</h1>
        <p class="subtitle">Track stock levels and manage inventory</p>
      </div>
      <div class="header-actions">
        <a routerLink="transactions" class="btn btn-secondary">📋 Transactions</a>
        <a routerLink="adjust" class="btn btn-primary">± Adjust Stock</a>
      </div>
    </div>

    <div class="filters-bar">
      <input
        type="text"
        placeholder="Search by product name or SKU..."
        [value]="search()"
        (input)="onSearch($event)"
        class="search-input"
      />
      <label class="checkbox-label">
        <input
          type="checkbox"
          [checked]="lowStockOnly()"
          (change)="onLowStockFilter($event)"
        />
        Low stock only
      </label>
    </div>

    @if (loading()) {
      <div class="loading">Loading stock report...</div>
    } @else {
      <div class="table-card">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Current Stock</th>
              <th>Threshold</th>
              <th>Total In</th>
              <th>Total Out</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            @for (item of items(); track item.product.id) {
              <tr [class.low-stock-row]="item.isLowStock">
                <td class="product-name">{{ item.product.name }}</td>
                <td class="sku">{{ item.product.sku }}</td>
                <td>{{ item.product.category ? item.product.category.name : '—' }}</td>
                <td class="stock-value">
                  {{ item.currentStock | number:'1.0-2' }} {{ item.product.unit ? item.product.unit.shortName : '' }}
                </td>
                <td>{{ item.lowStockThreshold | number:'1.0-2' }}</td>
                <td class="in-value">{{ item.totalIn | number:'1.0-2' }}</td>
                <td class="out-value">{{ item.totalOut | number:'1.0-2' }}</td>
                <td>
                  @if (item.isLowStock) {
                    <span class="badge badge-danger">Low Stock</span>
                  } @else {
                    <span class="badge badge-success">OK</span>
                  }
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="8" class="empty">No inventory records found</td>
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
            Page {{ page() }} of {{ totalPages() }} ({{ total() }} items)
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
    .search-input {
      flex: 1; min-width: 160px; max-width: 280px; padding: 0.6rem 1rem;
      border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.875rem; outline: none;
    }
    .search-input:focus {
      border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
    }
    .checkbox-label {
      display: flex; align-items: center; gap: 0.4rem;
      font-size: 0.85rem; color: #475569; cursor: pointer; white-space: nowrap;
    }
    .checkbox-label input {
      width: 16px; height: 16px; cursor: pointer; accent-color: #3b82f6;
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
    .sku { font-family: monospace; font-size: 0.8rem; color: #64748b; }
    .stock-value { font-weight: 600; }
    .in-value { color: #16a34a; }
    .out-value { color: #dc2626; }
    .low-stock-row { background: #fef2f2; }
    .low-stock-row:hover { background: #fee2e2; }
    .badge {
      padding: 0.2rem 0.6rem; border-radius: 9999px;
      font-size: 0.7rem; font-weight: 500; white-space: nowrap;
    }
    .badge-success { background: #dcfce7; color: #16a34a; }
    .badge-danger { background: #fee2e2; color: #dc2626; }
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
export class InventoryListPage implements OnInit {
  private api = inject(ApiService);

  items = signal<StockItem[]>([]);
  loading = signal(true);
  search = signal('');
  lowStockOnly = signal(false);
  page = signal(1);
  total = signal(0);
  totalPages = signal(0);

  private searchTimeout: any;

  ngOnInit() {
    this.loadReport();
  }

  loadReport() {
    this.loading.set(true);
    const params: Record<string, any> = { page: this.page(), limit: 20 };
    if (this.search()) params['search'] = this.search();
    if (this.lowStockOnly()) params['lowStock'] = true;

    this.api.getPaginated<StockItem>('/inventory/report', params).subscribe({
      next: (res) => {
        this.items.set(res.data || []);
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
      this.loadReport();
    }, 400);
  }

  onLowStockFilter(event: Event) {
    this.lowStockOnly.set((event.target as HTMLInputElement).checked);
    this.page.set(1);
    this.loadReport();
  }

  goToPage(p: number) {
    this.page.set(p);
    this.loadReport();
  }
}
