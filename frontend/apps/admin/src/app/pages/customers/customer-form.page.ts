import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '@frontend/shared-data-access';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [RouterModule, ReactiveFormsModule],
  template: `
    <div class="page-header">
      <h1>{{ isEdit() ? 'Edit Customer' : 'Add Customer' }}</h1>
      <a routerLink="/customers" class="btn btn-secondary">← Back to Customers</a>
    </div>

    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form-card">
      <div class="form-grid">
        <div class="form-group">
          <label for="name">Name *</label>
          <input id="name" formControlName="name" placeholder="Customer name" />
          @if (form.get('name')?.invalid && form.get('name')?.touched) {
            <span class="error">Name is required (2-200 chars)</span>
          }
        </div>

        <div class="form-group">
          <label for="phone">Phone *</label>
          <input id="phone" formControlName="phone" placeholder="10-digit phone number" />
          @if (form.get('phone')?.invalid && form.get('phone')?.touched) {
            <span class="error">Valid phone number is required</span>
          }
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input id="email" formControlName="email" type="email" placeholder="customer@example.com" />
          @if (form.get('email')?.invalid && form.get('email')?.touched) {
            <span class="error">Invalid email format</span>
          }
        </div>

        <div class="form-group">
          <label for="group">Customer Group *</label>
          <select id="group" formControlName="group">
            <option value="">Select group</option>
            @for (g of groups(); track g.id) {
              <option [value]="g.id">{{ g.name }}</option>
            }
          </select>
          @if (form.get('group')?.invalid && form.get('group')?.touched) {
            <span class="error">Group is required</span>
          }
        </div>

        <div class="form-group">
          <label for="businessName">Business Name</label>
          <input id="businessName" formControlName="businessName" placeholder="Business name (optional)" />
        </div>

        <div class="form-group">
          <label for="gstin">GSTIN</label>
          <input id="gstin" formControlName="gstin" placeholder="GST number (optional)" />
        </div>

        <div class="form-group full-width">
          <label for="notes">Notes</label>
          <textarea id="notes" formControlName="notes" rows="3" placeholder="Internal notes about this customer"></textarea>
        </div>

        <div class="form-group full-width">
          <label for="tags">Tags (comma-separated)</label>
          <input id="tags" formControlName="tags" placeholder="regular, priority, bulk-buyer" />
        </div>
      </div>

      @if (serverError()) {
        <div class="server-error">{{ serverError() }}</div>
      }

      <div class="form-actions">
        <a routerLink="/customers" class="btn btn-secondary">Cancel</a>
        <button type="submit" class="btn btn-primary" [disabled]="submitting()">
          {{ submitting() ? 'Saving...' : (isEdit() ? 'Update Customer' : 'Create Customer') }}
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
    textarea { resize: vertical; }
    .error { font-size: 0.75rem; color: #dc2626; }
    .server-error { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.875rem; }
    .form-actions { display: flex; justify-content: flex-end; gap: 0.75rem; padding-top: 1rem; border-top: 1px solid #f1f5f9; }
    @media (max-width: 768px) { .form-grid { grid-template-columns: 1fr; } }
  `],
})
export class CustomerFormPage implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEdit = signal(false);
  groups = signal<any[]>([]);
  submitting = signal(false);
  serverError = signal('');
  private customerId = '';

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    phone: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(15)]],
    email: ['', [Validators.email]],
    group: ['', [Validators.required]],
    businessName: [''],
    gstin: [''],
    notes: [''],
    tags: [''],
  });

  ngOnInit() {
    this.loadGroups();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.customerId = id;
      this.loadCustomer(id);
    }
  }

  loadGroups() {
    this.api.get<any>('/customers/groups').subscribe({
      next: (res) => this.groups.set(res.data?.groups || []),
    });
  }

  loadCustomer(id: string) {
    this.api.get<any>(`/customers/${id}`).subscribe({
      next: (res) => {
        const c = res.data?.customer;
        if (c) {
          this.form.patchValue({
            name: c.name,
            phone: c.phone,
            email: c.email || '',
            group: c.group?.id || c.group || '',
            businessName: c.businessName || '',
            gstin: c.gstin || '',
            notes: c.notes || '',
            tags: (c.tags || []).join(', '),
          });
        }
      },
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.serverError.set('');

    const val = this.form.value;
    const body: any = {
      name: val.name,
      phone: val.phone,
      group: val.group,
    };
    if (val.email) body.email = val.email;
    if (val.businessName) body.businessName = val.businessName;
    if (val.gstin) body.gstin = val.gstin;
    if (val.notes) body.notes = val.notes;
    if (val.tags) {
      body.tags = val.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
    }

    const req$ = this.isEdit()
      ? this.api.patch(`/customers/${this.customerId}`, body)
      : this.api.post('/customers', body);

    req$.subscribe({
      next: () => {
        this.router.navigate(['/customers']);
      },
      error: (err) => {
        this.submitting.set(false);
        this.serverError.set(err.error?.message || 'An error occurred');
      },
    });
  }
}
