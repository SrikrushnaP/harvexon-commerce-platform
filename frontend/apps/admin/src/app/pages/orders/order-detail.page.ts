import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '@frontend/shared-data-access';

interface DeliveryStaff {
  id: string;
  name: string;
  phone?: string;
}

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [RouterModule, DecimalPipe, DatePipe, FormsModule],
  template: `
    @if (loading()) {
      <div class="loading">Loading order...</div>
    } @else if (order()) {
      <!-- Header -->
      <div class="page-header">
        <div>
          <div class="order-title-row">
            <h1>Order #{{ order().orderNumber }}</h1>
            <span class="status-badge lg" [attr.data-status]="order().status">
              {{ formatStatus(order().status) }}
            </span>
          </div>
          <p class="subtitle">
            Placed {{ order().orderDate || order().createdAt | date:'medium' }}
            @if (order().confirmedAt) { · Confirmed {{ order().confirmedAt | date:'shortDate' }} }
            @if (order().deliveredAt) { · Delivered {{ order().deliveredAt | date:'shortDate' }} }
          </p>
        </div>
        <div class="header-actions">
          <a routerLink="/orders" class="btn btn-secondary">← Back to Orders</a>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="actions-bar">
        @if (canConfirm()) {
          <button (click)="updateStatus('confirmed')" class="btn btn-primary">✓ Confirm Order</button>
        }
        @if (canProcess()) {
          <button (click)="updateStatus('processing')" class="btn btn-warning">⚙ Start Processing</button>
        }
        @if (canPack()) {
          <button (click)="updateStatus('packed')" class="btn btn-info">📦 Mark Packed</button>
        }
        @if (canAssign()) {
          <button (click)="showAssignModal.set(true)" class="btn btn-info">🚚 Assign Delivery</button>
        }
        @if (canMarkOut()) {
          <button (click)="updateStatus('out_for_delivery')" class="btn btn-info">🛵 Out for Delivery</button>
        }
        @if (canDeliver()) {
          <button (click)="updateStatus('delivered')" class="btn btn-success">✓ Mark Delivered</button>
        }
        @if (canCancel()) {
          <button (click)="showCancelModal.set(true)" class="btn btn-danger">✕ Cancel Order</button>
        }
      </div>

      <!-- Main Content Grid -->
      <div class="detail-grid">
        <!-- Customer Info -->
        <div class="info-card">
          <h2>Customer</h2>
          @if (order().customer) {
            <div class="info-row">
              <span class="info-label">Name</span>
              <span class="info-value">{{ order().customer.name }}</span>
            </div>
            @if (order().customer.phone) {
              <div class="info-row">
                <span class="info-label">Phone</span>
                <span class="info-value">{{ order().customer.phone }}</span>
              </div>
            }
            @if (order().customer.email) {
              <div class="info-row">
                <span class="info-label">Email</span>
                <span class="info-value">{{ order().customer.email }}</span>
              </div>
            }
          } @else {
            <p class="empty">No customer data</p>
          }
        </div>

        <!-- Delivery Address -->
        <div class="info-card">
          <h2>Delivery Address</h2>
          @if (order().deliveryAddress) {
            <div class="address-block">
              @if (order().deliveryAddress.label) {
                <span class="addr-label">{{ order().deliveryAddress.label }}</span>
              }
              <p>{{ order().deliveryAddress.line1 }}</p>
              @if (order().deliveryAddress.line2) {
                <p>{{ order().deliveryAddress.line2 }}</p>
              }
              <p>{{ order().deliveryAddress.city }}, {{ order().deliveryAddress.state }} — {{ order().deliveryAddress.pincode }}</p>
              @if (order().deliveryAddress.landmark) {
                <p class="landmark">📍 {{ order().deliveryAddress.landmark }}</p>
              }
            </div>
          } @else {
            <p class="empty">No delivery address</p>
          }
        </div>

        <!-- Payment Info -->
        <div class="info-card">
          <h2>Payment</h2>
          <div class="info-row">
            <span class="info-label">Method</span>
            <span class="info-value method-badge">{{ formatPaymentMethod(order().paymentMethod) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Status</span>
            <span class="payment-badge" [attr.data-payment]="order().paymentStatus">
              {{ order().paymentStatus }}
            </span>
          </div>
          <div class="info-row">
            <span class="info-label">Paid Amount</span>
            <span class="info-value amount">₹{{ order().paidAmount | number:'1.0-0' }}</span>
          </div>
          @if (order().paidAmount < order().total) {
            <div class="info-row">
              <span class="info-label">Balance Due</span>
              <span class="info-value balance-due">₹{{ order().total - order().paidAmount | number:'1.0-0' }}</span>
            </div>
          }
        </div>

        <!-- Delivery Assignment -->
        @if (order().deliveryAssignment) {
          <div class="info-card">
            <h2>🚚 Delivery Assignment</h2>
            <div class="info-row">
              <span class="info-label">Staff</span>
              <span class="info-value staff-name">{{ order().deliveryAssignment.deliveryStaff?.name || '—' }}</span>
            </div>
            @if (order().deliveryAssignment.deliveryStaff?.phone) {
              <div class="info-row">
                <span class="info-label">Phone</span>
                <span class="info-value">{{ order().deliveryAssignment.deliveryStaff.phone }}</span>
              </div>
            }
            <div class="info-row">
              <span class="info-label">Status</span>
              <span class="status-badge" [attr.data-status]="order().deliveryAssignment.status">
                {{ formatStatus(order().deliveryAssignment.status) }}
              </span>
            </div>
            <div class="info-row">
              <span class="info-label">Assigned At</span>
              <span class="info-value">{{ order().deliveryAssignment.assignedAt | date:'medium' }}</span>
            </div>
            @if (order().deliveryAssignment.pickedUpAt) {
              <div class="info-row">
                <span class="info-label">Picked Up</span>
                <span class="info-value">{{ order().deliveryAssignment.pickedUpAt | date:'medium' }}</span>
              </div>
            }
            @if (order().deliveryAssignment.deliveredAt) {
              <div class="info-row">
                <span class="info-label">Delivered</span>
                <span class="info-value">{{ order().deliveryAssignment.deliveredAt | date:'medium' }}</span>
              </div>
            }
          </div>
        }

        <!-- Financial Summary -->
        <div class="info-card">
          <h2>Order Summary</h2>
          <div class="info-row">
            <span class="info-label">Subtotal</span>
            <span class="info-value">₹{{ order().subtotal | number:'1.0-0' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Delivery Charge</span>
            <span class="info-value">₹{{ order().deliveryCharge | number:'1.0-0' }}</span>
          </div>
          @if (order().discount) {
            <div class="info-row">
              <span class="info-label">Discount</span>
              <span class="info-value discount">−₹{{ order().discount | number:'1.0-0' }}</span>
            </div>
          }
          <div class="info-row total-row">
            <span class="info-label">Total</span>
            <span class="info-value total-amount">₹{{ order().total | number:'1.0-0' }}</span>
          </div>
        </div>
      </div>

      <!-- Items Table -->
      <div class="section-card">
        <h2>Items ({{ order().items?.length || 0 }})</h2>
        @if (order().items?.length) {
          <div class="items-table-wrapper">
            <table class="items-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item</th>
                  <th>Unit</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                @for (item of order().items; track item.product; let i = $index) {
                  <tr>
                    <td class="row-num">{{ i + 1 }}</td>
                    <td class="item-name">{{ item.name }}</td>
                    <td>{{ item.unit }}</td>
                    <td class="qty">{{ item.quantity }}</td>
                    <td>₹{{ item.price | number:'1.0-0' }}</td>
                    <td class="amount">₹{{ item.total | number:'1.0-0' }}</td>
                  </tr>
                }
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="5" class="foot-label">Subtotal</td>
                  <td class="amount">₹{{ order().subtotal | number:'1.0-0' }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        } @else {
          <p class="empty">No items</p>
        }
      </div>

      <!-- Notes -->
      @if (order().notes || order().internalNotes) {
        <div class="section-card">
          <h2>Notes</h2>
          @if (order().notes) {
            <div class="note-block">
              <span class="note-label">Customer Notes</span>
              <p>{{ order().notes }}</p>
            </div>
          }
          @if (order().internalNotes) {
            <div class="note-block internal">
              <span class="note-label">Internal Notes</span>
              <p>{{ order().internalNotes }}</p>
            </div>
          }
        </div>
      }

      <!-- Cancellation Info -->
      @if (order().status === 'cancelled') {
        <div class="section-card cancelled-info">
          <h2>🚫 Cancellation</h2>
          <div class="info-row">
            <span class="info-label">Cancelled At</span>
            <span class="info-value">{{ order().cancelledAt | date:'medium' }}</span>
          </div>
          @if (order().cancellationReason) {
            <div class="info-row">
              <span class="info-label">Reason</span>
              <span class="info-value">{{ order().cancellationReason }}</span>
            </div>
          }
        </div>
      }

      <!-- Status History Timeline -->
      <div class="section-card">
        <h2>Status History</h2>
        @if (order().statusHistory?.length) {
          <div class="timeline">
            @for (entry of order().statusHistory; track entry.timestamp) {
              <div class="timeline-item">
                <div class="timeline-dot" [attr.data-status]="entry.status"></div>
                <div class="timeline-content">
                  <div class="timeline-header">
                    <span class="timeline-status" [attr.data-status]="entry.status">
                      {{ formatStatus(entry.status) }}
                    </span>
                    <span class="timeline-date">{{ entry.timestamp | date:'medium' }}</span>
                  </div>
                  @if (entry.changedBy?.name) {
                    <p class="timeline-user">by {{ entry.changedBy.name }}</p>
                  }
                  @if (entry.notes) {
                    <p class="timeline-notes">{{ entry.notes }}</p>
                  }
                </div>
              </div>
            }
          </div>
        } @else {
          <p class="empty">No status history</p>
        }
      </div>

      <!-- Cancel Modal -->
      @if (showCancelModal()) {
        <div class="modal-overlay" (click)="showCancelModal.set(false)">
          <div class="modal" (click)="$event.stopPropagation()">
            <h3>Cancel Order #{{ order().orderNumber }}</h3>
            <p class="modal-desc">This action cannot be undone. Please provide a reason for cancellation.</p>
            <textarea
              [(ngModel)]="cancelReason"
              placeholder="Reason for cancellation..."
              rows="3"
              class="cancel-textarea"
            ></textarea>
            <div class="modal-actions">
              <button (click)="showCancelModal.set(false)" class="btn btn-secondary">Cancel</button>
              <button
                (click)="confirmCancel()"
                [disabled]="!cancelReason.trim()"
                class="btn btn-danger"
              >Confirm Cancellation</button>
            </div>
          </div>
        </div>
      }

      <!-- Assign Delivery Modal -->
      @if (showAssignModal()) {
        <div class="modal-overlay" (click)="showAssignModal.set(false)">
          <div class="modal" (click)="$event.stopPropagation()">
            <h3>Assign Delivery Staff</h3>
            <p class="modal-desc">Select a delivery staff member for Order #{{ order().orderNumber }}.</p>
            <select
              class="assign-select"
              [ngModel]="selectedStaffId()"
              (ngModelChange)="selectedStaffId.set($event)"
            >
              <option value="">-- Select Delivery Staff --</option>
              @for (staff of deliveryStaff(); track staff.id) {
                <option [value]="staff.id">{{ staff.name }}{{ staff.phone ? ' (' + staff.phone + ')' : '' }}</option>
              }
            </select>
            <div class="modal-actions">
              <button (click)="showAssignModal.set(false)" class="btn btn-secondary">Cancel</button>
              <button
                (click)="confirmAssign()"
                [disabled]="!selectedStaffId()"
                class="btn btn-primary"
              >Assign</button>
            </div>
          </div>
        </div>
      }
    } @else {
      <div class="error-state">
        <h2>Order not found</h2>
        <p>The order you're looking for doesn't exist or has been removed.</p>
        <a routerLink="/orders" class="btn btn-primary">← Back to Orders</a>
      </div>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
    .order-title-row { display: flex; align-items: center; gap: 0.75rem; }
    .page-header h1 { margin: 0; color: #1e293b; font-size: 1.5rem; }
    .subtitle { color: #64748b; margin: 0.25rem 0 0; font-size: 0.825rem; }
    .header-actions { display: flex; gap: 0.75rem; }
    .btn {
      padding: 0.55rem 1.1rem; border-radius: 8px; text-decoration: none; font-size: 0.825rem;
      font-weight: 500; cursor: pointer; border: none; transition: background 0.15s;
    }
    .btn-primary { background: #3b82f6; color: #fff; }
    .btn-primary:hover { background: #2563eb; }
    .btn-secondary { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
    .btn-secondary:hover { background: #e2e8f0; }
    .btn-success { background: #16a34a; color: #fff; }
    .btn-success:hover { background: #15803d; }
    .btn-warning { background: #d97706; color: #fff; }
    .btn-warning:hover { background: #b45309; }
    .btn-info { background: #0891b2; color: #fff; }
    .btn-info:hover { background: #0e7490; }
    .btn-danger { background: #dc2626; color: #fff; }
    .btn-danger:hover { background: #b91c1c; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .actions-bar { display: flex; gap: 0.75rem; margin-bottom: 1.5rem; flex-wrap: wrap; }

    .loading { color: #64748b; padding: 3rem; text-align: center; }
    .error-state { text-align: center; padding: 4rem 2rem; color: #64748b; h2 { color: #1e293b; margin-bottom: 0.5rem; } }

    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.5rem; }
    @media (max-width: 900px) { .detail-grid { grid-template-columns: 1fr; } }

    .info-card, .section-card {
      background: #fff; border-radius: 12px; padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06); border: 1px solid #f1f5f9;
      h2 { margin: 0 0 1rem; font-size: 0.95rem; color: #334155; font-weight: 600; }
    }
    .section-card { margin-bottom: 1.5rem; }
    .cancelled-info { border-color: #fecaca; background: #fef2f2; }

    .info-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 0.55rem 0; border-bottom: 1px solid #f8fafc;
      &:last-child { border-bottom: none; }
    }
    .info-label { font-size: 0.775rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.02em; }
    .info-value { font-size: 0.875rem; color: #1e293b; }
    .amount { font-weight: 600; color: #16a34a; }
    .discount { color: #dc2626; }
    .balance-due { color: #d97706; font-weight: 600; }
    .total-row { padding-top: 0.75rem; margin-top: 0.25rem; border-top: 2px solid #e2e8f0; border-bottom: none; }
    .total-amount { font-size: 1.1rem; font-weight: 700; color: #1e293b; }
    .method-badge { font-weight: 500; text-transform: uppercase; font-size: 0.8rem; }
    .staff-name { font-weight: 600; color: #0891b2; }

    .status-badge {
      padding: 0.2rem 0.6rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 500;
      text-transform: capitalize; background: #f1f5f9; color: #475569;
      &.lg { font-size: 0.8rem; padding: 0.3rem 0.8rem; }
      &[data-status="draft"] { background: #f1f5f9; color: #64748b; }
      &[data-status="confirmed"] { background: #dbeafe; color: #1d4ed8; }
      &[data-status="processing"] { background: #fef3c7; color: #d97706; }
      &[data-status="packed"] { background: #e0e7ff; color: #4338ca; }
      &[data-status="assigned"] { background: #cffafe; color: #0891b2; }
      &[data-status="out_for_delivery"] { background: #d1fae5; color: #059669; }
      &[data-status="delivered"] { background: #dcfce7; color: #16a34a; }
      &[data-status="cancelled"] { background: #fee2e2; color: #dc2626; }
    }
    .payment-badge {
      padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: 500;
      text-transform: capitalize; background: #fef9c3; color: #a16207;
      &[data-payment="paid"] { background: #dcfce7; color: #16a34a; }
      &[data-payment="partial"] { background: #fef3c7; color: #d97706; }
      &[data-payment="pending"] { background: #fee2e2; color: #dc2626; }
    }

    .address-block {
      p { margin: 0.25rem 0; font-size: 0.875rem; color: #334155; }
    }
    .addr-label { display: inline-block; font-weight: 600; font-size: 0.8rem; color: #1e293b; margin-bottom: 0.25rem; }
    .landmark { color: #64748b; font-size: 0.8rem; margin-top: 0.4rem; }

    .items-table-wrapper { overflow-x: auto; }
    .items-table { width: 100%; border-collapse: collapse; }
    .items-table th {
      text-align: left; padding: 0.6rem 0.75rem; font-size: 0.7rem; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.03em; color: #64748b; background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }
    .items-table td { padding: 0.6rem 0.75rem; border-bottom: 1px solid #f1f5f9; font-size: 0.85rem; color: #334155; }
    .items-table tfoot td { padding: 0.75rem; font-weight: 600; border-top: 2px solid #e2e8f0; border-bottom: none; }
    .row-num { color: #94a3b8; font-size: 0.75rem; }
    .item-name { font-weight: 500; color: #1e293b; }
    .qty { font-weight: 600; }
    .foot-label { text-align: right; color: #64748b; }

    .note-block {
      padding: 0.75rem; background: #f8fafc; border-radius: 8px; margin-bottom: 0.75rem;
      &.internal { background: #fffbeb; border: 1px solid #fef3c7; }
      &:last-child { margin-bottom: 0; }
      p { margin: 0.25rem 0 0; font-size: 0.85rem; color: #334155; }
    }
    .note-label { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; color: #64748b; }

    /* Timeline */
    .timeline { position: relative; padding-left: 1.5rem; }
    .timeline::before {
      content: ''; position: absolute; left: 7px; top: 0; bottom: 0;
      width: 2px; background: #e2e8f0;
    }
    .timeline-item { position: relative; padding-bottom: 1.25rem; }
    .timeline-item:last-child { padding-bottom: 0; }
    .timeline-dot {
      position: absolute; left: -1.5rem; top: 0.25rem; width: 14px; height: 14px;
      border-radius: 50%; background: #e2e8f0; border: 2px solid #fff; box-shadow: 0 0 0 2px #e2e8f0;
      &[data-status="confirmed"] { background: #3b82f6; box-shadow: 0 0 0 2px #dbeafe; }
      &[data-status="processing"] { background: #d97706; box-shadow: 0 0 0 2px #fef3c7; }
      &[data-status="packed"] { background: #4338ca; box-shadow: 0 0 0 2px #e0e7ff; }
      &[data-status="assigned"] { background: #0891b2; box-shadow: 0 0 0 2px #cffafe; }
      &[data-status="out_for_delivery"] { background: #059669; box-shadow: 0 0 0 2px #d1fae5; }
      &[data-status="delivered"] { background: #16a34a; box-shadow: 0 0 0 2px #dcfce7; }
      &[data-status="cancelled"] { background: #dc2626; box-shadow: 0 0 0 2px #fee2e2; }
      &[data-status="draft"] { background: #94a3b8; box-shadow: 0 0 0 2px #f1f5f9; }
    }
    .timeline-content { padding-left: 0.5rem; }
    .timeline-header { display: flex; align-items: center; gap: 0.75rem; }
    .timeline-status {
      font-size: 0.825rem; font-weight: 600; text-transform: capitalize;
      &[data-status="confirmed"] { color: #1d4ed8; }
      &[data-status="processing"] { color: #d97706; }
      &[data-status="packed"] { color: #4338ca; }
      &[data-status="assigned"] { color: #0891b2; }
      &[data-status="out_for_delivery"] { color: #059669; }
      &[data-status="delivered"] { color: #16a34a; }
      &[data-status="cancelled"] { color: #dc2626; }
      &[data-status="draft"] { color: #64748b; }
    }
    .timeline-date { font-size: 0.75rem; color: #94a3b8; }
    .timeline-user { margin: 0.15rem 0 0; font-size: 0.75rem; color: #64748b; }
    .timeline-notes { margin: 0.15rem 0 0; font-size: 0.8rem; color: #475569; font-style: italic; }

    /* Cancel Modal */
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex;
      align-items: center; justify-content: center; z-index: 1000; padding: 1rem;
    }
    .modal {
      background: #fff; border-radius: 12px; padding: 1.5rem; max-width: 480px; width: 100%;
      box-shadow: 0 20px 40px rgba(0,0,0,0.15);
      h3 { margin: 0 0 0.5rem; color: #1e293b; font-size: 1.1rem; }
    }
    .modal-desc { margin: 0 0 1rem; font-size: 0.85rem; color: #64748b; }
    .cancel-textarea {
      width: 100%; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 8px;
      font-size: 0.85rem; resize: vertical; outline: none; font-family: inherit;
      &:focus { border-color: #dc2626; box-shadow: 0 0 0 3px rgba(220,38,38,0.1); }
    }
    .modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1rem; }
    .assign-select {
      width: 100%; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 8px;
      font-size: 0.85rem; outline: none; font-family: inherit; background: #fff;
      &:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
    }

    .empty { color: #94a3b8; font-size: 0.85rem; text-align: center; padding: 1rem; }
  `],
})
export class OrderDetailPage implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  order = signal<any>(null);
  loading = signal(true);
  showCancelModal = signal(false);
  cancelReason = '';
  deliveryStaff = signal<DeliveryStaff[]>([]);
  showAssignModal = signal(false);
  selectedStaffId = signal<string>('');

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadOrder(id);
    }
    this.api.get<any>('/delivery/staff').subscribe({
      next: (res) => this.deliveryStaff.set(res.data || []),
      error: () => {},
    });
  }

  loadOrder(id: string) {
    this.loading.set(true);
    this.api.get<any>(`/orders/${id}`).subscribe({
      next: (res) => {
        this.order.set(res.data?.order || res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  // Status transition helpers
  canConfirm(): boolean { return this.order()?.status === 'draft'; }
  canProcess(): boolean { return this.order()?.status === 'confirmed'; }
  canPack(): boolean { return this.order()?.status === 'processing'; }
  canAssign(): boolean { return this.order()?.status === 'packed'; }
  canMarkOut(): boolean { return this.order()?.status === 'assigned'; }
  canDeliver(): boolean { return this.order()?.status === 'out_for_delivery'; }
  canCancel(): boolean {
    const status = this.order()?.status;
    return status && !['delivered', 'cancelled'].includes(status);
  }

  updateStatus(status: string) {
    const id = this.order()?.id;
    if (!id) return;
    this.api.patch<any>(`/orders/${id}/status`, { status }).subscribe({
      next: (res) => {
        const updated = res.data?.order || res.data;
        if (updated) {
          this.order.set(updated);
        } else {
          this.loadOrder(id);
        }
      },
      error: () => {
        alert('Failed to update status. Please try again.');
      },
    });
  }

  confirmCancel() {
    const id = this.order()?.id;
    if (!id || !this.cancelReason.trim()) return;
    this.api.post<any>(`/orders/${id}/cancel`, { reason: this.cancelReason.trim() }).subscribe({
      next: (res) => {
        const updated = res.data?.order || res.data;
        if (updated) {
          this.order.set(updated);
        } else {
          this.loadOrder(id);
        }
        this.showCancelModal.set(false);
        this.cancelReason = '';
      },
      error: () => {
        alert('Failed to cancel order. Please try again.');
      },
    });
  }

  confirmAssign() {
    const id = this.order()?.id;
    const staffId = this.selectedStaffId();
    if (!id || !staffId) return;
    this.api.patch<any>(`/orders/${id}/status`, { status: 'assigned', deliveryStaff: staffId }).subscribe({
      next: (res) => {
        const updated = res.data?.order || res.data;
        if (updated) {
          this.order.set(updated);
        } else {
          this.loadOrder(id);
        }
        this.showAssignModal.set(false);
        this.selectedStaffId.set('');
      },
      error: () => {
        alert('Failed to assign delivery staff. Please try again.');
      },
    });
  }

  formatStatus(status: string): string {
    if (!status) return '—';
    return status.replace(/_/g, ' ');
  }

  formatPaymentMethod(method: string): string {
    if (!method) return '—';
    const map: Record<string, string> = {
      cash: 'Cash',
      cod: 'Cash on Delivery',
      upi: 'UPI',
      bank_transfer: 'Bank Transfer',
      credit: 'Credit',
    };
    return map[method] || method;
  }
}
