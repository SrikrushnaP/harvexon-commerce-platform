import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '@frontend/shared-data-access';

interface Staff {
  id: string;
  name: string;
  phone: string;
  email: string;
  vehicleType: string;
  vehicleNumber: string;
  isAvailable: boolean;
  completedDeliveries: number;
  rating: number;
  notes: string;
  joinedAt: string;
}

@Component({
  selector: 'app-delivery-staff',
  standalone: true,
  imports: [RouterModule, DecimalPipe, ReactiveFormsModule],
  template: `
    <div class="page-header">
      <div>
        <h1>Delivery Staff</h1>
        <p class="subtitle">Manage your delivery team</p>
      </div>
      <div class="header-actions">
        <a routerLink="/delivery" class="btn btn-secondary">← Assignments</a>
        <button class="btn btn-primary" (click)="showForm()">+ Add Staff</button>
      </div>
    </div>

    @if (formVisible()) {
      <div class="form-card">
        <h2>{{ editingId() ? 'Edit Staff' : 'Add Staff Member' }}</h2>
        <form [formGroup]="form" (ngSubmit)="saveStaff()">
          <div class="form-grid">
            <div class="form-group">
              <label>Name *</label>
              <input type="text" formControlName="name" placeholder="Full name" />
            </div>
            <div class="form-group">
              <label>Phone *</label>
              <input type="text" formControlName="phone" placeholder="Phone number" />
            </div>
            <div class="form-group">
              <label>Email</label>
              <input type="email" formControlName="email" placeholder="Email address" />
            </div>
            <div class="form-group">
              <label>Vehicle Type</label>
              <select formControlName="vehicleType">
                <option value="">Select...</option>
                <option value="bike">Bike</option>
                <option value="scooter">Scooter</option>
                <option value="bicycle">Bicycle</option>
                <option value="car">Car</option>
                <option value="van">Van</option>
              </select>
            </div>
            <div class="form-group">
              <label>Vehicle Number</label>
              <input type="text" formControlName="vehicleNumber" placeholder="KA-01-AB-1234" />
            </div>
            <div class="form-group full-width">
              <label>Notes</label>
              <textarea formControlName="notes" rows="2" placeholder="Additional notes..."></textarea>
            </div>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" (click)="cancelForm()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving()">
              {{ saving() ? 'Saving...' : (editingId() ? 'Update' : 'Create') }}
            </button>
          </div>
        </form>
      </div>
    }

    @if (loading()) {
      <div class="loading">Loading staff...</div>
    } @else {
      <div class="table-card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Vehicle</th>
              <th>Availability</th>
              <th>Deliveries</th>
              <th>Rating</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (member of staff(); track member.id) {
              <tr>
                <td class="name-cell">
                  {{ member.name }}
                  @if (member.email) {
                    <span class="email">{{ member.email }}</span>
                  }
                </td>
                <td>{{ member.phone }}</td>
                <td>
                  @if (member.vehicleType) {
                    <span class="vehicle">{{ member.vehicleType }}{{ member.vehicleNumber ? ' · ' + member.vehicleNumber : '' }}</span>
                  } @else {
                    <span class="muted">—</span>
                  }
                </td>
                <td>
                  <button
                    class="availability-toggle"
                    [class.available]="member.isAvailable"
                    [class.unavailable]="!member.isAvailable"
                    (click)="toggleAvailability(member)"
                  >
                    {{ member.isAvailable ? '● Available' : '○ Unavailable' }}
                  </button>
                </td>
                <td class="deliveries-count">{{ member.completedDeliveries }}</td>
                <td class="rating-cell">
                  <span class="stars">
                    @for (star of [1, 2, 3, 4, 5]; track star) {
                      <span class="star" [class.filled]="star <= member.rating">★</span>
                    }
                  </span>
                  <span class="rating-num">{{ member.rating | number:'1.1-1' }}</span>
                </td>
                <td class="actions-cell">
                  <button (click)="editStaff(member)" class="action-btn" title="Edit">✏️</button>
                  <button (click)="deleteStaff(member)" class="action-btn delete" title="Delete">🗑️</button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="7" class="empty">No delivery staff yet. Add your first team member.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <div class="summary">
        {{ staff().length }} staff · {{ availableCount() }} available
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
      background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      border: 1px solid #f1f5f9; padding: 1.5rem; margin-bottom: 1.5rem;
    }
    .form-card h2 { margin: 0 0 1.25rem; font-size: 1.1rem; color: #1e293b; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.35rem; }
    .form-group.full-width { grid-column: 1 / -1; }
    .form-group label { font-size: 0.8rem; font-weight: 600; color: #475569; }
    .form-group input, .form-group select, .form-group textarea {
      padding: 0.6rem 0.8rem; border: 1px solid #e2e8f0; border-radius: 8px;
      font-size: 0.875rem; outline: none; font-family: inherit;
    }
    .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
      border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
    }
    .form-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.25rem; }

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
    .name-cell { font-weight: 500; }
    .email { display: block; font-size: 0.75rem; color: #94a3b8; font-weight: 400; }
    .vehicle { font-size: 0.85rem; text-transform: capitalize; }
    .muted { color: #94a3b8; }
    .availability-toggle {
      padding: 0.3rem 0.7rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500;
      border: none; cursor: pointer;
    }
    .availability-toggle.available { background: #dcfce7; color: #16a34a; }
    .availability-toggle.unavailable { background: #fee2e2; color: #dc2626; }
    .availability-toggle:hover { opacity: 0.8; }
    .deliveries-count { font-weight: 600; color: #1e293b; }
    .rating-cell { white-space: nowrap; }
    .stars { font-size: 0.9rem; letter-spacing: 1px; }
    .star { color: #e2e8f0; }
    .star.filled { color: #f59e0b; }
    .rating-num { font-size: 0.75rem; color: #64748b; margin-left: 0.4rem; }
    .actions-cell { white-space: nowrap; }
    .action-btn {
      background: none; border: none; cursor: pointer; padding: 0.25rem 0.4rem;
      border-radius: 4px; font-size: 0.875rem;
    }
    .action-btn:hover { background: #f1f5f9; }
    .action-btn.delete:hover { background: #fee2e2; }
    .empty { text-align: center; color: #94a3b8; padding: 2rem; }
    .summary { text-align: center; color: #64748b; font-size: 0.85rem; margin-top: 1rem; }
  `],
})
export class DeliveryStaffPage implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);

  staff = signal<Staff[]>([]);
  loading = signal(true);
  availableCount = signal(0);
  formVisible = signal(false);
  editingId = signal<string | null>(null);
  saving = signal(false);

  form: FormGroup = this.fb.group({
    name: ['', Validators.required],
    phone: ['', Validators.required],
    email: [''],
    vehicleType: [''],
    vehicleNumber: [''],
    notes: [''],
  });

  ngOnInit() {
    this.loadStaff();
  }

  loadStaff() {
    this.loading.set(true);
    this.api.get<Staff[]>('/delivery/staff').subscribe({
      next: (res) => {
        const list = res.data || [];
        this.staff.set(list);
        this.availableCount.set(list.filter(s => s.isAvailable).length);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  showForm() {
    this.editingId.set(null);
    this.form.reset();
    this.formVisible.set(true);
  }

  cancelForm() {
    this.formVisible.set(false);
    this.editingId.set(null);
    this.form.reset();
  }

  editStaff(member: Staff) {
    this.editingId.set(member.id);
    this.form.patchValue({
      name: member.name,
      phone: member.phone,
      email: member.email || '',
      vehicleType: member.vehicleType || '',
      vehicleNumber: member.vehicleNumber || '',
      notes: member.notes || '',
    });
    this.formVisible.set(true);
  }

  saveStaff() {
    if (this.form.invalid) return;
    this.saving.set(true);

    const body = this.form.value;
    const id = this.editingId();

    const request$ = id
      ? this.api.patch(`/delivery/staff/${id}`, body)
      : this.api.post('/delivery/staff', body);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.cancelForm();
        this.loadStaff();
      },
      error: () => {
        this.saving.set(false);
        alert('Failed to save staff member');
      },
    });
  }

  toggleAvailability(member: Staff) {
    this.api.patch(`/delivery/staff/${member.id}/availability`, {}).subscribe({
      next: () => {
        this.staff.update(list =>
          list.map(s => s.id === member.id ? { ...s, isAvailable: !s.isAvailable } : s)
        );
      },
      error: () => alert('Failed to update availability'),
    });
  }

  deleteStaff(member: Staff) {
    if (!confirm(`Remove "${member.name}" from delivery staff?`)) return;
    this.api.delete(`/delivery/staff/${member.id}`).subscribe({
      next: () => this.loadStaff(),
      error: () => alert('Failed to delete staff member'),
    });
  }
}
