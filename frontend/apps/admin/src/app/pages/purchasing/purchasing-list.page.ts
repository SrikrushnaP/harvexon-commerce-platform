import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';
import { ApiService } from '@frontend/shared-data-access';

@Component({
  selector: 'app-purchasing-list',
  standalone: true,
  imports: [RouterModule, DecimalPipe, DatePipe],
  template: `
    <div class="page-header">
      <div>
        <h1>Purchase Orders</h1>
        <p class="subtitle">Manage purchase orders and procurement</p>
      </div>
      <div class="header-actions">
        <a routerLink="suppliers" class="btn btn-secondary">🏭 Suppliers</a>
        <button (click)="openNewPO()" class="btn btn-primary">+ New PO</button>
      </div>
    </div>

    <div class="filters-bar">
      <select (change)="onStatusFilter($event)" class="filter-select">
        <option value="">All Statuses</option>
        <option value="draft" [selected]="statusFilter() === 'draft'">Draft</option>
        <option value="ordered" [selected]="statusFilter() === 'ordered'">Ordered</option>
        <option value="partial" [selected]="statusFilter() === 'partial'">Partial</option>
        <option value="received" [selected]="statusFilter() === 'received'">Received</option>
        <option value="cancelled" [selected]="statusFilter() === 'cancelled'">Cancelled</option>
      </select>
      <select (change)="onSupplierFilter($event)" class="filter-select">
        <option value="">All Suppliers</option>
        @for (supplier of suppliers(); track supplier.id) {
          <option [value]="supplier.id" [selected]="supplierFilter() === supplier.id">{{ supplier.name }}</option>
        }
      </select>
    </div>

    @if (loading()) {
      <div class="loading">Loading purchase orders...</div>
    } @else {
      <div class="table-card">
        <table>
          <thead>
            <tr>
              <th>PO #</th>
              <th>Supplier</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            @for (po of purchases(); track po.id) {
              <tr class="clickable-row" [routerLink]="['detail', po.id]">
                <td class="po-number">{{ po.purchaseNumber }}</td>
                <td>{{ po.supplier?.name || '—' }}</td>
                <td>{{ po.items?.length || 0 }} items</td>
                <td class="amount">₹{{ po.total | number }}</td>
                <td>
                  <span class="status-badge" [attr.data-status]="po.status">{{ po.status }}</span>
                </td>
                <td>
                  <span class="payment-badge" [attr.data-payment]="po.paymentStatus">{{ po.paymentStatus }}</span>
                </td>
                <td>{{ po.purchaseDate | date:'mediumDate' }}</td>
              </tr>
            } @empty {
              <tr>
                <td colspan="7" class="empty">No purchase orders found</td>
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

    @if (showNewPOForm()) {
      <div class="modal-overlay" (click)="closeNewPO()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>New Purchase Order</h2>
            <button class="close-btn" (click)="closeNewPO()">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Supplier *</label>
              <select #poSupplier class="form-input">
                <option value="">Select supplier</option>
                @for (supplier of suppliers(); track supplier.id) {
                  <option [value]="supplier.id">{{ supplier.name }}</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label>Expected Delivery Date</label>
              <input type="date" #poDate class="form-input" />
            </div>
            <div class="form-group">
              <label>Notes</label>
              <textarea #poNotes rows="3" class="form-input" placeholder="Optional notes"></textarea>
            </div>

            <h3>Items</h3>
            @for (item of newPOItems(); track $index) {
              <div class="item-row">
                <input placeholder="Product name" [value]="item.name" (input)="updateItem($index, 'name', $event)" class="form-input" />
                <input type="number" placeholder="Qty" [value]="item.quantity" (input)="updateItem($index, 'quantity', $event)" class="form-input item-sm" />
                <input type="number" placeholder="Unit Cost" [value]="item.unitCost" (input)="updateItem($index, 'unitCost', $event)" class="form-input item-md" />
                <button class="remove-item-btn" (click)="removeItem($index)">✕</button>
              </div>
            }
            <button (click)="addItem()" class="btn btn-secondary btn-sm">+ Add Item</button>
          </div>
          <div class="modal-footer">
            @if (formError()) {
              <span class="form-error">{{ formError() }}</span>
            }
            <button (click)="closeNewPO()" class="btn btn-secondary">Cancel</button>
            <button (click)="createPO(poSupplier.value, poDate.value, poNotes.value)" class="btn btn-primary" [disabled]="submitting()">
              {{ submitting() ? 'Creating...' : 'Create PO' }}
            </button>
          </div>
        </div>
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
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-secondary { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
    .btn-secondary:hover { background: #e2e8f0; }
    .btn-sm { padding: 0.4rem 0.8rem; font-size: 0.8rem; }
    .filters-bar { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
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
    .clickable-row { cursor: pointer; &:hover { background: #f8fafc; } }
    .po-number { font-weight: 600; color: #3b82f6; }
    .amount { font-weight: 600; color: #1e293b; }
    .status-badge {
      padding: 0.2rem 0.6rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 500; text-transform: capitalize;
      background: #f1f5f9; color: #475569;
      &[data-status="draft"] { background: #f1f5f9; color: #475569; }
      &[data-status="ordered"] { background: #dbeafe; color: #1d4ed8; }
      &[data-status="partial"] { background: #fef3c7; color: #d97706; }
      &[data-status="received"] { background: #dcfce7; color: #16a34a; }
      &[data-status="cancelled"] { background: #fee2e2; color: #dc2626; }
    }
    .payment-badge {
      padding: 0.2rem 0.6rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 500; text-transform: capitalize;
      background: #f1f5f9; color: #475569;
      &[data-payment="pending"] { background: #fef3c7; color: #d97706; }
      &[data-payment="partial"] { background: #dbeafe; color: #1d4ed8; }
      &[data-payment="paid"] { background: #dcfce7; color: #16a34a; }
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

    /* Modal Styles */
    .modal-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center; z-index: 1000;
    }
    .modal {
      background: #fff; border-radius: 12px; width: 90%; max-width: 640px; max-height: 90vh; overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0,0,0,0.15);
    }
    .modal-header {
      display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
      h2 { margin: 0; font-size: 1.125rem; color: #1e293b; }
    }
    .close-btn { background: none; border: none; font-size: 1.25rem; cursor: pointer; color: #64748b; padding: 0.25rem; }
    .modal-body { padding: 1.5rem; h3 { margin: 1.25rem 0 0.75rem; font-size: 0.95rem; color: #334155; } }
    .modal-footer {
      display: flex; justify-content: flex-end; align-items: center; gap: 0.75rem; padding: 1rem 1.5rem;
      border-top: 1px solid #e2e8f0;
    }
    .form-group { margin-bottom: 1rem; label { display: block; font-size: 0.8rem; color: #475569; margin-bottom: 0.3rem; font-weight: 500; } }
    .form-input {
      width: 100%; padding: 0.6rem 0.75rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.875rem;
      &:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
    }
    .item-row { display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem; }
    .item-sm { max-width: 80px; }
    .item-md { max-width: 120px; }
    .remove-item-btn { background: none; border: none; color: #dc2626; cursor: pointer; font-size: 1rem; padding: 0.25rem 0.5rem; }
    .form-error { color: #dc2626; font-size: 0.8rem; margin-right: auto; }
  `],
})
export class PurchasingListPage implements OnInit {
  private api = inject(ApiService);

