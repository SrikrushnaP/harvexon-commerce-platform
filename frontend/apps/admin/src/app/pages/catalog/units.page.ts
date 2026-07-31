import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '@frontend/shared-data-access';

interface Unit {
  id: string;
  name: string;
  shortName: string;
}

@Component({
  selector: 'app-units',
  standalone: true,
  imports: [RouterModule, ReactiveFormsModule],
  template: `
    <div class="page-header">
      <div>
        <h1>Units</h1>
        <p class="subtitle">Manage measurement units for products</p>
      </div>
      <div class="header-actions">
        <a routerLink="/catalog" class="btn btn-secondary">← Back to Products</a>
        <button (click)="openForm()" class="btn btn-primary">+ Add Unit</button>
      </div>
    </div>

    <div class="content-grid">
      @if (showForm()) {
        <div class="form-card">
          <h3>{{ editingId() ? 'Edit Unit' : 'New Unit' }}</h3>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label for="name">Name *</label>
              <input id="name" formControlName="name" type="text" placeholder="e.g. Kilogram" />
              @if (form.get('name')?.invalid && form.get('name')?.touched) {
                <span class="error">Name is required</span>
              }
            </div>
            <div class="form-group">
              <label for="shortName">Short Name *</label>
              <input id="shortName" formControlName="shortName" type="text" placeholder="e.g. kg" />
              @if (form.get('shortName')?.invalid && form.get('shortName')?.touched) {
                <span class="error">Short name is required</span>
              }
            </div>
            @if (errorMessage()) {
              <div class="form-error">{{ errorMessage() }}</div>
            }
            <div class="form-actions">
              <button type="button" (click)="closeForm()" class="btn btn-secondary">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="saving()">
                {{ saving() ? 'Saving...' : (editingId() ? 'Update' : 'Create') }}
              </button>
            </div>
          </form>
        </div>
      }

      @if (loading()) {
        <div class="loading">Loading units...</div>
      } @else {
        <div class="table-card">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Short Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (unit of units(); track unit.id) {
                <tr>
                  <td class="unit-name">{{ unit.name }}</td>
                  <td><span class="short-name">{{ unit.shortName }}</span></td>
                  <td>
                    <div class="actions">
                      <button (click)="editUnit(unit)" class="btn-icon" title="Edit">✏️</button>
                      <button (click)="deleteUnit(unit)" class="btn-icon danger" title="Delete">🗑️</button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="3" class="empty">No units found. Create your first unit!</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
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
    .header-actions { display: flex; gap: 0.5rem; }
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
    .content-grid {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .loading { color: #64748b; padding: 3rem; text-align: center; }
    .form-card {
      background: #fff;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      border: 1px solid #f1f5f9;
      max-width: 480px;
      h3 {
        margin: 0 0 1.25rem;
        font-size: 1rem;
        color: #334155;
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
      input {
        width: 100%;
        padding: 0.5rem 0.75rem;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 0.875rem;
        outline: none;
        background: #fff;
        &:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
      }
    }
    .error { font-size: 0.75rem; color: #dc2626; margin-top: 0.25rem; }
    .form-error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.25rem;
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
    .unit-name { font-weight: 500; color: #1e293b; }
    .short-name {
      background: #f1f5f9;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-family: monospace;
      font-size: 0.8rem;
      color: #475569;
    }
    .actions { display: flex; gap: 0.25rem; }
    .btn-icon {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      font-size: 0.875rem;
      transition: background 0.15s;
      &:hover { background: #f1f5f9; }
      &.danger:hover { background: #fee2e2; }
    }
    .empty { text-align: center; color: #94a3b8; padding: 2rem !important; }
  `],
})
export class UnitsPage implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);

  units = signal<Unit[]>([]);
  loading = signal(true);
  showForm = signal(false);
  saving = signal(false);
  editingId = signal('');
  errorMessage = signal('');

  form: FormGroup = this.fb.group({
    name: ['', Validators.required],
    shortName: ['', Validators.required],
  });

  ngOnInit() {
    this.loadUnits();
  }

  loadUnits() {
    this.loading.set(true);
    this.api.get<{ units: Unit[] }>('/catalog/units').subscribe({
      next: (res) => {
        this.units.set(res.data?.units || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openForm() {
    this.editingId.set('');
    this.errorMessage.set('');
    this.form.reset({ name: '', shortName: '' });
    this.showForm.set(true);
  }

  editUnit(unit: Unit) {
    this.editingId.set(unit.id);
    this.errorMessage.set('');
    this.form.patchValue({ name: unit.name, shortName: unit.shortName });
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.editingId.set('');
    this.errorMessage.set('');
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');

    const body = { name: this.form.value.name, shortName: this.form.value.shortName };

    const request$ = this.editingId()
      ? this.api.patch(`/catalog/units/${this.editingId()}`, body)
      : this.api.post('/catalog/units', body);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.loadUnits();
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(err?.error?.message || 'Failed to save unit');
      },
    });
  }

  deleteUnit(unit: Unit) {
    if (confirm(`Delete unit "${unit.name}"? This cannot be undone.`)) {
      this.api.delete(`/catalog/units/${unit.id}`).subscribe({
        next: () => this.loadUnits(),
      });
    }
  }
}
