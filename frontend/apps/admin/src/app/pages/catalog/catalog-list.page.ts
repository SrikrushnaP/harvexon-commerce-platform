import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '@frontend/shared-data-access';

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  category: { id: string; name: string } | null;
  brand: { id: string; name: string } | null;
  unit: { id: string; name: string; shortName: string } | null;
  basePrice: number;
  images: string[];
  isFeatured: boolean;
  isAvailable: boolean;
  tags: string[];
  sortOrder: number;
}

interface Category {
  id: string;
  name: string;
}

@Component({
  selector: 'app-catalog-list',
  standalone: true,
  imports: [RouterModule, FormsModule],
  template: `
    <div class="page-header">
      <div>
        <h1>Products</h1>
        <p class="subtitle">Manage your product catalog</p>
      </div>
      <div class="header-actions">
        <a routerLink="categories" class="btn btn-secondary">📂 Categories</a>
        <a routerLink="units" class="btn btn-secondary">📏 Units</a>
        <a routerLink="create" class="btn btn-primary">+ Add Product</a>
      </div>
    </div>

    <div class="filters-card">
      <div class="filters-row">
        <div class="search-box">
          <input
            type="text"
            placeholder="Search products..."
            [ngModel]="search()"
            (ngModelChange)="onSearchChange($event)"
          />
        </div>
        <div class="filter-group">
          <select [ngModel]="selectedCategory()" (ngModelChange)="onCategoryChange($event)">
            <option value="">All Categories</option>
            @for (cat of categories(); track cat.id) {
              <option [value]="cat.id">{{ cat.name }}</option>
            }
          </select>
        </div>
        <div class="filter-group">
          <select [ngModel]="availabilityFilter()" (ngModelChange)="onAvailabilityChange($event)">
            <option value="">All Status</option>
            <option value="true">Available</option>
            <option value="false">Unavailable</option>
          </select>
        </div>
      </div>
    </div>

    @if (loading()) {
      <div class="loading">Loading products...</div>
    } @else {
      <div class="table-card">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Price</th>
              <th>Unit</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (product of products(); track product.id) {
              <tr>
                <td>
                  <div class="product-name">
                    <span class="name">{{ product.name }}</span>
                    @if (product.isFeatured) {
                      <span class="badge featured">⭐ Featured</span>
                    }
                  </div>
                </td>
                <td><span class="sku">{{ product.sku || '—' }}</span></td>
                <td>{{ product.category?.name || '—' }}</td>
                <td class="price">₹{{ product.basePrice }}</td>
                <td>{{ product.unit?.shortName || product.unit?.name || '—' }}</td>
                <td>
                  <span class="badge" [class.available]="product.isAvailable" [class.unavailable]="!product.isAvailable">
                    {{ product.isAvailable ? 'Available' : 'Unavailable' }}
                  </span>
                </td>
                <td>
                  <div class="actions">
                    <a [routerLink]="['edit', product.id]" class="btn-icon" title="Edit">✏️</a>
                    <button (click)="deleteProduct(product)" class="btn-icon danger" title="Delete">🗑️</button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="7" class="empty">No products found</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (totalPages() > 1) {
        <div class="pagination">
          <button (click)="goToPage(currentPage() - 1)" [disabled]="currentPage() <= 1" class="btn btn-sm">← Previous</button>
          <span class="page-info">Page {{ currentPage() }} of {{ totalPages() }} ({{ total() }} products)</span>
          <button (click)="goToPage(currentPage() + 1)" [disabled]="currentPage() >= totalPages()" class="btn btn-sm">Next →</button>
        </div>
      }
    }
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      h1 { margin: 0 0 0.25rem; color: #1e293b; font-size: 1.75rem; }
      .subtitle { color: #64748b; margin: 0; }
    }
    .header-actions {
      display: flex;
      gap: 0.5rem;
    }
    .btn {
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      text-decoration: none;
      border: none;
      cursor: pointer;
      transition: all 0.15s;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    }
    .btn-primary {
      background: #3b82f6;
      color: #fff;
      &:hover { background: #2563eb; }
    }
    .btn-secondary {
      background: #fff;
      color: #374151;
      border: 1px solid #e2e8f0;
      &:hover { background: #f8fafc; border-color: #cbd5e1; }
    }
    .btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.8rem;
      border-radius: 6px;
      background: #fff;
      border: 1px solid #e2e8f0;
      color: #374151;
      cursor: pointer;
      &:hover:not(:disabled) { background: #f8fafc; }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
    .filters-card {
      background: #fff;
      border-radius: 12px;
      padding: 1rem 1.5rem;
      margin-bottom: 1rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      border: 1px solid #f1f5f9;
    }
    .filters-row {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }
    .search-box {
      flex: 1;
      min-width: 200px;
      input {
        width: 100%;
        padding: 0.5rem 0.75rem;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 0.875rem;
        outline: none;
        &:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
      }
    }
    .filter-group {
      select {
        padding: 0.5rem 0.75rem;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 0.875rem;
        background: #fff;
        outline: none;
        cursor: pointer;
        &:focus { border-color: #3b82f6; }
      }
    }
    .table-card {
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      border: 1px solid #f1f5f9;
      overflow: hidden;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    thead {
      background: #f8fafc;
      th {
        padding: 0.75rem 1rem;
        text-align: left;
        font-size: 0.75rem;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        border-bottom: 1px solid #f1f5f9;
      }
    }
    tbody {
      tr {
        border-bottom: 1px solid #f8fafc;
        &:hover { background: #f8fafc; }
        &:last-child { border-bottom: none; }
      }
      td {
        padding: 0.75rem 1rem;
        font-size: 0.875rem;
        color: #374151;
      }
    }
    .product-name {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      .name { font-weight: 500; color: #1e293b; }
    }
    .sku { font-family: monospace; color: #64748b; font-size: 0.8rem; }
    .price { font-weight: 600; color: #16a34a; }
    .badge {
      padding: 0.2rem 0.6rem;
      border-radius: 9999px;
      font-size: 0.7rem;
      font-weight: 500;
      &.available { background: #dcfce7; color: #16a34a; }
      &.unavailable { background: #fee2e2; color: #dc2626; }
      &.featured { background: #fef3c7; color: #d97706; }
    }
    .actions {
      display: flex;
      gap: 0.25rem;
    }
    .btn-icon {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      font-size: 0.875rem;
      text-decoration: none;
      transition: background 0.15s;
      &:hover { background: #f1f5f9; }
      &.danger:hover { background: #fee2e2; }
    }
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-top: 1rem;
      padding: 1rem;
    }
    .page-info { font-size: 0.8rem; color: #64748b; }
    .loading { color: #64748b; padding: 3rem; text-align: center; }
    .empty { text-align: center; color: #94a3b8; padding: 2rem !important; }
  `],
})
export class CatalogListPage implements OnInit {
  private api = inject(ApiService);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  loading = signal(true);
  search = signal('');
  selectedCategory = signal('');
  availabilityFilter = signal('');
  currentPage = signal(1);
  totalPages = signal(1);
  total = signal(0);

