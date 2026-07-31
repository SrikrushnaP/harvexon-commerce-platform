import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { ApiService } from '@frontend/shared-data-access';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [RouterModule, ReactiveFormsModule, DecimalPipe],
  template: `
    <div class="page-header">
      <div>
        <h1>Suppliers</h1>
        <p class="subtitle">Manage your supplier network</p>
      </div>
      <div class="header-actions">
        <a routerLink="/purchasing" class="btn btn-secondary">← Back to POs</a>
        <button (click)="openForm()" class="btn btn-primary">+ Add Supplier</button>
      </div>
    </div>

    @if (loading()) {
      <div class="loading">Loading suppliers...</div>
    } @else {
      <div class="table-card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact Person</th>
              <th>Phone</th>
              <th>Total Purchases</th>
              <th>Total Spent</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (supplier of suppliers(); track supplier.id) {
              <tr>
                <td class="name-cell">{{ supplier.name }}</td>
                <td>{{ supplier.contactPerson || '—' }}</td>
                <td>{{ supplier.phone }}</td>
                <td>{{ supplier.totalPurchases || 0 }}</td>
                <td class="amount">₹{{ (supplier.totalSpent || 0) | number }}</td>
                <td class="actions-cell">
                  <button (click)="editSupplier(supplier)" class="action-btn" title="Edit">✏️</button>
                  <button (click)="deleteSupplier(supplier)" class="action-btn delete" title="Delete">🗑️</button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" class="empty">No suppliers found. Add your first supplier to get started.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    @if (showForm()) {
      <div class="modal-overlay" (click)="cancelForm()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ editingId() ? 'Edit Supplier' : 'New Supplier' }}</h2>
            <button class="close-btn" (click)="cancelForm()">✕</button>
          </div>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="modal-body">
              <div class="form-grid">
                <div class="form-group">
                  <label for="name">Name *</label>
                  <input id="name" formControlName="name" class="form-input" placeholder="Supplier name" />
                </div>
                <div class="form-group">
                  <label for="phone">Phone *</label>
                  <input id="phone" formControlName="phone" class="form-input" placeholder="Phone number" />
                </div>
                <div class="form-group">
                  <label for="contactPerson">Contact Person</label>
                  <input id="contactPerson" formControlName="contactPerson" class="form-input" placeholder="Primary contact" />
                </div>
                <div class="form-group">
                  <label for="email">Email</label>
                  <input id="email" formControlName="email" type="email" class="form-input" placeholder="Email address" />
                </div>
                <div class="form-group">
                  <label for="gstin">GSTIN</label>
                  <input id="gstin" formControlName="gstin" class="form-input" placeholder="GST Number" />
                </div>
                <div class="form-group">
                  <label for="paymentTerms">Payment Terms</label>
                  <input id="paymentTerms" formControlName="paymentTerms" class="form-input" placeholder="e.g., Net 30" />
                </div>
              </div>

              <h3>Address</h3>
              <div class="form-grid" formGroupName="address">
                <div class="form-group">
                  <label for="line1">Line 1</label>
                  <input id="line1" formControlName="line1" class="form-input" placeholder="Address line 1" />
                </div>
                <div class="form-group">
                  <label for="line2">Line 2</label>
                  <input id="line2" formControlName="line2" class="form-input" placeholder="Address line 2" />
                </div>
                <div class="form-group">
                  <label for="city">City</label>
                  <input id="city" formControlName="city" class="form-input" placeholder="City" />
                </div>
                <div class="form-group">
                  <label for="state">State</label>
                  <input id="state" formControlName="state" class="form-input" placeholder="State" />
                </div>
                <div class="form-group">
                  <label for="pincode">Pincode</label>
                  <input id="pincode" formControlName="pincode" class="form-input" placeholder="Pincode" />
                </div>
              </div>

              <h3>Bank Details</h3>
              <div class="form-grid" formGroupName="bankDetails">
                <div class="form-group">
                  <label for="accountName">Account Name</label>
                  <input id="accountName" formControlName="accountName" class="form-input" placeholder="Account holder name" />
                </div>
                <div class="form-group">
                  <label for="accountNumber">Account Number</label>
                  <input id="accountNumber" formControlName="accountNumber" class="form-input" placeholder="Bank account number" />
                </div>
                <div class="form-group">
                  <label for="bankName">Bank Name</label>
                  <input id="bankName" formControlName="bankName" class="form-input" placeholder="Bank name" />
                </div>
                <div class="form-group">
                  <label for="ifsc">IFSC Code</label>
                  <input id="ifsc" formControlName="ifsc" class="form-input" placeholder="IFSC code" />
                </div>
              </div>

              <div class="form-group full-width">
                <label for="notes">Notes</label>
                <textarea id="notes" formControlName="notes" class="form-input" rows="3" placeholder="Additional notes"></textarea>
              </div>
              <div class="form-group full-width">
                <label for="tags">Tags (comma separated)</label>
                <input id="tags" formControlName="tags" class="form-input" placeholder="e.g., dairy, organic, local" />
              </div>
            </div>
            <div class="modal-footer">
              @if (serverError()) {
                <span class="form-error">{{ serverError() }}</span>
              }
              <button type="button" (click)="cancelForm()" class="btn btn-secondary">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="submitting()">
                {{ submitting() ? 'Saving...' : (editingId() ? 'Update' : 'Create') }}
              </button>
            </div>
          </form>
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
    .name-cell { font-weight: 500; color: #1e293b; }
    .amount { font-weight: 600; color: #16a34a; }
    .actions-cell { white-space: nowrap; }
    .action-btn {
      background: none; border: none; cursor: pointer; padding: 0.25rem 0.4rem;
      border-radius: 4px; font-size: 0.875rem;
      &:hover { background: #f1f5f9; }
      &.delete:hover { background: #fee2e2; }
    }
    .empty { text-align: center; color: #94a3b8; padding: 2rem; }

    /* Modal */
    .modal-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center; z-index: 1000;
    }
    .modal {
      background: #fff; border-radius: 12px; width: 90%; max-width: 700px; max-height: 90vh; overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0,0,0,0.15);
    }
    .modal-header {
      display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
      h2 { margin: 0; font-size: 1.125rem; color: #1e293b; }
    }
    .close-btn { background: none; border: none; font-size: 1.25rem; cursor: pointer; color: #64748b; padding: 0.25rem; }
    .modal-body {
      padding: 1.5rem;
      h3 { margin: 1.25rem 0 0.75rem; font-size: 0.9rem; color: #334155; font-weight: 600; }
    }
    .modal-footer {
      display: flex; justify-content: flex-end; align-items: center; gap: 0.75rem; padding: 1rem 1.5rem;
      border-top: 1px solid #e2e8f0;
    }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    @media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }
    .form-group { margin-bottom: 0.25rem; label { display: block; font-size: 0.8rem; color: #475569; margin-bottom: 0.3rem; font-weight: 500; } }
    .form-group.full-width { grid-column: 1 / -1; margin-top: 0.5rem; }
    .form-input {
      width: 100%; padding: 0.6rem 0.75rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.875rem;
      &:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
    }
    .form-error { color: #dc2626; font-size: 0.8rem; margin-right: auto; }
  `],
})
export class SuppliersPage implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);

  suppliers = signal<any[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editingId = signal<string | null>(null);
  submitting = signal(false);
  serverError = signal('');

  form = this.fb.group({
    name: ['', Validators.required],
    phone: ['', Validators.required],
    contactPerson: [''],
    email: [''],
    gstin: [''],
    paymentTerms: [''],
    address: this.fb.group({
      line1: [''],
      line2: [''],
      city: [''],
      state: [''],
      pincode: [''],
    }),
    bankDetails: this.fb.group({
      accountName: [''],
      accountNumber: [''],
      bankName: [''],
      ifsc: [''],
    }),
    notes: [''],
    tags: [''],
  });

  ngOnInit() {
    this.loadSuppliers();
  }

  loadSuppliers() {
    this.loading.set(true);
    this.api.get<any>('/purchasing/suppliers').subscribe({
      next: (res) => {
        this.suppliers.set(res.data || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openForm() {
    this.editingId.set(null);
    this.form.reset();
    this.serverError.set('');
    this.showForm.set(true);
  }

  editSupplier(supplier: any) {
    this.editingId.set(supplier.id);
    this.form.patchValue({
      name: supplier.name || '',
      phone: supplier.phone || '',
      contactPerson: supplier.contactPerson || '',
      email: supplier.email || '',
      gstin: supplier.gstin || '',
      paymentTerms: supplier.paymentTerms || '',
      address: {
        line1: supplier.address?.line1 || '',
        line2: supplier.address?.line2 || '',
        city: supplier.address?.city || '',
        state: supplier.address?.state || '',
        pincode: supplier.address?.pincode || '',
      },
      bankDetails: {
        accountName: supplier.bankDetails?.accountName || '',
        accountNumber: supplier.bankDetails?.accountNumber || '',
        bankName: supplier.bankDetails?.bankName || '',
        ifsc: supplier.bankDetails?.ifsc || '',
      },
      notes: supplier.notes || '',
      tags: supplier.tags?.join(', ') || '',
    });
    this.serverError.set('');
    this.showForm.set(true);
  }

  cancelForm() {
    this.showForm.set(false);
    this.editingId.set(null);
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.submitting.set(true);
    this.serverError.set('');

    const raw = this.form.getRawValue();
    const body: any = {
      name: raw.name,
      phone: raw.phone,
      contactPerson: raw.contactPerson || undefined,
      email: raw.email || undefined,
      gstin: raw.gstin || undefined,
      paymentTerms: raw.paymentTerms || undefined,
      address: raw.address,
      bankDetails: raw.bankDetails,
      notes: raw.notes || undefined,
      tags: raw.tags ? raw.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : undefined,
    };

    const request = this.editingId()
      ? this.api.patch<any>(`/purchasing/suppliers/${this.editingId()}`, body)
      : this.api.post<any>('/purchasing/suppliers', body);

    request.subscribe({
      next: () => {
        this.submitting.set(false);
        this.showForm.set(false);
        this.editingId.set(null);
        this.loadSuppliers();
      },
      error: (err) => {
        this.submitting.set(false);
        this.serverError.set(err?.error?.message || 'Operation failed');
      },
    });
  }

  deleteSupplier(supplier: any) {
    if (!confirm(`Delete supplier "${supplier.name}"? This cannot be undone.`)) return;
    this.api.delete(`/purchasing/suppliers/${supplier.id}`).subscribe({
      next: () => this.loadSuppliers(),
    });
  }
}