  purchases = signal<any[]>([]);
  suppliers = signal<any[]>([]);
  loading = signal(true);
  statusFilter = signal('');
  supplierFilter = signal('');
  page = signal(1);
  total = signal(0);
  totalPages = signal(0);

  showNewPOForm = signal(false);
  newPOItems = signal<any[]>([{ name: '', quantity: 1, unitCost: 0 }]);
  submitting = signal(false);
  formError = signal('');

  ngOnInit() {
    this.loadSuppliers();
    this.loadPurchases();
  }

  loadSuppliers() {
    this.api.get<any>('/purchasing/suppliers').subscribe({
      next: (res) => {
        this.suppliers.set(res.data || []);
      },
    });
  }

  loadPurchases() {
    this.loading.set(true);
    const params: Record<string, any> = { page: this.page(), limit: 20 };
    if (this.statusFilter()) params['status'] = this.statusFilter();
    if (this.supplierFilter()) params['supplier'] = this.supplierFilter();

    this.api.getPaginated<any>('/purchasing/purchases', params).subscribe({
      next: (res) => {
        this.purchases.set(res.data || []);
        this.total.set(res.pagination?.total || 0);
        this.totalPages.set(res.pagination?.totalPages || 0);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onStatusFilter(event: Event) {
    this.statusFilter.set((event.target as HTMLSelectElement).value);
    this.page.set(1);
    this.loadPurchases();
  }

  onSupplierFilter(event: Event) {
    this.supplierFilter.set((event.target as HTMLSelectElement).value);
    this.page.set(1);
    this.loadPurchases();
  }

  goToPage(p: number) {
    this.page.set(p);
    this.loadPurchases();
  }

  openNewPO() {
    this.showNewPOForm.set(true);
    this.newPOItems.set([{ name: '', quantity: 1, unitCost: 0 }]);
    this.formError.set('');
  }

  closeNewPO() {
    this.showNewPOForm.set(false);
  }

  addItem() {
    this.newPOItems.update(items => [...items, { name: '', quantity: 1, unitCost: 0 }]);
  }

  removeItem(index: number) {
    this.newPOItems.update(items => items.filter((_, i) => i !== index));
  }

  updateItem(index: number, field: string, event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.newPOItems.update(items => {
      const updated = [...items];
      updated[index] = { ...updated[index], [field]: field === 'name' ? value : Number(value) };
      return updated;
    });
  }

  createPO(supplierId: string, expectedDate: string, notes: string) {
    if (!supplierId) {
      this.formError.set('Please select a supplier');
      return;
    }
    const items = this.newPOItems().filter(i => i.name && i.quantity > 0);
    if (items.length === 0) {
      this.formError.set('Please add at least one item');
      return;
    }

    this.submitting.set(true);
    this.formError.set('');

    const body: any = {
      supplier: supplierId,
      items: items.map(i => ({
        name: i.name,
        quantity: i.quantity,
        unitCost: i.unitCost,
        total: i.quantity * i.unitCost,
      })),
    };
    if (notes) body.notes = notes;
    if (expectedDate) body.expectedDeliveryDate = expectedDate;

    this.api.post<any>('/purchasing/purchases', body).subscribe({
      next: () => {
        this.submitting.set(false);
        this.closeNewPO();
        this.loadPurchases();
      },
      error: (err) => {
        this.submitting.set(false);
        this.formError.set(err?.error?.message || 'Failed to create purchase order');
      },
    });
  }
}
