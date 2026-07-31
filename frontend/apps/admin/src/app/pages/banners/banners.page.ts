import { Component, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ApiService } from '@frontend/shared-data-access';

interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  link?: string;
  type: 'offer' | 'announcement' | 'promo';
  bgColor: string;
  textColor: string;
  isActive: boolean;
  sortOrder: number;
  startDate?: string;
  endDate?: string;
}

@Component({
  selector: 'app-banners',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe],
  template: `
    <div class="page-header">
      <div>
        <h1>Banners & Offers</h1>
        <p class="subtitle">Manage promotional banners shown on the customer home page</p>
      </div>
      <button (click)="openForm()" class="btn btn-primary">+ New Banner</button>
    </div>

    @if (successMsg()) {
      <div class="alert alert-success">{{ successMsg() }}</div>
    }
    @if (errorMsg()) {
      <div class="alert alert-error">{{ errorMsg() }}</div>
    }

    <!-- Form -->
    @if (showForm()) {
      <div class="card form-card">
        <h2>{{ editingId() ? 'Edit Banner' : 'Create Banner' }}</h2>
        <form [formGroup]="form" (ngSubmit)="submitForm()">
          <div class="form-grid">
            <div class="form-group full-width">
              <label>Title *</label>
              <input formControlName="title" placeholder="e.g. 20% Off on All Vegetables" />
            </div>
            <div class="form-group full-width">
              <label>Subtitle</label>
              <input formControlName="subtitle" placeholder="e.g. Use code FRESH20. Valid till Sunday" />
            </div>
            <div class="form-group">
              <label>Type</label>
              <select formControlName="type">
                <option value="offer">🏷️ Offer</option>
                <option value="promo">🎉 Promo</option>
                <option value="announcement">📢 Announcement</option>
              </select>
            </div>
            <div class="form-group">
              <label>Link (optional)</label>
              <input formControlName="link" placeholder="/catalog or /catalog?category=fruits" />
            </div>
            <div class="form-group">
              <label>Image URL (optional)</label>
              <input formControlName="image" placeholder="https://..." />
            </div>
            <div class="form-group">
              <label>Sort Order</label>
              <input formControlName="sortOrder" type="number" min="0" />
            </div>
            <div class="form-group">
              <label>Background Color</label>
              <div class="color-row">
                <input formControlName="bgColor" type="color" class="color-input" />
                <input formControlName="bgColor" class="color-text" />
              </div>
            </div>
            <div class="form-group">
              <label>Text Color</label>
              <div class="color-row">
                <input formControlName="textColor" type="color" class="color-input" />
                <input formControlName="textColor" class="color-text" />
              </div>
            </div>
            <div class="form-group">
              <label>Start Date (optional)</label>
              <input formControlName="startDate" type="date" />
            </div>
            <div class="form-group">
              <label>End Date (optional)</label>
              <input formControlName="endDate" type="date" />
            </div>
            <div class="form-group full-width">
              <label class="toggle-label">
                <input type="checkbox" formControlName="isActive" />
                <span class="toggle-text">Active</span>
                <span class="toggle-hint">Only active banners are shown to customers</span>
              </label>
            </div>
          </div>

          <!-- Preview -->
          <div class="preview-section">
            <label>Preview</label>
            <div
              class="banner-preview"
              [style.background]="form.get('bgColor')?.value"
              [style.color]="form.get('textColor')?.value"
            >
              <div class="preview-content">
                <span class="preview-type">{{ form.get('type')?.value === 'offer' ? '🏷️ OFFER' : form.get('type')?.value === 'promo' ? '🎉 PROMO' : '📢' }}</span>
                <strong>{{ form.get('title')?.value || 'Banner title' }}</strong>
                @if (form.get('subtitle')?.value) {
                  <span class="preview-sub">{{ form.get('subtitle')?.value }}</span>
                }
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" (click)="closeForm()" class="btn btn-secondary">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="saving()">
              {{ saving() ? 'Saving...' : (editingId() ? 'Update' : 'Create') }}
            </button>
          </div>
        </form>
      </div>
    }

    <!-- Banners List -->
    @if (loading()) {
      <div class="loading">Loading banners...</div>
    } @else {
      <div class="banners-list">
        @for (banner of banners(); track banner.id) {
          <div class="banner-item" [class.inactive]="!banner.isActive">
            <div
              class="banner-swatch"
              [style.background]="banner.bgColor"
              [style.color]="banner.textColor"
            >
              <span class="swatch-type">{{ banner.type === 'offer' ? '🏷️' : banner.type === 'promo' ? '🎉' : '📢' }}</span>
            </div>
            <div class="banner-details">
              <div class="banner-title-row">
                <strong>{{ banner.title }}</strong>
                @if (!banner.isActive) { <span class="inactive-badge">Inactive</span> }
              </div>
              @if (banner.subtitle) { <span class="banner-sub">{{ banner.subtitle }}</span> }
              <div class="banner-meta">
                <span>Order: {{ banner.sortOrder }}</span>
                @if (banner.link) { <span>→ {{ banner.link }}</span> }
                @if (banner.startDate) { <span>From: {{ banner.startDate | date }}</span> }
                @if (banner.endDate) { <span>Until: {{ banner.endDate | date }}</span> }
              </div>
            </div>
            <div class="banner-actions">
              <button (click)="editBanner(banner)" class="action-btn" title="Edit">✏️</button>
              <button (click)="toggleActive(banner)" class="action-btn" [title]="banner.isActive ? 'Deactivate' : 'Activate'">
                {{ banner.isActive ? '🚫' : '✅' }}
              </button>
              <button (click)="deleteBanner(banner)" class="action-btn delete" title="Delete">🗑️</button>
            </div>
          </div>
        } @empty {
          <div class="empty-state">
            <div class="empty-icon">📢</div>
            <h3>No banners yet</h3>
            <p>Create your first promotional banner to show offers on the customer home page.</p>
            <button (click)="openForm()" class="btn btn-primary">+ Create Banner</button>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .page-header h1 { margin: 0 0 0.25rem; color: #1e293b; font-size: 1.5rem; }
    .subtitle { color: #64748b; margin: 0; font-size: 0.875rem; }
    .btn { padding: 0.6rem 1.2rem; border-radius: 8px; font-size: 0.875rem; font-weight: 500; cursor: pointer; border: none; }
    .btn-primary { background: #3b82f6; color: #fff; }
    .btn-primary:hover { background: #2563eb; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-secondary { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
    .btn-secondary:hover { background: #e2e8f0; }
    .alert { padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.875rem; }
    .alert-success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #16a34a; }
    .alert-error { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; }
    .card { background: #fff; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06); border: 1px solid #f1f5f9; }
    .card h2 { margin: 0 0 1.25rem; font-size: 1rem; color: #334155; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.3rem; }
    .form-group.full-width { grid-column: 1 / -1; }
    label { font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; }
    input, select {
      padding: 0.5rem 0.75rem; border: 1px solid #e2e8f0; border-radius: 8px;
      font-size: 0.875rem; outline: none; font-family: inherit;
    }
    input:focus, select:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
    .color-row { display: flex; gap: 8px; align-items: center; }
    .color-input { width: 40px; height: 36px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 2px; cursor: pointer; }
    .color-text { flex: 1; }
    .toggle-label { display: flex; align-items: center; flex-wrap: wrap; gap: 0.25rem; cursor: pointer; }
    .toggle-text { font-size: 0.875rem; font-weight: 500; color: #334155; text-transform: none; }
    .toggle-hint { width: 100%; font-size: 0.75rem; color: #94a3b8; margin-left: 1.5rem; text-transform: none; font-weight: 400; }
    input[type="checkbox"] { width: auto; margin-right: 0.5rem; }
    .form-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1rem; }

    /* Preview */
    .preview-section { margin-bottom: 1rem; }
    .preview-section > label { display: block; margin-bottom: 0.5rem; }
    .banner-preview {
      display: flex; align-items: center; gap: 12px;
      padding: 16px 20px; border-radius: 14px; min-height: 60px;
    }
    .preview-content { display: flex; flex-direction: column; gap: 3px; }
    .preview-type { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; opacity: 0.8; }
    .preview-content strong { font-size: 0.9rem; }
    .preview-sub { font-size: 0.8rem; opacity: 0.8; }

    /* List */
    .banners-list { display: flex; flex-direction: column; gap: 12px; }
    .banner-item {
      display: flex; align-items: center; gap: 14px;
      padding: 14px 16px; background: #fff; border-radius: 12px;
      border: 1px solid #f1f5f9; box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      transition: box-shadow 0.2s;
    }
    .banner-item:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .banner-item.inactive { opacity: 0.6; }
    .banner-swatch {
      width: 48px; height: 48px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.25rem; flex-shrink: 0;
    }
    .banner-details { flex: 1; min-width: 0; }
    .banner-title-row { display: flex; align-items: center; gap: 8px; }
    .banner-title-row strong { font-size: 0.9rem; color: #1e293b; }
    .inactive-badge { font-size: 0.65rem; padding: 2px 6px; background: #fef3c7; color: #92400e; border-radius: 4px; font-weight: 600; }
    .banner-sub { font-size: 0.8rem; color: #64748b; display: block; margin-top: 2px; }
    .banner-meta { display: flex; gap: 12px; font-size: 0.72rem; color: #94a3b8; margin-top: 4px; flex-wrap: wrap; }
    .banner-actions { display: flex; gap: 4px; }
    .action-btn {
      background: none; border: none; cursor: pointer; padding: 6px 8px;
      border-radius: 6px; font-size: 0.85rem; transition: background 0.15s;
    }
    .action-btn:hover { background: #f1f5f9; }
    .action-btn.delete:hover { background: #fee2e2; }

    .loading { color: #64748b; padding: 3rem; text-align: center; }
    .empty-state { text-align: center; padding: 4rem 2rem; background: #fff; border-radius: 12px; border: 1px solid #f1f5f9; }
    .empty-icon { font-size: 3rem; margin-bottom: 1rem; }
    .empty-state h3 { color: #1e293b; margin: 0 0 0.5rem; }
    .empty-state p { color: #64748b; font-size: 0.9rem; margin: 0 0 1.5rem; }

    @media (max-width: 768px) { .form-grid { grid-template-columns: 1fr; } }
  `]
})
export class BannersPage implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);

  banners = signal<Banner[]>([]);
  loading = signal(true);
  saving = signal(false);
  showForm = signal(false);
  editingId = signal<string | null>(null);
  successMsg = signal('');
  errorMsg = signal('');

  form = this.fb.group({
    title: ['', Validators.required],
    subtitle: [''],
    image: [''],
    link: [''],
    type: ['offer' as 'offer' | 'announcement' | 'promo'],
    bgColor: ['#f0fdf4'],
    textColor: ['#065f46'],
    sortOrder: [0],
    startDate: [''],
    endDate: [''],
    isActive: [true],
  });

  ngOnInit() {
    this.loadBanners();
  }

  loadBanners() {
    this.loading.set(true);
    this.api.get<any>('/banners/all').subscribe({
      next: (res) => {
        this.banners.set(res.data?.banners || res.data || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openForm() {
    this.form.reset({
      title: '',
      subtitle: '',
      image: '',
      link: '',
      type: 'offer',
      bgColor: '#f0fdf4',
      textColor: '#065f46',
      sortOrder: 0,
      startDate: '',
      endDate: '',
      isActive: true,
    });
    this.editingId.set(null);
    this.showForm.set(true);
    this.errorMsg.set('');
  }

  closeForm() {
    this.showForm.set(false);
    this.editingId.set(null);
  }

  editBanner(banner: Banner) {
    this.editingId.set(banner.id);
    this.form.patchValue({
      title: banner.title,
      subtitle: banner.subtitle || '',
      image: banner.image || '',
      link: banner.link || '',
      type: banner.type,
      bgColor: banner.bgColor,
      textColor: banner.textColor,
      sortOrder: banner.sortOrder,
      startDate: banner.startDate ? banner.startDate.substring(0, 10) : '',
      endDate: banner.endDate ? banner.endDate.substring(0, 10) : '',
      isActive: banner.isActive,
    });
    this.showForm.set(true);
    this.errorMsg.set('');
  }

  submitForm() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.errorMsg.set('');

    const val = this.form.value;
    const body: any = {
      title: val.title,
      type: val.type,
      bgColor: val.bgColor,
      textColor: val.textColor,
      sortOrder: val.sortOrder || 0,
      isActive: val.isActive ?? true,
    };
    if (val.subtitle) body.subtitle = val.subtitle;
    if (val.image) body.image = val.image;
    if (val.link) body.link = val.link;
    if (val.startDate) body.startDate = val.startDate;
    if (val.endDate) body.endDate = val.endDate;

    const req$ = this.editingId()
      ? this.api.patch(`/banners/${this.editingId()}`, body)
      : this.api.post('/banners', body);

    req$.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.loadBanners();
        this.successMsg.set(this.editingId() ? 'Banner updated' : 'Banner created');
        setTimeout(() => this.successMsg.set(''), 3000);
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMsg.set(err?.error?.message || 'Failed to save banner');
      },
    });
  }

  toggleActive(banner: Banner) {
    this.api.patch(`/banners/${banner.id}`, { isActive: !banner.isActive }).subscribe({
      next: () => this.loadBanners(),
    });
  }

  deleteBanner(banner: Banner) {
    if (!confirm(`Delete banner "${banner.title}"?`)) return;
    this.api.delete(`/banners/${banner.id}`).subscribe({
      next: () => {
        this.banners.set(this.banners().filter(b => b.id !== banner.id));
        this.successMsg.set('Banner deleted');
        setTimeout(() => this.successMsg.set(''), 3000);
      },
    });
  }
}
