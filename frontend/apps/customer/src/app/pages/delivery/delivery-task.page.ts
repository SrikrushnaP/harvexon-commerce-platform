import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '@frontend/shared-data-access';

interface DeliveryAssignment {
  _id: string;
  order: {
    orderNumber: string;
    customer: { name: string };
    deliveryAddress: { line1: string; city: string; pincode: string };
    items?: { name: string; quantity: number; price: number }[];
    total: number;
  };
  deliveryStaff: { _id: string; name: string };
  status: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed';
  assignedAt: string;
  pickedUpAt?: string;
  deliveredAt?: string;
}

@Component({
  selector: 'app-delivery-task',
  standalone: true,
  imports: [RouterModule, DatePipe, FormsModule],
  template: `
    <div class="task-page">
      <header class="task-header">
        <a routerLink="/delivery" class="back-link">
          <span class="back-icon">‹</span>
          Dashboard
        </a>
        @if (assignment()) {
          <span class="order-tag">#{{ assignment()!.order.orderNumber }}</span>
        }
      </header>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading delivery details...</p>
        </div>
      } @else if (!assignment()) {
        <div class="error-state">
          <div class="error-icon">🔍</div>
          <h2 class="error-title">Assignment Not Found</h2>
          <p class="error-text">This delivery assignment may have been removed or reassigned.</p>
          <a routerLink="/delivery" class="error-cta">Back to Dashboard</a>
        </div>
      } @else {
        <!-- Status Banner -->
        <div class="status-banner" [class]="'banner-' + assignment()!.status">
          <span class="banner-icon">{{ getStatusIcon(assignment()!.status) }}</span>
          <span class="banner-text">{{ formatStatus(assignment()!.status) }}</span>
        </div>

        <!-- Customer & Address Card -->
        <section class="card delivery-card">
          <h3 class="card-title">
            <span class="title-icon">📍</span>
            Delivery To
          </h3>
          <p class="customer-name">{{ assignment()!.order.customer.name }}</p>
          <p class="address-text">
            {{ assignment()!.order.deliveryAddress.line1 }}<br>
            {{ assignment()!.order.deliveryAddress.city }} — {{ assignment()!.order.deliveryAddress.pincode }}
          </p>
          <a
            class="maps-btn"
            [href]="getMapsUrl()"
            target="_blank"
            rel="noopener">
            <span class="maps-icon">🗺️</span>
            Open in Google Maps
          </a>
        </section>

        <!-- Order Items Card -->
        <section class="card items-card">
          <h3 class="card-title">
            <span class="title-icon">🛒</span>
            Order Details
          </h3>
          @if (assignment()!.order.items && assignment()!.order.items!.length > 0) {
            <div class="items-list">
              @for (item of assignment()!.order.items; track item.name; let odd = $odd) {
                <div class="item-row" [class.alt-row]="odd">
                  <span class="item-name">{{ item.name }}</span>
                  <span class="item-qty">×{{ item.quantity }}</span>
                  <span class="item-price">₹{{ item.price * item.quantity }}</span>
                </div>
              }
            </div>
          }
          <div class="total-row">
            <span class="total-label">Total</span>
            <span class="total-amount">₹{{ assignment()!.order.total }}</span>
          </div>
        </section>

        <!-- Timeline Card -->
        <section class="card timeline-card">
          <h3 class="card-title">
            <span class="title-icon">⏱️</span>
            Timeline
          </h3>
          <div class="timeline">
            <div class="timeline-item active">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <span class="timeline-label">Assigned</span>
                <span class="timeline-time">{{ assignment()!.assignedAt | date:'short' }}</span>
              </div>
            </div>
            @if (assignment()!.pickedUpAt) {
              <div class="timeline-item active">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                  <span class="timeline-label">Picked Up</span>
                  <span class="timeline-time">{{ assignment()!.pickedUpAt | date:'short' }}</span>
                </div>
              </div>
            }
            @if (assignment()!.deliveredAt) {
              <div class="timeline-item active">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                  <span class="timeline-label">Delivered</span>
                  <span class="timeline-time">{{ assignment()!.deliveredAt | date:'short' }}</span>
                </div>
              </div>
            }
          </div>
        </section>

        <!-- Action Section -->
        @if (!isTerminalStatus(assignment()!.status)) {
          <section class="action-section">
            @if (showFailureInput()) {
              <div class="failure-input-group">
                <label for="failureReason" class="failure-label">Reason for failure:</label>
                <textarea
                  id="failureReason"
                  [(ngModel)]="failureReason"
                  placeholder="Describe why delivery failed..."
                  rows="3"
                  class="failure-textarea"></textarea>
                <div class="failure-actions">
                  <button class="btn-cancel" (click)="showFailureInput.set(false)">Cancel</button>
                  <button
                    class="btn-confirm-fail"
                    (click)="markFailed()"
                    [disabled]="!failureReason || updating()">
                    Confirm Failed
                  </button>
                </div>
              </div>
            } @else {
              <button
                class="action-btn primary-action"
                (click)="advanceStatus()"
                [disabled]="updating()">
                @if (updating()) {
                  <span class="btn-spinner"></span>
                  Updating...
                } @else {
                  {{ getActionLabel(assignment()!.status) }}
                }
              </button>
              <button
                class="action-btn fail-action"
                (click)="showFailureInput.set(true)"
                [disabled]="updating()">
                Mark as Failed
              </button>
            }
          </section>
        }
      }
    </div>
  `,
  styles: [`
    .task-page {
      padding: 1.5rem 1rem;
      max-width: 480px;
      margin: 0 auto;
      padding-bottom: 10rem;
    }

    .task-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.25rem;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.2rem;
      color: var(--primary, #16a34a);
      text-decoration: none;
      font-weight: 600;
      font-size: 0.9rem;
      min-height: 44px;
      transition: var(--transition-base, all 0.2s ease);
      &:hover { opacity: 0.8; }
    }

    .back-icon {
      font-size: 1.4rem;
      line-height: 1;
    }

    .order-tag {
      font-size: 0.8rem;
      color: var(--text-muted, #64748b);
      font-weight: 500;
      background: var(--surface-alt, #f8fafc);
      padding: 0.3rem 0.6rem;
      border-radius: var(--radius-full, 9999px);
    }

    /* Loading */
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 4rem 2rem;
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

    /* Error State */
    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 4rem 2rem;
    }

    .error-icon {
      font-size: 3.5rem;
      margin-bottom: 1rem;
    }

    .error-title {
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--text-primary, #1e293b);
      margin: 0 0 0.5rem;
    }

    .error-text {
      color: var(--text-muted, #64748b);
      font-size: 0.9rem;
      margin: 0 0 1.5rem;
      max-width: 260px;
      line-height: 1.5;
    }

    .error-cta {
      display: inline-flex;
      align-items: center;
      padding: 0.75rem 1.5rem;
      background: var(--primary, #16a34a);
      color: #fff;
      border-radius: var(--radius-lg, 12px);
      text-decoration: none;
      font-weight: 600;
      font-size: 0.9rem;
      transition: var(--transition-base, all 0.2s ease);
      &:hover { opacity: 0.9; }
    }

    /* Status Banner */
    .status-banner {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.85rem 1rem;
      border-radius: var(--radius-lg, 12px);
      font-weight: 700;
      font-size: 1rem;
      margin-bottom: 1.25rem;
    }

    .banner-icon { font-size: 1.1rem; }

    .banner-pending { background: #fef3c7; color: #92400e; }
    .banner-assigned { background: #dbeafe; color: #1e40af; }
    .banner-picked_up { background: #ede9fe; color: #5b21b6; }
    .banner-in_transit { background: #dcfce7; color: #166534; }
    .banner-delivered { background: #d1fae5; color: #065f46; }
    .banner-failed { background: #fee2e2; color: #991b1b; }

    /* Cards */
    .card {
      background: var(--surface, #fff);
      border: 1px solid var(--border, #e2e8f0);
      border-radius: var(--radius-lg, 12px);
      padding: 1.25rem;
      margin-bottom: 1rem;
      box-shadow: var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.06));
    }

    .card-title {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-muted, #64748b);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin: 0 0 0.85rem;
    }

    .title-icon { font-size: 1rem; }

    /* Delivery Card */
    .delivery-card {
      border-left: 3px solid var(--primary, #16a34a);
    }

    .customer-name {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-primary, #1e293b);
      margin: 0 0 0.35rem;
    }

    .address-text {
      color: var(--text-secondary, #475569);
      font-size: 0.9rem;
      line-height: 1.5;
      margin: 0 0 1rem;
    }

    .maps-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--primary-light, #f0fdf4);
      border: 1px solid var(--primary, #16a34a);
      color: var(--primary, #16a34a);
      padding: 0.7rem 1.25rem;
      border-radius: var(--radius-lg, 12px);
      text-decoration: none;
      font-weight: 600;
      font-size: 0.85rem;
      min-height: 48px;
      transition: var(--transition-base, all 0.2s ease);
      &:active { background: #dcfce7; }
    }

    .maps-icon { font-size: 1rem; }

    /* Items */
    .items-list { margin-bottom: 0.85rem; }

    .item-row {
      display: flex;
      align-items: center;
      padding: 0.6rem 0.5rem;
      border-radius: var(--radius-sm, 6px);
    }

    .item-row.alt-row {
      background: var(--surface-alt, #f8fafc);
    }

    .item-name {
      flex: 1;
      color: var(--text-primary, #1e293b);
      font-size: 0.9rem;
      font-weight: 500;
    }

    .item-qty {
      color: var(--text-muted, #94a3b8);
      font-size: 0.8rem;
      margin-right: 0.75rem;
    }

    .item-price {
      font-weight: 600;
      color: var(--text-primary, #1e293b);
      font-size: 0.9rem;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border, #e2e8f0);
    }

    .total-label {
      font-weight: 600;
      color: var(--text-primary, #1e293b);
    }

    .total-amount {
      color: var(--primary, #16a34a);
      font-size: 1.25rem;
      font-weight: 800;
    }

    /* Timeline */
    .timeline {
      display: flex;
      flex-direction: column;
      gap: 0;
      padding-left: 0.25rem;
    }

    .timeline-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.5rem 0;
      position: relative;
    }

    .timeline-item:not(:last-child)::after {
      content: '';
      position: absolute;
      left: 5px;
      top: calc(0.5rem + 12px);
      bottom: 0;
      width: 2px;
      background: var(--border, #e2e8f0);
    }

    .timeline-item.active:not(:last-child)::after {
      background: var(--primary, #16a34a);
    }

    .timeline-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--border, #cbd5e1);
      flex-shrink: 0;
      margin-top: 2px;
    }

    .timeline-item.active .timeline-dot {
      background: var(--primary, #16a34a);
      box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.15);
    }

    .timeline-content {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex: 1;
    }

    .timeline-label {
      font-weight: 600;
      color: var(--text-primary, #1e293b);
      font-size: 0.9rem;
    }

    .timeline-time {
      font-size: 0.75rem;
      color: var(--text-muted, #94a3b8);
    }

    /* Action Section */
    .action-section {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: var(--surface, #fff);
      border-top: 1px solid var(--border, #e2e8f0);
      padding: 1rem 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 480px;
      margin: 0 auto;
      z-index: 100;
      box-shadow: 0 -4px 12px rgba(0,0,0,0.05);
    }

    .action-btn {
      width: 100%;
      padding: 1rem;
      border-radius: var(--radius-lg, 12px);
      font-size: 1rem;
      font-weight: 700;
      border: none;
      cursor: pointer;
      min-height: 52px;
      transition: var(--transition-base, all 0.2s ease);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      &:active { transform: scale(0.98); }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }

    .primary-action {
      background: var(--primary, #16a34a);
      color: #fff;
      &:active:not(:disabled) { background: #15803d; }
    }

    .fail-action {
      background: transparent;
      color: #dc2626;
      border: 1.5px solid #dc2626;
      font-size: 0.9rem;
      &:active:not(:disabled) { background: #fef2f2; }
    }

    .btn-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    /* Failure Input */
    .failure-input-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .failure-label {
      font-weight: 600;
      color: var(--text-primary, #1e293b);
      font-size: 0.85rem;
    }

    .failure-textarea {
      width: 100%;
      border: 1px solid var(--border, #e2e8f0);
      border-radius: var(--radius-md, 8px);
      padding: 0.75rem;
      font-size: 0.9rem;
      resize: none;
      font-family: inherit;
      transition: var(--transition-base, all 0.2s ease);
      &:focus {
        outline: none;
        border-color: #dc2626;
        box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
      }
    }

    .failure-actions {
      display: flex;
      gap: 0.75rem;
      margin-top: 0.25rem;
    }

    .btn-cancel {
      flex: 1;
      padding: 0.75rem;
      border-radius: var(--radius-lg, 12px);
      border: 1px solid var(--border, #e2e8f0);
      background: var(--surface-alt, #f8fafc);
      color: var(--text-muted, #64748b);
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      min-height: 48px;
      transition: var(--transition-base, all 0.2s ease);
      &:active { background: #f1f5f9; }
    }

    .btn-confirm-fail {
      flex: 1;
      padding: 0.75rem;
      border-radius: var(--radius-lg, 12px);
      border: none;
      background: #dc2626;
      color: #fff;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      min-height: 48px;
      transition: var(--transition-base, all 0.2s ease);
      &:disabled { opacity: 0.5; cursor: not-allowed; }
      &:active:not(:disabled) { background: #b91c1c; }
    }
  `],
})
export class DeliveryTaskPage implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  assignment = signal<DeliveryAssignment | null>(null);
  loading = signal(true);
  updating = signal(false);
  showFailureInput = signal(false);
  failureReason = '';

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading.set(false);
      return;
    }

    this.api.get<DeliveryAssignment>('/delivery/assignments/' + id).subscribe({
      next: (res) => {
        this.assignment.set(res.data || null);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  getMapsUrl(): string {
    const addr = this.assignment()?.order.deliveryAddress;
    if (!addr) return '';
    const query = encodeURIComponent(`${addr.line1}, ${addr.city}, ${addr.pincode}`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      pending: '⏳',
      assigned: '📋',
      picked_up: '📦',
      in_transit: '🚗',
      delivered: '✅',
      failed: '❌',
    };
    return icons[status] || '📋';
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

  getActionLabel(status: string): string {
    const map: Record<string, string> = {
      pending: '📋 Accept Assignment',
      assigned: '📦 Pick Up Order',
      picked_up: '🚗 Start Delivery',
      in_transit: '✅ Mark Delivered',
    };
    return map[status] || 'Update';
  }

  isTerminalStatus(status: string): boolean {
    return status === 'delivered' || status === 'failed';
  }

  advanceStatus() {
    const current = this.assignment();
    if (!current) return;

    const nextStatusMap: Record<string, string> = {
      pending: 'assigned',
      assigned: 'picked_up',
      picked_up: 'in_transit',
      in_transit: 'delivered',
    };

    const nextStatus = nextStatusMap[current.status];
    if (!nextStatus) return;

    this.updating.set(true);
    this.api.patch<DeliveryAssignment>('/delivery/assignments/' + current._id + '/status', {
      status: nextStatus,
    }).subscribe({
      next: (res) => {
        if (res.data) {
          this.assignment.set(res.data);
        } else {
          this.assignment.set({ ...current, status: nextStatus as DeliveryAssignment['status'] });
        }
        this.updating.set(false);
        if (nextStatus === 'delivered') {
          setTimeout(() => this.router.navigate(['/delivery']), 1500);
        }
      },
      error: () => this.updating.set(false),
    });
  }

  markFailed() {
    const current = this.assignment();
    if (!current || !this.failureReason) return;

    this.updating.set(true);
    this.api.patch<DeliveryAssignment>('/delivery/assignments/' + current._id + '/status', {
      status: 'failed',
      failureReason: this.failureReason,
    }).subscribe({
      next: (res) => {
        if (res.data) {
          this.assignment.set(res.data);
        } else {
          this.assignment.set({ ...current, status: 'failed' });
        }
        this.updating.set(false);
        this.showFailureInput.set(false);
        setTimeout(() => this.router.navigate(['/delivery']), 1500);
      },
      error: () => this.updating.set(false),
    });
  }
}
