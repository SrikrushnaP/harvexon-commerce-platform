import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '@frontend/shared-data-access';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  parent: { id: string; name: string } | null;
  sortOrder: number;
}

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [RouterModule, ReactiveFormsModule],
  template: `
    <div class="page-header">
      <div>
        <h1>Categories</h1>
        <p class="subtitle">Manage product categories</p>
      </div>
      <div class="header-actions">
        <a routerLink="/catalog" class="btn btn-secondary">← Back to Products</a>
        <button (click)="openForm()" class="btn btn-primary">+ Add Category</button>
      </div>
    </div>

    @if (showForm()) {
      <div class="modal-overlay" (click)="closeForm()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ editingId() ? 'Edit Category' : 'Add Category' }}</h2>
            <button class="close-btn" (click)="closeForm()">✕</button>
          </div>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="modal-body">
              <div class="form-group">
                <label for="name">Name *</label>
                <input id="name" formControlName="name" type="text" placeholder="Category name" />
                @if (form.get('name')?.invalid && form.get('name')?.touched) {
                  <span class="error">Name is required</span>
                }
              </div>
              <div class="form-group">
                <label for="description">Description</label>
                <textarea id="description" formControlName="description" rows="2" placeholder="Optional description"></textarea>
              </div>
              <div class="form-group">
                <label for="image">Image URL</label>
                <input id="image" formControlName="image" type="text" placeholder="https://..." />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="parent">Parent Category</label>
                  <select id="parent" formControlName="parent">
                    <option value="">None (top-level)</option>
                    @for (cat of parentOptions(); track cat.id) {
                      <option [value]="cat.id">{{ cat.name }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label for="sortOrder">Sort Order</label>
                  <input id="sortOrder" formControlName="sortOrder" type="number" min="0" placeholder="0" />
                </div>
              </div>
            </div>
            @if (errorMessage()) {
              <div class="form-error">{{ errorMessage() }}</div>
            }
            <div class="modal-footer">
              <button type="button" (click)="closeForm()" class="btn btn-secondary">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="saving()">
                {{ saving() ? 'Saving...' : (editingId() ? 'Update' : 'Create') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    @if (loading()) {
      <div class="loading">Loading categories...</div>
    } @else {
      <div class="table-card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Parent</th>
              <th>Sort Order</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (cat of categories(); track cat.id) {
              <tr>
                <td>
                  <div class="cat-name">
                    @if (cat.image) {
                      <img [src]="cat.image" class="cat-img" alt="" />
                    }
                    <span class="name">{{ cat.name }}</span>
                  </div>
                </td>
                <td><span class="slug">{{ cat.slug }}</span></td>
                <td>{{ cat.parent?.name || '—' }}</td>
                <td>{{ cat.sortOrder }}</td>
                <td>
                  <div class="actions">
                    <button (click)="editCategory(cat)" class="btn-icon" title="Edit">✏️</button>
                    <button (click)="deleteCategory(cat)" class="btn-icon danger" title="Delete">🗑️</button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5" class="empty">No categories found. Create your first category!</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (totalPages() > 1) {
        <div class="pagination">
          <button (click)="goToPage(currentPage() - 1)" [disabled]="currentPage() <= 1" class="btn btn-sm">← Previous</button>
          <span class="page-info">Page {{ currentPage() }} of {{ totalPages() }}</span>
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
    .loading { color: #64748b; padding: 3rem; text-align: center; }
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
    .cat-name {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      .name { font-weight: 500; color: #1e293b; }
    }
    .cat-img {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      object-fit: cover;
      background: #f1f5f9;
    }
    .slug { font-family: monospace; color: #64748b; font-size: 0.8rem; }
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
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-top: 1rem;
      padding: 1rem;
    }
    .page-info { font-size: 0.8rem; color: #64748b; }
    .empty { text-align: center; color: #94a3b8; padding: 2rem !important; }

    /* Modal */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal {
      background: #fff;
      border-radius: 12px;
      width: 100%;
      max-width: 520px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.15);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #f1f5f9;
      h2 { margin: 0; font-size: 1.125rem; color: #1e293b; }
    }
    .close-btn {
      background: none;
      border: none;
      font-size: 1.25rem;
      color: #64748b;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 4px;
      &:hover { background: #f1f5f9; color: #1e293b; }
    }
    .modal-body { padding: 1.5rem; }
    .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid #f1f5f9;
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
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
    .error { font-size: 0.75rem; color: #dc2626; margin-top: 0.25rem; }
    .form-error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-size: 0.875rem;
      margin: 0 1.5rem;
    }
  `],
})
export class CategoriesPage implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);

  categories = signal<Category[]>([]);
  loading = signal(true);
  showForm = signal(false);
  saving = signal(false);
  editingId = signal('');
  errorMessage = signal('');
  currentPage = signal(1);
  totalPages = signal(1);

  form: FormGroup = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    image: [''],
    parent: [''],
    sortOrder: [0],
  });

  parentOptions = signal<Category[]>([]);

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.loading.set(true);
    this.api.getPaginated<Category>('/catalog/categories', { page: this.currentPage(), limit: 20 }).subscribe({
      next: (res) => {
        this.categories.set(res.data || []);
        this.totalPages.set(res.pagination?.totalPages || 1);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openForm() {
    this.editingId.set('');
    this.errorMessage.set('');
    this.form.reset({ name: '', description: '', image: '', parent: '', sortOrder: 0 });
    this.updateParentOptions();
    this.showForm.set(true);
  }

  editCategory(cat: Category) {
    this.editingId.set(cat.id);
    this.errorMessage.set('');
    this.form.patchValue({
      name: cat.name,
      description: cat.description || '',
      image: cat.image || '',
      parent: cat.parent?.id || '',
      sortOrder: cat.sortOrder || 0,
    });
    this.updateParentOptions(cat.id);
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.editingId.set('');
    this.errorMessage.set('');
  }

  updateParentOptions(excludeId?: string) {
    const options = this.categories().filter(c => c.id !== excludeId);
    this.parentOptions.set(options);
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');

    const formValue = this.form.value;
    const body: any = { name: formValue.name };
    if (formValue.description) body.description = formValue.description;
    if (formValue.image) body.image = formValue.image;
    if (formValue.parent) body.parent = formValue.parent;
    body.sortOrder = Number(formValue.sortOrder) || 0;

    const request$ = this.editingId()
      ? this.api.patch(`/catalog/categories/${this.editingId()}`, body)
      : this.api.post('/catalog/categories', body);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.loadCategories();
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(err?.error?.message || 'Failed to save category');
      },
    });
  }

  deleteCategory(cat: Category) {
    if (confirm(`Delete category "${cat.name}"? This cannot be undone.`)) {
      this.api.delete(`/catalog/categories/${cat.id}`).subscribe({
        next: () => this.loadCategories(),
      });
    }
  }

  goToPage(page: number) {
    this.currentPage.set(page);
    this.loadCategories();
  }
}
