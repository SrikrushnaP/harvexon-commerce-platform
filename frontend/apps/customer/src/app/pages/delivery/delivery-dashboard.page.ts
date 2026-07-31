import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ApiService, AuthService } from '@frontend/shared-data-access';

interface DeliveryAssignment {
  _id: string;
  order: { orderNumber: string; customer: { name: string }; deliveryAddress: { line1: string; city: string; pincode: string }; total: number; };
  deliveryStaff: { _id: string; name: string };
  status: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed';
  assignedAt: string; pickedUpAt?: string; deliveredAt?: string;
}

@Component({
  selector: 'app-delivery-dashboard',
  standalone: true,
  imports: [RouterModule, DatePipe],
  template: `
    <div class="dashboard-page">
      <!-- Driver Header -->
      <header class="driver-header">
        <div class="driver-info">
          <div class="driver-avatar">
            {{ auth.user()?.name?.charAt(0)?.toUpperCase() || 'D' }}
          </div>
          <div class="driver-meta">
            <h1 class="driver-name">{{ auth.user()?.name || 'Driver' }}</h1>
            <span class="driver-role">Delivery Partner</span>
          </div>
        </div>
        <div class="availability-toggle" (click)="toggleAvailability()">
          <div class="toggle-track" [class.active]="isAvailable()">
            <div class="toggle-thumb"></div>
          </div>
          <span class="toggle-label" [class.active]="isAvailable()">
            {{ isAvailable() ? 'Online' : 'Offline' }}
          </span>
        </div>
      </header>

      <!-- Stats Bar -->
      <section class="stats-bar">
        <div class="stat-card stat-active">
          <span class="stat-value">{{ activeCount() }}</span>
          <span class="stat-label">Active</span>
        </div>
        <div class="stat-card stat-completed">
          <span class="stat-value">{{ completedCount() }}</span>
          <span class="stat-label">Completed</span>
        </div>
        <div class="stat-card stat-total">
          <span class="stat-value">{{ assignments().length }}</span>
          <span class="stat-label">Total</span>
        </div>
      </section>

      <!-- Content -->
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading assignments...</p>
        </div>
      } @else if (assignments().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <h2 class="empty-title">No Assignments</h2>
          <p class="empty-text">New delivery assignments will appear here when available.</p>
        </div>
      } @else {
        <div class="assignments-list">
          @for (item of assignments(); track item._id) {
            <a [routerLink]="['/delivery', item._id]" class="assignment-card" [class]="'border-' + item.status">
              <div class="card-top">
                <span class="order-number">#{{ item.order.orderNumber }}</span>
                <span class="status-pill" [class]="'pill-' + item.status">
                  {{ formatStatus(item.status) }}
                </span>
              </div>
              <div class="card-body">
                <div class="customer-row">
                  <span class="customer-icon">👤</span>
                  <span class="customer-name">{{ item.order.customer.name }}</span>
                </div>
                <div class="address-row">
                  <span class="address-icon">📍</span>
                  <span class="address-text">{{ item.order.deliveryAddress.line1 }}, {{ item.order.deliveryAddress.city }}</span>
                </div>
              </div>
              <div class="card-footer">
                <span class="card-date">{{ item.assignedAt | date:'short' }}</span>
                <span class="card-total">₹{{ item.order.total }}</span>
              </div>
              <span class="card-arrow">›</span>
            </a>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard-page {
      padding: 1.5rem 1rem;
      max-width: 640px;
      margin: 0 auto;
    }

    /* Driver Header */
    .driver-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
      padding-bottom: 1.25rem;
      border-bottom: 1px solid var(--border, #e2e8f0);
    }

    .driver-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .driver-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary, #16a34a), #10b981);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      font-weight: 700;
      box-shadow: 0 2px 8px rgba(22, 163, 74, 0.25);
    }

    .driver-meta {
      display: flex;
      flex-direction: column;
    }

    .driver-name {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-primary, #1e293b);
      margin: 0;
    }

    .driver-role {
      font-size: 0.75rem;
      color: var(--text-muted, #64748b);
      font-weight: 500;
    }

    .availability-toggle {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      user-select: none;
    }

    .toggle-track {
      width: 44px;
      height: 24px;
      border-radius: 12px;
      background: #cbd5e1;
      position: relative;
      transition: var(--transition-base, all 0.3s ease);
      &.active { background: var(--primary, #16a34a); }
    }

    .toggle-thumb {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #fff;
      position: absolute;
      top: 2px;
      left: 2px;
      transition: var(--transition-base, all 0.3s ease);
      box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    }

    .toggle-track.active .toggle-thumb {
      left: 22px;
    }

    .toggle-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted, #94a3b8);
      &.active { color: var(--primary, #16a34a); }
    }

    /* Stats Bar */
    .stats-bar {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .stat-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1rem 0.5rem;
      border-radius: var(--radius-lg, 12px);
      border: 1px solid var(--border, #e2e8f0);
    }

    .stat-active {
      background: linear-gradient(135deg, #f0fdf4, #dcfce7);
      border-color: #bbf7d0;
    }

    .stat-completed {
      background: linear-gradient(135deg, #eff6ff, #dbeafe);
      border-color: #bfdbfe;
    }

    .stat-total {
      background: linear-gradient(135deg, #f8fafc, #f1f5f9);
      border-color: #e2e8f0;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-primary, #1e293b);
    }

    .stat-label {
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--text-muted, #64748b);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-top: 0.15rem;
    }

    /* Loading */
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem 2rem;
      p { color: var(--text-muted, #64748b); margin-top: 1rem; font-size: 0.9rem; }
    }

    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid var(--border, #e2e8f0);
      border-top-color: var(--primary, #16a34a);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 3rem 2rem;
    }

    .empty-icon {
      font-size: 3.5rem;
      margin-bottom: 1rem;
    }

    .empty-title {
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--text-primary, #1e293b);
      margin: 0 0 0.5rem;
    }

    .empty-text {
      color: var(--text-muted, #64748b);
      font-size: 0.9rem;
      margin: 0;
      max-width: 260px;
      line-height: 1.5;
    }

    /* Assignments List */
    .assignments-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .assignment-card {
      position: relative;
      display: block;
      background: var(--surface, #fff);
      border: 1px solid var(--border, #e2e8f0);
      border-radius: var(--radius-lg, 12px);
      padding: 1rem 1.25rem;
      text-decoration: none;
      box-shadow: var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.06));
      border-left: 3px solid transparent;
      transition: var(--transition-base, all 0.2s ease);
      &:hover {
        box-shadow: var(--shadow-md, 0 4px 12px rgba(0,0,0,0.1));
        transform: translateY(-1px);
      }
    }

    .border-pending { border-left-color: #f59e0b; }
    .border-assigned { border-left-color: #3b82f6; }
    .border-picked_up { border-left-color: #8b5cf6; }
    .border-in_transit { border-left-color: #10b981; }
    .border-delivered { border-left-color: #16a34a; }
    .border-failed { border-left-color: #ef4444; }

    .card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }

    .order-number {
      font-weight: 700;
      font-size: 0.95rem;
      color: var(--text-primary, #1e293b);
    }

    .status-pill {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.65rem;
      border-radius: var(--radius-full, 9999px);
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.03em;
    }

    .pill-pending { background: #fef3c7; color: #92400e; }
    .pill-assigned { background: #dbeafe; color: #1e40af; }
    .pill-picked_up { background: #ede9fe; color: #5b21b6; }
    .pill-in_transit { background: #d1fae5; color: #065f46; }
    .pill-delivered { background: #dcfce7; color: #166534; }
    .pill-failed { background: #fee2e2; color: #991b1b; }

    .card-body {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      margin-bottom: 0.75rem;
    }

    .customer-row, .address-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .customer-icon, .address-icon {
      font-size: 0.85rem;
      width: 1.25rem;
      text-align: center;
    }

    .customer-name {
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--text-primary, #1e293b);
    }

    .address-text {
      font-size: 0.8rem;
      color: var(--text-muted, #64748b);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 240px;
    }

    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 0.5rem;
      border-top: 1px solid var(--border-light, #f1f5f9);
    }

    .card-date {
      font-size: 0.75rem;
      color: var(--text-muted, #94a3b8);
    }

    .card-total {
      font-size: 1rem;
      font-weight: 700;
      color: var(--primary, #16a34a);
    }

    .card-arrow {
      position: absolute;
      right: 1rem;
      top: 50%;
      transform: translateY(-50%);
      font-size: 1.4rem;
      color: var(--text-muted, #94a3b8);
      font-weight: 300;
    }
  `],
})
export class DeliveryDashboardPage implements OnInit, OnDestroy {
  private api = inject(ApiService);
  auth = inject(AuthService);

  assignments = signal<DeliveryAssignment[]>([]);
  loading = signal(true);
  isAvailable = signal(true);
  activeCount = signal(0);
  completedCount = signal(0);

  private refreshInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    this.loadAssignments();
    this.refreshInterval = setInterval(() => this.loadAssignments(), 30000);
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  loadAssignments() {
    this.api.get<DeliveryAssignment[]>('/delivery/assignments').subscribe({
      next: (res) => {
        const data = res.data || [];
        this.assignments.set(data);
        this.activeCount.set(data.filter(a => !['delivered', 'failed'].includes(a.status)).length);
        this.completedCount.set(data.filter(a => a.status === 'delivered').length);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  toggleAvailability() {
    this.isAvailable.set(!this.isAvailable());
    this.api.patch('/delivery/availability', { available: this.isAvailable() }).subscribe();
  }

  formatStatus(status: string): string {
    const map: Record<string, string> = {
      pending: 'Pending',
      assigned: 'Assigned',
      picked_up: 'Picked Up',
      in_transit: 'In Transit',
      delivered: 'Delivered',
      failed: 'Failed',
    };
    return map[status] || status;
  }
}