  private searchTimeout: any;

  ngOnInit() {
    this.loadCategories();
    this.loadProducts();
  }

  loadCategories() {
    this.api.getPaginated<Category>('/catalog/categories', { limit: 100 }).subscribe({
      next: (res) => this.categories.set(res.data || []),
    });
  }

  loadProducts() {
    this.loading.set(true);
    const params: Record<string, string | number | boolean> = {
      page: this.currentPage(),
      limit: 15,
    };
    if (this.search()) params['search'] = this.search();
    if (this.selectedCategory()) params['category'] = this.selectedCategory();
    if (this.availabilityFilter()) params['isAvailable'] = this.availabilityFilter();

    this.api.getPaginated<Product>('/catalog/products', params).subscribe({
      next: (res) => {
        this.products.set(res.data || []);
        this.totalPages.set(res.pagination?.totalPages || 1);
        this.total.set(res.pagination?.total || 0);
        this.currentPage.set(res.pagination?.page || 1);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearchChange(value: string) {
    this.search.set(value);
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.currentPage.set(1);
      this.loadProducts();
    }, 400);
  }

  onCategoryChange(value: string) {
    this.selectedCategory.set(value);
    this.currentPage.set(1);
    this.loadProducts();
  }

  onAvailabilityChange(value: string) {
    this.availabilityFilter.set(value);
    this.currentPage.set(1);
    this.loadProducts();
  }

  goToPage(page: number) {
    this.currentPage.set(page);
    this.loadProducts();
  }

  deleteProduct(product: Product) {
    if (confirm(`Delete "${product.name}"? This action cannot be undone.`)) {
      this.api.delete(`/catalog/products/${product.id}`).subscribe({
        next: () => this.loadProducts(),
      });
    }
  }
}
