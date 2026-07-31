import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '@frontend/shared-data-access';

interface ProductOption {
  id: string;
  name: string;
  sku: string;
}

@Component({
  selector: 'app-inventory-adjust',
  standalone: true,
  imports: [RouterModule, ReactiveFormsModule],
  template: `
    <div class="page-header">
      <div>
        <h1>Adjust Stock</h1>
        <p class="subtitle">Manually adjust product inventory levels</p>
      </div>
      <div class="header-actions">
        <a routerLink="/inventory" class="btn btn-secondary">← Back to Inventory</a>
      </div>
    </div>

    @if (success()) {
      <div class="success-card">
        <div class="success-icon">✓</div>
        <h3>Stock Adjusted Successfully</h3>
        <p>The inventory has been updated.</p>
        <div class="success-actions">
          <button (click)="resetForm()" class="btn btn-primary">Adjust Another</button>
          <a routerLink="/inventory" class="btn btn-secondary">View Inventory</a>
        </div>
      </div>
    } @else {
      <div class="form-card">
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="product">Product *</label>
            <select id="product" formControlName="product" class="form-control">
              <option value="">Select a product...</option>
              @for (p of products(); track p.id) {
                <option [value]="p.id">{{ p.name }} ({{ p.sku }})</option>
              }
            </select>
            @if (form.get('product')?.touched && form.get('product')?.invalid) {
              <span class="error-text">Product is required</span>
            }
          </div>

          <div class="form-group">
            <label>Direction *</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" formControlName="direction" value="in" />
                <span class="radio-btn radio-in">↑ Stock In</span>
              </label>
              <label class="radio-label">
                <input type="radio" formControlName="direction" value="out" />
                <span class="radio-btn radio-out">↓ Stock Out</span>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label for="quantity">Quantity *</label>
            <input
              id="quantity"
              type="number"
              formControlName="quantity"
              class="form-control"
              placeholder="Enter quantity"
              min="0.01"
              step="0.01"
            />
            @if (form.get('quantity')?.touched && form.get('quantity')?.invalid) {
              <span class="error-text">Valid quantity is required</span>
            }
          </div>

          <div class="form-group">
            <label for="notes">Notes</label>
            <textarea
              id="notes"
              formControlName="notes"
              class="form-control textarea"
              placeholder="Reason for adjustment (optional)"
              rows="3"
            ></textarea>
          </div>

          @if (error()) {
            <div class="error-banner">{{ error() }}</div>
          }

          <button
            type="submit"
            class="btn btn-primary btn-submit"
            [disabled]="form.invalid || submitting()"
          >
            @if (submitting()) {
              Adjusting...
            } @else {
              Submit Adjustment
            }
          </button>
        </form>
      </div>
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
    .btn-primary:disabled { background: #93c5fd; cursor: not-allowed; }
    .btn-secondary { background: #fff; color: #334155; border: 1px solid #e2e8f0; }
    .btn-secondary:hover { background: #f1f5f9; }
    .btn-submit { width: 100%; justify-content: center; padding: 0.75rem; font-size: 0.9rem; }
    .form-card {
      background: #fff; border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      border: 1px solid #f1f5f9; padding: 2rem; max-width: 540px;
    }
    .form-group { margin-bottom: 1.25rem; }
    .form-group label {
      display: block; font-size: 0.8rem; font-weight: 600;
      color: #374151; margin-bottom: 0.4rem;
    }
    .form-control {
      width: 100%; padding: 0.6rem 0.85rem; border: 1px solid #e2e8f0;
      border-radius: 8px; font-size: 0.875rem; outline: none;
      background: #fff; color: #1e293b;
    }
    .form-control:focus {
      border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
    }
    .textarea { resize: vertical; min-height: 80px; font-family: inherit; }
    select.form-control { cursor: pointer; }
    .radio-group { display: flex; gap: 0.75rem; }
    .radio-label { cursor: pointer; }
    .radio-label input { display: none; }
    .radio-btn {
      display: inline-block; padding: 0.5rem 1.25rem; border-radius: 8px;
      border: 1px solid #e2e8f0; font-size: 0.85rem; font-weight: 500;
      transition: all 0.15s;
    }
    .radio-label input:checked + .radio-in {
      background: #dcfce7; border-color: #16a34a; color: #16a34a;
    }
    .radio-label input:checked + .radio-out {
      background: #fee2e2; border-color: #dc2626; color: #dc2626;
    }
    .error-text { color: #dc2626; font-size: 0.75rem; margin-top: 0.25rem; display: block; }
    .error-banner {
      background: #fee2e2; color: #dc2626; padding: 0.75rem 1rem;
      border-radius: 8px; font-size: 0.85rem; margin-bottom: 1rem;
    }
    .success-card {
      background: #fff; border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      border: 1px solid #f1f5f9; padding: 3rem; max-width: 540px; text-align: center;
    }
    .success-icon {
      width: 56px; height: 56px; border-radius: 50%; background: #dcfce7;
      color: #16a34a; font-size: 1.5rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;
    }
    .success-card h3 { color: #1e293b; margin: 0 0 0.5rem; }
    .success-card p { color: #64748b; margin: 0 0 1.5rem; font-size: 0.9rem; }
    .success-actions { display: flex; gap: 0.75rem; justify-content: center; }
  `],
})
export class InventoryAdjustPage implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);

  products = signal<ProductOption[]>([]);
  submitting = signal(false);
  success = signal(false);
  error = signal('');

  form = this.fb.nonNullable.group({
    product: ['', Validators.required],
    direction: ['in', Validators.required],
    quantity: [null as number | null, [Validators.required, Validators.min(0.01)]],
    notes: [''],
  });

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.api.get<any[]>('/catalog/products', { limit: 500 }).subscribe({
      next: (res) => {
        const data = res.data || [];
        this.products.set(
          data.map((p: any) => ({ id: p.id, name: p.name, sku: p.sku }))
        );
      },
      error: () => {},
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.submitting.set(true);
    this.error.set('');

    const { product, direction, quantity, notes } = this.form.getRawValue();

    this.api.post<any>('/inventory/adjust', {
      product,
      quantity,
      direction,
      notes: notes || undefined,
    }).subscribe({
      next: (res) => {
        this.submitting.set(false);
        if (res.success) {
          this.success.set(true);
        } else {
          this.error.set(res.message || 'Adjustment failed');
        }
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set(err?.error?.message || 'Adjustment failed. Please try again.');
      },
    });
  }

  resetForm() {
    this.form.reset({ product: '', direction: 'in', quantity: null, notes: '' });
    this.success.set(false);
    this.error.set('');
  }
}
