import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '@frontend/shared-data-access';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-customer-groups',
  standalone: true,
  imports: [RouterModule, ReactiveFormsModule, DecimalPipe],
  template: `
    <div class="page-header">
      <div>
        <h1>Customer Groups</h1>
        <p class="subtitle">Manage pricing tiers and customer segments</p>
      </div>
      <div class="header-actions">
        <a routerLink="/customers" class="btn btn-secondary">← Back to Customers</a>
        <button (click)="openForm()" class="btn btn-primary">+ Add Group</button>
      </div>
    </div>

    @if (showForm()) {
      <div class="form-card">
        <h2>{{ editingId() ? 'Edit Group' : 'New Group' }}</h2>
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-grid">
            <div class="form-group">
              <label for="name">Name *</label>
              <input id="name" formControlName="name" placeholder="e.g., Wholesale Buyers" />
            </div>
            <div class="form-group">
              <label for="type">Type *</label>
              <select id="type" formControlName="type">
                <option value="">Select type</option>
                <option value="retail">Retail</option>
                <option value="wholesale">Wholesale</option>
                <option value="distributor">Distributor</option>
                <option value="restaurant">Restaurant</option>
                <option value="vip">VIP</option>
              </select>
            </div>
            <div class="form-group">
              <label for="discountPercent">Discount %</label>
              <input id="discountPercent" formControlName="discountPercent" type="number" min="0" max="100" />
            </div>
            <div class="form-group">
              <label for="minOrderAmount">Min Order Amount (₹)</label>
              <input id="minOrderAmount" formControlName="minOrderAmount" type="number" min="0" />
            </div>
            <div class="form-group">
              <label for="creditLimit">Credit Limit (₹)</label>
              <input id="creditLimit" formControlName="creditLimit" type="number" min="0" />
            </div>
            <div class="form-group">
              <label for="creditPeriodDays">Credit Period (days)</label>
              <input id="creditPeriodDays" formControlName="creditPeriodDays" type="number" min="0" />
            </div>
            <div class="form-group full-width">
              <label for="description">Description</label>
              <textarea id="description" formControlName="description" rows="2" placeholder="Group description"></textarea>
            </div>
            <div class="form-group full-width">
              <label for="paymentTerms">Payment Terms</label>
              <input id="paymentTerms" formControlName="paymentTerms" placeholder="e.g., Net 30, COD only" />
            </div>
          </div>
          @if (serverError()) {
            <div class="server-error">{{ serverError() }}</div>
          }
          <div class="form-actions">
            <button type="button" (click)="cancelForm()" class="btn btn-secondary">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="submitting()">
              {{ submitting() ? 'Saving...' : (editingId() ? 'Update' : 'Create') }}
            </button>
          </div>
        </form>
      </div>
    }

    @if (loading()) {
      <div class="loading">Loading groups...</div>
    } @else {
      <div class="table-card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Discount</th>
              <th>Min Order</th>
              <th>Credit Limit</th>
              <th>Credit Period</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (group of groups(); track group.id) {
              <tr>
                <td>
                  <strong>{{ group.name }}</strong>
                  @if (group.description) {
                    <span class="desc">{{ group.description }}</span>
                  }
                </td>
                <td><span class="type-badge" [attr.data-type]="group.type">{{ group.type }}</span></td>
                <td>{{ group.discountPercent }}%</td>
                <td>₹{{ group.minOrderAmount | number }}</td>
                <td>₹{{ group.creditLimit | number }}</td>
                <td>{{ group.creditPeriodDays }} days</td>
                <td class="actions-cell">
                  <button (click)="editGroup(group)" class="action-btn" title="Edit">✏️</button>
                  <button (click)="deleteGroup(group)" class="action-btn delete" title="Delete">🗑️</button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="7" class="empty">No customer groups configured</td>
              </tr>
            }
          </tbody>
        </table>
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
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-secondary { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
    .btn-secondary:hover { background: #e2e8f0; }
    .form-card {
      background: #fff; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06); border: 1px solid #f1f5f9;
      h2 { margin: 0 0 1rem; font-size: 1rem; color: #334155; }
    }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.3rem; }
    .form-group.full-width { grid-column: 1 / -1; }
    label { font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; }
    input, select, textarea {
      padding: 0.5rem 0.75rem; border: 1px solid #e2e8f0; border-radius: 8px;
      font-size: 0.875rem; outline: none; font-family: inherit;
      &:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
    }
    textarea { resize: vertical; }
    .server-error { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 0.5rem 0.75rem; border-radius: 8px; margin-bottom: 0.75rem; font-size: 0.85rem; }
    .form-actions { display: flex; justify-content: flex-end; gap: 0.75rem; }
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
    td { padding: 0.75rem 1rem; border-bottom: 1px solid #f1f5f9; font-size: 0.875rem; color: #334155; vertical-align: top; }
    td strong { display: block; }
    .desc { font-size: 0.75rem; color: #94a3b8; }
    .type-badge {
      padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: 500; text-transform: capitalize;
      background: #f1f5f9; color: #475569;
      &[data-type="retail"] { background: #dbeafe; color: #1d4ed8; }
      &[data-type="wholesale"] { background: #dcfce7; color: #16a34a; }
      &[data-type="distributor"] { background: #fef3c7; color: #d97706; }
      &[data-type="restaurant"] { background: #ede9fe; color: #6d28d9; }
      &[data-type="vip"] { background: #fce7f3; color: #db2777; }
    }
    .actions-cell { white-space: nowrap; }
    .action-btn {
      background: none; border: none; cursor: pointer; padding: 0.25rem 0.4rem;
      border-radius: 4px; font-size: 0.875rem;
      &:hover { background: #f1f5f9; }
      &.delete:hover { background: #fee2e2; }
    }
    .empty { text-align: center; color: #94a3b8; padding: 2rem; }
    @media (max-width: 768px) { .form-grid { grid-template-columns: 1fr; } }
  `],
})
export class CustomerGroupsPage implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);

  groups = signal<any[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editingId = signal<string | null>(null);
  submitting = signal(false);
  serverError = signal('');

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    type: ['', [Validators.required]],
    description: [''],
    discountPercent: [0],
    minOrderAmount: [0],
    creditLimit: [0],
    creditPeriodDays: [0],
    paymentTerms: [''],
  });

  ngOnInit() {
    this.loadGroups();
  }

  loadGroups() {
    this.loading.set(true);
    this.api.get<any>('/customers/groups').subscribe({
      next: (res) => {
        this.groups.set(res.data?.groups || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openForm() {
    this.form.reset({ discountPercent: 0, minOrderAmount: 0, creditLimit: 0, creditPeriodDays: 0 });
    this.editingId.set(null);
    this.serverError.set('');
    this.showForm.set(true);
  }

  cancelForm() {
    this.showForm.set(false);
    this.editingId.set(null);
  }

  editGroup(group: any) {
    this.editingId.set(group.id);
    this.form.patchValue({
      name: group.name,
      type: group.type,
      description: group.description || '',
      discountPercent: group.discountPercent || 0,
      minOrderAmount: group.minOrderAmount || 0,
      creditLimit: group.creditLimit || 0,
      creditPeriodDays: group.creditPeriodDays || 0,
      paymentTerms: group.paymentTerms || '',
    });
    this.serverError.set('');
    this.showForm.set(true);
  }

  deleteGroup(group: any) {
    if (!confirm(`Delete group "${group.name}"? This cannot be undone.`)) return;
    this.api.delete(`/customers/groups/${group.id}`).subscribe({
      next: () => this.loadGroups(),
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
      type: val.type,
      discountPercent: val.discountPercent || 0,
      minOrderAmount: val.minOrderAmount || 0,
      creditLimit: val.creditLimit || 0,
      creditPeriodDays: val.creditPeriodDays || 0,
    };
    if (val.description) body.description = val.description;
    if (val.paymentTerms) body.paymentTerms = val.paymentTerms;

    const req$ = this.editingId()
      ? this.api.patch(`/customers/groups/${this.editingId()}`, body)
      : this.api.post('/customers/groups', body);

    req$.subscribe({
      next: () => {
        this.showForm.set(false);
        this.editingId.set(null);
        this.submitting.set(false);
        this.loadGroups();
      },
      error: (err) => {
        this.submitting.set(false);
        this.serverError.set(err.error?.message || 'An error occurred');
      },
    });
  }
}
