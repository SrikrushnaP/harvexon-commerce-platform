import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '@frontend/shared-data-access';

interface Category {
  id: string;
  name: string;
}

interface Unit {
  id: string;
  name: string;
  shortName: string;
}

interface Brand {
  id: string;
  name: string;
}

@Component({
  selector: 'app-catalog-form',
  standalone: true,
  imports: [RouterModule, ReactiveFormsModule],
  template: `
    <div class="page-header">
      <div>
        <h1>{{ isEdit() ? 'Edit Product' : 'Add Product' }}</h1>
        <p class="subtitle">{{ isEdit() ? 'Update product information' : 'Add a new product to the catalog' }}</p>
      </div>
      <a routerLink="/catalog" class="btn btn-secondary">← Back to Products</a>
    </div>

    @if (loading()) {
      <div class="loading">Loading...</div>
    } @else {
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form-card">
        <div class="form-grid">
          <div class="form-section">
            <h3>Basic Information</h3>

            <div class="form-group">
              <label for="name">Product Name *</label>
              <input id="name" formControlName="name" type="text" placeholder="Enter product name" />
              @if (form.get('name')?.invalid && form.get('name')?.touched) {
                <span class="error">Product name is required</span>
              }
            </div>

            <div class="form-group">
              <label for="sku">SKU</label>
              <input id="sku" formControlName="sku" type="text" placeholder="e.g. PROD-001" />
            </div>

            <div class="form-group">
              <label for="description">Description</label>
              <textarea id="description" formControlName="description" rows="3" placeholder="Product description..."></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="category">Category *</label>
                <select id="category" formControlName="category">
                  <option value="">Select category</option>
                  @for (cat of categories(); track cat.id) {
                    <option [value]="cat.id">{{ cat.name }}</option>
                  }
                </select>
                @if (form.get('category')?.invalid && form.get('category')?.touched) {
                  <span class="error">Category is required</span>
                }
              </div>
              <div class="form-group">
                <label for="unit">Unit *</label>
                <select id="unit" formControlName="unit">
                  <option value="">Select unit</option>
                  @for (unit of units(); track unit.id) {
                    <option [value]="unit.id">{{ unit.name }} ({{ unit.shortName }})</option>
                  }
                </select>
                @if (form.get('unit')?.invalid && form.get('unit')?.touched) {
                  <span class="error">Unit is required</span>
                }
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="basePrice">Base Price (₹) *</label>
                <input id="basePrice" formControlName="basePrice" type="number" min="0" step="0.01" placeholder="0.00" />
                @if (form.get('basePrice')?.invalid && form.get('basePrice')?.touched) {
                  <span class="error">Price is required and must be >= 0</span>
                }
              </div>
              <div class="form-group">
                <label for="brand">Brand</label>
                <select id="brand" formControlName="brand">
                  <option value="">No brand</option>
                  @for (brand of brands(); track brand.id) {
                    <option [value]="brand.id">{{ brand.name }}</option>
                  }
                </select>
              </div>
            </div>

            <div class="form-group">
              <label for="images">Product Images (URLs, one per line)</label>
              <textarea id="images" formControlName="images" rows="3" placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"></textarea>
              <span class="hint">Enter image URLs, one per line</span>
            </div>
          </div>

          <div class="form-section">
            <h3>Settings</h3>

            <div class="form-row">
              <div class="form-group">
                <label for="sortOrder">Sort Order</label>
                <input id="sortOrder" formControlName="sortOrder" type="number" min="0" placeholder="0" />
              </div>
              <div class="form-group">
                <label for="lowStockThreshold">Low Stock Threshold</label>
                <input id="lowStockThreshold" formControlName="lowStockThreshold" type="number" min="0" placeholder="10" />
              </div>
            </div>

            <div class="form-group">
              <label for="tags">Tags (comma-separated)</label>
              <input id="tags" formControlName="tags" type="text" placeholder="e.g. organic, fresh, dairy" />
            </div>

            <div class="checkboxes">
              <label class="checkbox-label">
                <input type="checkbox" formControlName="isAvailable" />
                <span>Available for sale</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" formControlName="isFeatured" />
                <span>Featured product</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" formControlName="trackInventory" />
                <span>Track inventory</span>
              </label>
            </div>
          </div>
        </div>

        @if (errorMessage()) {
          <div class="form-error">{{ errorMessage() }}</div>
        }

        <div class="form-actions">
          <a routerLink="/catalog" class="btn btn-secondary">Cancel</a>
          <button type="submit" class="btn btn-primary" [disabled]="saving()">
            {{ saving() ? 'Saving...' : (isEdit() ? 'Update Product' : 'Create Product') }}
          </button>
        </div>
      </form>
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
      &:hover:not(:disabled) { background: #2563eb; }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }
    .btn-secondary {
      background: #fff;
      color: #374151;
      border: 1px solid #e2e8f0;
      &:hover { background: #f8fafc; border-color: #cbd5e1; }
    }
    .loading { color: #64748b; padding: 3rem; text-align: center; }
    .form-card {
      background: #fff;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      border: 1px solid #f1f5f9;
    }
    .form-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 2rem;
      @media (max-width: 900px) { grid-template-columns: 1fr; }
    }
    .form-section {
      h3 {
        margin: 0 0 1.25rem;
        font-size: 1rem;
        color: #334155;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid #f1f5f9;
      }
    }
    .form-group {
      margin-bottom: 1rem;
      label {
        display: block;
        font-size: 0.8rem;
        font-weight: 500;
        color: #374151;
        margin-bottom: 0.35rem;
      }
      input, select, textarea {
        width: 100%;
        padding: 0.5rem 0.75rem;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 0.875rem;
        outline: none;
        transition: border-color 0.15s;
        background: #fff;
        &:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
      }
      textarea { resize: vertical; font-family: inherit; }
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .checkboxes {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 1rem;
    }
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: #374151;
      cursor: pointer;
      input[type="checkbox"] {
        width: 16px;
        height: 16px;
        accent-color: #3b82f6;
      }
    }
    .error {
      font-size: 0.75rem;
      color: #dc2626;
      margin-top: 0.25rem;
    }
    .hint {
      font-size: 0.7rem;
      color: #9ca3af;
      margin-top: 0.25rem;
    }
    .form-error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-size: 0.875rem;
      margin-top: 1.5rem;
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid #f1f5f9;
    }
  `],
})
export class CatalogFormPage implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  isEdit = signal(false);
  loading = signal(false);
  saving = signal(false);
  errorMessage = signal('');
  categories = signal<Category[]>([]);
  units = signal<Unit[]>([]);
  brands = signal<Brand[]>([]);

  private productId = '';

  form: FormGroup = this.fb.group({
    name: ['', Validators.required],
    sku: [''],
    description: [''],
    category: ['', Validators.required],
    unit: ['', Validators.required],
    basePrice: [0, [Validators.required, Validators.min(0)]],
    brand: [''],
    images: [''],
    sortOrder: [0],
    tags: [''],
    isAvailable: [true],
    isFeatured: [false],
    trackInventory: [true],
    lowStockThreshold: [10],
  });

  ngOnInit() {
    this.loadCategories();
    this.loadUnits();
    this.loadBrands();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.productId = id;
      this.loadProduct(id);
    }
  }

  loadCategories() {
    this.api.getPaginated<Category>('/catalog/categories', { limit: 100 }).subscribe({
      next: (res) => this.categories.set(res.data || []),
    });
  }

  loadUnits() {
    this.api.get<{ units: Unit[] }>('/catalog/units').subscribe({
      next: (res) => this.units.set(res.data?.units || []),
    });
  }

  loadBrands() {
    this.api.get<{ brands: Brand[] }>('/catalog/brands').subscribe({
      next: (res) => this.brands.set(res.data?.brands || []),
    });
  }

  loadProduct(id: string) {
    this.loading.set(true);
    this.api.get<any>(`/catalog/products/${id}`).subscribe({
      next: (res) => {
        const p = res.data?.product;
        if (p) {
          this.form.patchValue({
            name: p.name || '',
            sku: p.sku || '',
            description: p.description || '',
            category: p.category?.id || p.category || '',
            unit: p.unit?.id || p.unit || '',
            basePrice: p.basePrice || 0,
            brand: p.brand?.id || p.brand || '',
            images: (p.images || []).join('\n'),
            sortOrder: p.sortOrder || 0,
            tags: (p.tags || []).join(', '),
            isAvailable: p.isAvailable ?? true,
            isFeatured: p.isFeatured ?? false,
            trackInventory: p.trackInventory ?? true,
            lowStockThreshold: p.lowStockThreshold ?? 10,
          });
        }
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load product');
        this.loading.set(false);
      },
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');

    const formValue = this.form.value;
    const body: any = {
      name: formValue.name,
      category: formValue.category,
      unit: formValue.unit,
      basePrice: Number(formValue.basePrice),
      isAvailable: formValue.isAvailable,
      isFeatured: formValue.isFeatured,
      trackInventory: formValue.trackInventory,
      sortOrder: Number(formValue.sortOrder) || 0,
      lowStockThreshold: Number(formValue.lowStockThreshold) || 10,
    };

    if (formValue.sku) body.sku = formValue.sku;
    if (formValue.description) body.description = formValue.description;
    if (formValue.brand) body.brand = formValue.brand;
    if (formValue.tags) {
      body.tags = formValue.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t);
    }
    if (formValue.images) {
      body.images = formValue.images.split('\n').map((u: string) => u.trim()).filter((u: string) => u);
    }

    const request$ = this.isEdit()
      ? this.api.patch(`/catalog/products/${this.productId}`, body)
      : this.api.post('/catalog/products', body);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/catalog']);
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(err?.error?.message || 'Failed to save product. Please try again.');
      },
    });
  }
}
