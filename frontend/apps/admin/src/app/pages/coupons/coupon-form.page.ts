import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '@frontend/shared-data-access';

@Component({
  selector: 'app-coupon-form',
  standalone: true,
  imports: [RouterModule, FormsModule],
  template: `
    <div class="page-header">
      <h1>{{ isEdit() ? 'Edit Coupon' : 'Create Coupon' }}</h1>
      <a routerLink="/coupons" class="btn btn-secondary">← Back to Coupons</a>
    </div>

    <form (ngSubmit)="onSubmit()" #couponForm="ngForm" class="form-card">
      <div class="form-grid">
        <!-- Code -->
        <div class="form-group">
          <label for="code">Code *</label>
          <div class="input-with-btn">
            <input
              id="code"
              name="code"
              [(ngModel)]="formData.code"
              required
              minlength="3"
              maxlength="30"
              placeholder="SUMMER20"
              class="uppercase"
              #codeField="ngModel"
            />
            <button type="button" (click)="generateCode()" class="btn btn-secondary btn-sm">Generate</button>
          </div>
          @if (codeField.invalid && codeField.touched) {
            <span class="error">Code is required (3-30 characters)</span>
          }
        </div>

        <!-- Title -->
        <div class="form-group">
          <label for="title">Title *</label>
          <input
            id="title"
            name="title"
            [(ngModel)]="formData.title"
            required
            minlength="3"
            placeholder="Summer Sale 20% Off"
            #titleField="ngModel"
          />
          @if (titleField.invalid && titleField.touched) {
            <span class="error">Title is required (min 3 characters)</span>
          }
        </div>

        <!-- Description -->
        <div class="form-group full-width">
          <label for="description">Description</label>
          <textarea
            id="description"
            name="description"
            [(ngModel)]="formData.description"
            rows="3"
            placeholder="Coupon description for customers"
          ></textarea>
        </div>

        <!-- Type -->
        <div class="form-group">
          <label for="type">Type *</label>
          <select id="type" name="type" [(ngModel)]="formData.type" required #typeField="ngModel" (ngModelChange)="onTypeChange()">
            <option value="">Select type</option>
            @for (t of couponTypes; track t.value) {
              <option [value]="t.value">{{ t.label }}</option>
            }
          </select>
          @if (typeField.invalid && typeField.touched) {
            <span class="error">Type is required</span>
          }
        </div>

        <!-- Conditional fields based on type -->
        @if (formData.type === 'percentage' || formData.type === 'first_order') {
          <div class="form-group">
            <label for="discountPercent">Discount Percent *</label>
            <input
              id="discountPercent"
              name="discountPercent"
              type="number"
              [(ngModel)]="formData.discountPercent"
              required
              min="1"
              max="100"
              placeholder="20"
              #discountPercentField="ngModel"
            />
            @if (discountPercentField.invalid && discountPercentField.touched) {
              <span class="error">Enter a value between 1 and 100</span>
            }
          </div>
          <div class="form-group">
            <label for="maxDiscount">Max Discount (₹)</label>
            <input
              id="maxDiscount"
              name="maxDiscount"
              type="number"
              [(ngModel)]="formData.maxDiscount"
              min="0"
              placeholder="150 (0 = no limit)"
            />
          </div>
        }

        @if (formData.type === 'flat') {
          <div class="form-group">
            <label for="flatAmount">Flat Amount (₹) *</label>
            <input
              id="flatAmount"
              name="flatAmount"
              type="number"
              [(ngModel)]="formData.flatAmount"
              required
              min="1"
              placeholder="100"
              #flatAmountField="ngModel"
            />
            @if (flatAmountField.invalid && flatAmountField.touched) {
              <span class="error">Flat amount is required</span>
            }
          </div>
        }

        @if (formData.type === 'product_special_price') {
          <div class="form-group">
            <label for="productSearch">Product *</label>
            <input
              id="productSearch"
              name="productSearch"
              type="text"
              [(ngModel)]="productSearchQuery"
              (input)="searchProducts()"
              placeholder="Search product by name..."
            />
            @if (productResults().length > 0) {
              <div class="search-results">
                @for (product of productResults(); track product.id) {
                  <button type="button" class="search-result-item" (click)="selectProduct(product)">
                    {{ product.name }} — ₹{{ product.price }}
                  </button>
                }
              </div>
            }
            @if (formData.productId) {
              <span class="selected-product">Selected: {{ selectedProductName() }}</span>
            }
          </div>
          <div class="form-group">
            <label for="specialPrice">Special Price (₹) *</label>
            <input
              id="specialPrice"
              name="specialPrice"
              type="number"
              [(ngModel)]="formData.specialPrice"
              required
              min="0"
              placeholder="49"
              #specialPriceField="ngModel"
            />
            @if (specialPriceField.invalid && specialPriceField.touched) {
              <span class="error">Special price is required</span>
            }
          </div>
          <div class="form-group">
            <label for="quantity">Quantity</label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              [(ngModel)]="formData.quantity"
              min="1"
              placeholder="1"
            />
          </div>
        }

        @if (formData.type === 'buy_x_get_y') {
          <div class="form-group">
            <label for="bxgyProductSearch">Product *</label>
            <input
              id="bxgyProductSearch"
              name="bxgyProductSearch"
              type="text"
              [(ngModel)]="productSearchQuery"
              (input)="searchProducts()"
              placeholder="Search product by name..."
            />
            @if (productResults().length > 0) {
              <div class="search-results">
                @for (product of productResults(); track product.id) {
                  <button type="button" class="search-result-item" (click)="selectProduct(product)">
                    {{ product.name }} — ₹{{ product.price }}
                  </button>
                }
              </div>
            }
            @if (formData.productId) {
              <span class="selected-product">Selected: {{ selectedProductName() }}</span>
            }
          </div>
          <div class="form-group">
            <label for="buyQty">Buy Quantity *</label>
            <input
              id="buyQty"
              name="buyQty"
              type="number"
              [(ngModel)]="formData.buyQty"
              required
              min="1"
              placeholder="2"
              #buyQtyField="ngModel"
            />
            @if (buyQtyField.invalid && buyQtyField.touched) {
              <span class="error">Buy quantity is required</span>
            }
          </div>
          <div class="form-group">
            <label for="getQty">Get Quantity (free) *</label>
            <input
              id="getQty"
              name="getQty"
              type="number"
              [(ngModel)]="formData.getQty"
              required
              min="1"
              placeholder="1"
              #getQtyField="ngModel"
            />
            @if (getQtyField.invalid && getQtyField.touched) {
              <span class="error">Get quantity is required</span>
            }
          </div>
        }

        @if (formData.type === 'free_delivery') {
          <div class="form-group">
            <span class="info-text">No additional configuration needed for free delivery coupons.</span>
          </div>
        }

        <!-- Common fields -->
        <div class="form-group">
          <label for="minCartValue">Min Cart Value (₹)</label>
          <input
            id="minCartValue"
            name="minCartValue"
            type="number"
            [(ngModel)]="formData.minCartValue"
            min="0"
            placeholder="0 (no minimum)"
          />
        </div>

        <div class="form-group">
          <label for="maxTotalUses">Max Total Uses</label>
          <input
            id="maxTotalUses"
            name="maxTotalUses"
            type="number"
            [(ngModel)]="formData.maxTotalUses"
            min="0"
            placeholder="0 = unlimited"
          />
        </div>

        <div class="form-group">
          <label for="maxUsesPerCustomer">Max Uses Per Customer</label>
          <input
            id="maxUsesPerCustomer"
            name="maxUsesPerCustomer"
            type="number"
            [(ngModel)]="formData.maxUsesPerCustomer"
            min="0"
            placeholder="0 = unlimited"
          />
        </div>

        <div class="form-group">
          <label for="startDate">Start Date *</label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            [(ngModel)]="formData.startDate"
            required
            #startDateField="ngModel"
          />
          @if (startDateField.invalid && startDateField.touched) {
            <span class="error">Start date is required</span>
          }
        </div>

        <div class="form-group">
          <label for="endDate">End Date *</label>
          <input
            id="endDate"
            name="endDate"
            type="date"
            [(ngModel)]="formData.endDate"
            required
            #endDateField="ngModel"
          />
          @if (endDateField.invalid && endDateField.touched) {
            <span class="error">End date is required</span>
          }
        </div>

        <div class="form-group checkbox-group">
          <label class="checkbox-label">
            <input
              type="checkbox"
              name="isCombinable"
              [(ngModel)]="formData.isCombinable"
            />
            <span>Combinable with other coupons</span>
          </label>
        </div>

        <div class="form-group checkbox-group">
          <label class="checkbox-label">
            <input
              type="checkbox"
              name="autoApply"
              [(ngModel)]="formData.autoApply"
            />
            <span>Auto-apply when conditions met</span>
          </label>
        </div>

        @if (isEdit()) {
          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                name="isActive"
                [(ngModel)]="formData.isActive"
              />
              <span>Active</span>
            </label>
          </div>
        }
      </div>

      @if (serverError()) {
        <div class="server-error">{{ serverError() }}</div>
      }

      <div class="form-actions">
        <a routerLink="/coupons" class="btn btn-secondary">Cancel</a>
        <button type="submit" class="btn btn-primary" [disabled]="submitting()">
          {{ submitting() ? 'Saving...' : (isEdit() ? 'Update Coupon' : 'Create Coupon') }}
        </button>
      </div>
    </form>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .page-header h1 { margin: 0; color: #1e293b; font-size: 1.5rem; }
    .btn { padding: 0.6rem 1.2rem; border-radius: 8px; text-decoration: none; font-size: 0.875rem; font-weight: 500; cursor: pointer; border: none; display: inline-block; }
    .btn-primary { background: #3b82f6; color: #fff; }
    .btn-primary:hover { background: #2563eb; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-secondary { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
    .btn-secondary:hover { background: #e2e8f0; }
    .btn-sm { padding: 0.4rem 0.8rem; font-size: 0.8rem; }
    .form-card {
      background: #fff; border-radius: 12px; padding: 2rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06); border: 1px solid #f1f5f9;
    }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.4rem; }
    .form-group.full-width { grid-column: 1 / -1; }
    label { font-size: 0.8rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.03em; }
    input, select, textarea {
      padding: 0.6rem 0.75rem; border: 1px solid #e2e8f0; border-radius: 8px;
      font-size: 0.875rem; outline: none; font-family: inherit;
      &:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
    }
    input[type="checkbox"] { width: auto; margin: 0; }
    textarea { resize: vertical; }
    .uppercase { text-transform: uppercase; }
    .input-with-btn { display: flex; gap: 0.5rem; align-items: stretch; }
    .input-with-btn input { flex: 1; }
    .error { font-size: 0.75rem; color: #dc2626; }
    .info-text { font-size: 0.85rem; color: #64748b; font-style: italic; padding-top: 0.5rem; }
    .server-error { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.875rem; }
    .form-actions { display: flex; justify-content: flex-end; gap: 0.75rem; padding-top: 1rem; border-top: 1px solid #f1f5f9; }
    .checkbox-group { justify-content: center; }
    .checkbox-label {
      display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.875rem;
      font-weight: 400; text-transform: none; letter-spacing: normal; color: #334155;
    }
    .search-results {
      border: 1px solid #e2e8f0; border-radius: 8px; max-height: 150px; overflow-y: auto;
      background: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    .search-result-item {
      display: block; width: 100%; text-align: left; padding: 0.5rem 0.75rem;
      border: none; background: none; cursor: pointer; font-size: 0.85rem; color: #334155;
      &:hover { background: #f1f5f9; }
      & + & { border-top: 1px solid #f1f5f9; }
    }
    .selected-product { font-size: 0.8rem; color: #16a34a; font-weight: 500; }
    @media (max-width: 768px) { .form-grid { grid-template-columns: 1fr; } }
  `],
})
export class CouponFormPage implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEdit = signal(false);
  submitting = signal(false);
  serverError = signal('');
  productResults = signal<any[]>([]);
  selectedProductName = signal('');
  private couponId = '';
  private productSearchTimeout: any;

  couponTypes = [
    { value: 'percentage', label: 'Percentage' },
    { value: 'flat', label: 'Flat' },
    { value: 'product_special_price', label: 'Product Special Price' },
    { value: 'buy_x_get_y', label: 'Buy X Get Y' },
    { value: 'free_delivery', label: 'Free Delivery' },
    { value: 'first_order', label: 'First Order' },
  ];

  formData: any = {
    code: '',
    title: '',
    description: '',
    type: '',
    discountPercent: null,
    maxDiscount: null,
    flatAmount: null,
    productId: '',
    specialPrice: null,
    quantity: 1,
    buyQty: null,
    getQty: null,
    minCartValue: null,
    maxTotalUses: 0,
    maxUsesPerCustomer: 0,
    startDate: '',
    endDate: '',
    isCombinable: false,
    autoApply: false,
    isActive: true,
  };

  productSearchQuery = '';

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.couponId = id;
      this.loadCoupon(id);
    }
  }

  loadCoupon(id: string) {
    this.api.get<any>(`/coupons/${id}`).subscribe({
      next: (res) => {
        const c = res.data?.coupon;
        if (c) {
          this.formData = {
            code: c.code || '',
            title: c.title || '',
            description: c.description || '',
            type: c.type || '',
            discountPercent: c.discountPercent ?? null,
            maxDiscount: c.maxDiscount ?? null,
            flatAmount: c.flatAmount ?? null,
            productId: c.productCondition?.product?.id || c.buyXGetY?.product?.id || '',
            specialPrice: c.productCondition?.specialPrice ?? null,
            quantity: c.productCondition?.quantity ?? 1,
            buyQty: c.buyXGetY?.buyQty ?? null,
            getQty: c.buyXGetY?.getQty ?? null,
            minCartValue: c.minCartValue ?? null,
            maxTotalUses: c.maxTotalUses ?? 0,
            maxUsesPerCustomer: c.maxUsesPerCustomer ?? 0,
            startDate: c.startDate ? c.startDate.substring(0, 10) : '',
            endDate: c.endDate ? c.endDate.substring(0, 10) : '',
            isCombinable: c.isCombinable ?? false,
            autoApply: c.autoApply ?? false,
            isActive: c.isActive ?? true,
          };
          const productName = c.productCondition?.product?.name || c.buyXGetY?.product?.name;
          if (productName) {
            this.selectedProductName.set(productName);
            this.productSearchQuery = productName;
          }
        }
      },
    });
  }

  onTypeChange() {
    // Reset type-specific fields when type changes
    this.formData.discountPercent = null;
    this.formData.maxDiscount = null;
    this.formData.flatAmount = null;
    this.formData.productId = '';
    this.formData.specialPrice = null;
    this.formData.quantity = 1;
    this.formData.buyQty = null;
    this.formData.getQty = null;
    this.productSearchQuery = '';
    this.selectedProductName.set('');
    this.productResults.set([]);
  }

  generateCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.formData.code = code;
  }

  searchProducts() {
    clearTimeout(this.productSearchTimeout);
    this.productSearchTimeout = setTimeout(() => {
      if (this.productSearchQuery.length < 2) {
        this.productResults.set([]);
        return;
      }
      this.api.get<any>('/catalog/products', { search: this.productSearchQuery, limit: 10 }).subscribe({
        next: (res) => {
          this.productResults.set(res.data || []);
        },
      });
    }, 300);
  }

  selectProduct(product: any) {
    this.formData.productId = product.id;
    this.selectedProductName.set(product.name);
    this.productSearchQuery = product.name;
    this.productResults.set([]);
  }

  onSubmit() {
    this.serverError.set('');

    // Basic validation
    if (!this.formData.code || !this.formData.title || !this.formData.type || !this.formData.startDate || !this.formData.endDate) {
      this.serverError.set('Please fill in all required fields.');
      return;
    }

    this.submitting.set(true);

    const body: any = {
      code: this.formData.code.toUpperCase(),
      title: this.formData.title,
      description: this.formData.description || undefined,
      type: this.formData.type,
      minCartValue: this.formData.minCartValue || 0,
      maxTotalUses: this.formData.maxTotalUses || 0,
      maxUsesPerCustomer: this.formData.maxUsesPerCustomer || 0,
      startDate: new Date(this.formData.startDate).toISOString(),
      endDate: new Date(this.formData.endDate + 'T23:59:59').toISOString(),
      isCombinable: this.formData.isCombinable,
      autoApply: this.formData.autoApply,
    };

    if (this.isEdit()) {
      body.isActive = this.formData.isActive;
    }

    // Add type-specific fields
    switch (this.formData.type) {
      case 'percentage':
      case 'first_order':
        body.discountPercent = this.formData.discountPercent;
        if (this.formData.maxDiscount) body.maxDiscount = this.formData.maxDiscount;
        break;
      case 'flat':
        body.flatAmount = this.formData.flatAmount;
        break;
      case 'product_special_price':
        body.productCondition = {
          product: this.formData.productId,
          specialPrice: this.formData.specialPrice,
          quantity: this.formData.quantity || 1,
        };
        break;
      case 'buy_x_get_y':
        body.buyXGetY = {
          product: this.formData.productId,
          buyQty: this.formData.buyQty,
          getQty: this.formData.getQty,
        };
        break;
    }

    const req$ = this.isEdit()
      ? this.api.patch(`/coupons/${this.couponId}`, body)
      : this.api.post('/coupons', body);

    req$.subscribe({
      next: () => {
        this.router.navigate(['/coupons']);
      },
      error: (err) => {
        this.submitting.set(false);
        const errData = err.error;
        if (errData?.errors && Array.isArray(errData.errors)) {
          this.serverError.set(errData.errors.map((e: any) => `${e.field}: ${e.message}`).join(', '));
        } else {
          this.serverError.set(errData?.message || 'An error occurred');
        }
      },
    });
  }
}
