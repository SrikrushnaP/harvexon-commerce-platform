import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';
import { ApiService } from '@frontend/shared-data-access';

@Component({
  selector: 'app-purchase-detail',
  standalone: true,
  imports: [RouterModule, DecimalPipe, DatePipe],
  template: `
    <div class="page-header">
      <div>
        <h1>{{ purchase()?.purchaseNumber || 'Purchase Order' }}</h1>
        <p class="subtitle">
          @if (purchase()) {
            Created {{ purchase().purchaseDate | date:'mediumDate' }}
            @if (purchase().expectedDeliveryDate) {
              · Expected {{ purchase().expectedDeliveryDate | date:'mediumDate' }}
            }
          }
        </p>
      </div>
      <div class="header-actions">
        <a routerLink="/purchasing" class="btn btn-secondary">← Back to POs</a>
        @if (purchase()) {
          <span class="status-badge lg" [attr.data-status]="purchase().status">{{ purchase().status }}</span>
        }
      </div>
    </div>

    @if (loading()) {
      <div class="loading">Loading purchase order...</div>
    } @else if (purchase()) {
      <!-- Action Buttons -->
      <div class="actions-bar">
        @if (purchase().status === 'draft') {
          <button (click)="updateStatus('ordered')" class="btn btn-primary" [disabled]="actionLoading()">
            📦 Mark Ordered
          </button>
        }
        @if (purchase().status === 'ordered') {
          <button (click)="updateStatus('partial')" class="btn btn-warning" [disabled]="actionLoading()">
            📋 Mark Partial Received
          </button>
          <button (click)="updateStatus('received')" class="btn btn-success" [disabled]="actionLoading()">
            ✅ Mark Received
          </button>
        }
        @if (purchase().status === 'partial') {
          <button (click)="updateStatus('received')" class="btn btn-success" [disabled]="actionLoading()">
            ✅ Mark Fully Received
          </button>
        }
        @if (purchase().status !== 'received' && purchase().status !== 'cancelled') {
          <button (click)="openCancelModal()" class="btn btn-danger">
            ✕ Cancel
          </button>
        }
      </div>

      <div class="detail-grid">
        <!-- Supplier Info -->
        <div class="info-card">
          <h2>Supplier Information</h2>
          @if (purchase().supplier) {
            <div class="info-row">
              <span class="info-label">Name</span>
              <span class="info-value">{{ purchase().supplier.name }}</span>
            </div>
            @if (purchase().supplier.contactPerson) {
              <div class="info-row">
                <span class="info-label">Contact Person</span>
                <span class="info-value">{{ purchase().supplier.contactPerson }}</span>
              </div>
            }
            @if (purchase().supplier.phone) {
              <div class="info-row">
                <span class="info-label">Phone</span>
                <span class="info-value">{{ purchase().supplier.phone }}</span>
              </div>
            }
            @if (purchase().supplier.email) {
              <div class="info-row">
                <span class="info-label">Email</span>
                <span class="info-value">{{ purchase().supplier.email }}</span>
              </div>
            }
            @if (purchase().supplier.gstin) {
              <div class="info-row">
                <span class="info-label">GSTIN</span>
                <span class="info-value">{{ purchase().supplier.gstin }}</span>
              </div>
            }
          } @else {
            <p class="empty">No supplier information</p>
          }
        </div>

        <!-- Payment Info -->
        <div class="info-card">
          <h2>Payment Information</h2>
          <div class="info-row">
            <span class="info-label">Payment Status</span>
            <span class="payment-badge" [attr.data-payment]="purchase().paymentStatus">{{ purchase().paymentStatus }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Paid Amount</span>
            <span class="info-value amount">₹{{ purchase().paidAmount | number }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Total Due</span>
            <span class="info-value amount">₹{{ purchase().total | number }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Outstanding</span>
            <span class="info-value outstanding">₹{{ (purchase().total - purchase().paidAmount) | number }}</span>
          </div>
          @if (purchase().receivedDate) {
            <div class="info-row">
              <span class="info-label">Received Date</span>
              <span class="info-value">{{ purchase().receivedDate | date:'mediumDate' }}</span>
            </div>
          }
          @if (purchase().notes) {
            <div class="info-row">
              <span class="info-label">Notes</span>
              <span class="info-value">{{ purchase().notes }}</span>
            </div>
          }
        </div>
      </div>

      <!-- Items Table -->
      <div class="section-card">
        <h2>Items ({{ purchase().items?.length || 0 }})</h2>
        <div class="items-table-wrap">
          <table class="items-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Batch #</th>
                <th>Expiry</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Unit Cost</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              @for (item of purchase().items; track $index) {
                <tr>
                  <td class="product-name">{{ item.product?.name || item.name }}</td>
                  <td>{{ item.batchNumber || '—' }}</td>
                  <td>{{ item.expiryDate ? (item.expiryDate | date:'shortDate') : '—' }}</td>
                  <td class="text-right">{{ item.quantity }}</td>
                  <td class="text-right">₹{{ item.unitCost | number }}</td>
                  <td class="text-right amount">₹{{ item.total | number }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="empty">No items</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Financial Summary -->
      <div class="section-card financial-summary">
        <h2>Financial Summary</h2>
        <div class="summary-rows">
          <div class="summary-row">
            <span>Subtotal</span>
            <span>₹{{ purchase().subtotal | number }}</span>
          </div>
          @if (purchase().tax) {
            <div class="summary-row">
              <span>Tax</span>
              <span>₹{{ purchase().tax | number }}</span>
            </div>
          }
          @if (purchase().shippingCost) {
            <div class="summary-row">
              <span>Shipping</span>
              <span>₹{{ purchase().shippingCost | number }}</span>
            </div>
          }
          @if (purchase().discount) {
            <div class="summary-row discount">
              <span>Discount</span>
              <span>-₹{{ purchase().discount | number }}</span>
            </div>
          }
          <div class="summary-row total">
            <span>Total</span>
            <span>₹{{ purchase().total | number }}</span>
          </div>
        </div>
      </div>
    }

    @if (showCancelModal()) {
      <div class="modal-overlay" (click)="closeCancelModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Cancel Purchase Order</h2>
            <button class="close-btn" (click)="closeCancelModal()">✕</button>
          </div>
          <div class="modal-body">
            <p>Are you sure you want to cancel <strong>{{ purchase()?.purchaseNumber }}</strong>?</p>
            <div class="form-group">
              <label>Cancellation Reason *</label>
              <textarea #cancelReason rows="3" class="form-input" placeholder="Provide a reason for cancellation"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            @if (cancelError()) {
              <span class="form-error">{{ cancelError() }}</span>
            }
            <button (click)="closeCancelModal()" class="btn btn-secondary">Keep Order</button>
            <button (click)="cancelOrder(cancelReason.value)" class="btn btn-danger" [disabled]="actionLoading()">
              {{ actionLoading() ? 'Cancelling...' : 'Confirm Cancel' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .page-header h1 { margin: 0 0 0.25rem; color: #1e293b; font-size: 1.5rem; }
    .subtitle { color: #64748b; margin: 0; font-size: 0.875rem; }
    .header-actions { display: flex; gap: 0.75rem; align-items: center; }
    .btn { padding: 0.6rem 1.2rem; border-radius: 8px; text-decoration: none; font-size: 0.875rem; font-weight: 500; cursor: pointer; border: none; }
    .btn-primary { background: #3b82f6; color: #fff; }
    .btn-primary:hover { background: #2563eb; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-secondary { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
    .btn-secondary:hover { background: #e2e8f0; }
    .btn-success { background: #16a34a; color: #fff; }
    .btn-success:hover { background: #15803d; }
    .btn-success:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-warning { background: #d97706; color: #fff; }
    .btn-warning:hover { background: #b45309; }
    .btn-warning:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-danger { background: #dc2626; color: #fff; }
    .btn-danger:hover { background: #b91c1c; }
    .btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }
    .loading { color: #64748b; padding: 3rem; text-align: center; }

    .actions-bar { display: flex; gap: 0.75rem; margin-bottom: 1.5rem; flex-wrap: wrap; }

    .status-badge {
      padding: 0.2rem 0.6rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 500; text-transform: capitalize;
      background: #f1f5f9; color: #475569;
      &.lg { font-size: 0.8rem; padding: 0.3rem 0.8rem; }
      &[data-status="draft"] { background: #f1f5f9; color: #475569; }
      &[data-status="ordered"] { background: #dbeafe; color: #1d4ed8; }
      &[data-status="partial"] { background: #fef3c7; color: #d97706; }
      &[data-status="received"] { background: #dcfce7; color: #16a34a; }
      &[data-status="cancelled"] { background: #fee2e2; color: #dc2626; }
    }
    .payment-badge {
      padding: 0.2rem 0.6rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 500; text-transform: capitalize;
      &[data-payment="pending"] { background: #fef3c7; color: #d97706; }
      &[data-payment="partial"] { background: #dbeafe; color: #1d4ed8; }
      &[data-payment="paid"] { background: #dcfce7; color: #16a34a; }
    }

    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
    @media (max-width: 900px) { .detail-grid { grid-template-columns: 1fr; } }

    .info-card, .section-card {
      background: #fff; border-radius: 12px; padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06); border: 1px solid #f1f5f9;
      h2 { margin: 0 0 1rem; font-size: 1rem; color: #334155; }
    }
    .section-card { margin-bottom: 1.5rem; }
    .info-row { display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0; border-bottom: 1px solid #f8fafc; }
    .info-label { font-size: 0.8rem; color: #64748b; text-transform: uppercase; }
    .info-value { font-size: 0.875rem; color: #1e293b; }
    .amount { font-weight: 600; color: #16a34a; }
    .outstanding { font-weight: 600; color: #d97706; }

    .items-table-wrap { overflow-x: auto; }
    .items-table { width: 100%; border-collapse: collapse; }
    .items-table th {
      text-align: left; padding: 0.6rem 0.75rem; font-size: 0.75rem; font-weight: 600;
      text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0;
    }
    .items-table td { padding: 0.6rem 0.75rem; border-bottom: 1px solid #f1f5f9; font-size: 0.85rem; color: #334155; }
    .items-table .text-right { text-align: right; }
    .product-name { font-weight: 500; color: #1e293b; }

    .financial-summary { max-width: 400px; margin-left: auto; }
    .summary-rows { display: flex; flex-direction: column; }
    .summary-row {
      display: flex; justify-content: space-between; padding: 0.6rem 0; font-size: 0.875rem; color: #334155;
      border-bottom: 1px solid #f8fafc;
      &.discount span:last-child { color: #16a34a; }
      &.total { border-top: 2px solid #e2e8f0; border-bottom: none; padding-top: 0.75rem; font-weight: 700; font-size: 1rem; color: #1e293b; }
    }

    .empty { text-align: center; color: #94a3b8; padding: 1rem; font-size: 0.875rem; }

    /* Modal */
    .modal-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center; z-index: 1000;
    }
    .modal {
      background: #fff; border-radius: 12px; width: 90%; max-width: 480px;
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
      p { margin: 0 0 1rem; font-size: 0.9rem; color: #334155; }
    }
    .modal-footer {
      display: flex; justify-content: flex-end; align-items: center; gap: 0.75rem; padding: 1rem 1.5rem;
      border-top: 1px solid #e2e8f0;
    }
    .form-group { margin-bottom: 1rem; label { display: block; font-size: 0.8rem; color: #475569; margin-bottom: 0.3rem; font-weight: 500; } }
    .form-input {
      width: 100%; padding: 0.6rem 0.75rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.875rem;
      &:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
    }
    .form-error { color: #dc2626; font-size: 0.8rem; margin-right: auto; }
  `],
})
export class PurchaseDetailPage implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  purchase = signal<any>(null);
  loading = signal(true);
  actionLoading = signal(false);
  showCancelModal = signal(false);
  cancelError = signal('');

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPurchase(id);
    }
  }

  loadPurchase(id: string) {
    this.loading.set(true);
    this.api.get<any>(`/purchasing/purchases/${id}`).subscribe({
      next: (res) => {
        this.purchase.set(res.data?.purchase || res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  updateStatus(status: string) {
    const id = this.purchase()?.id;
    if (!id) return;
    this.actionLoading.set(true);
    this.api.patch<any>(`/purchasing/purchases/${id}/status`, { status }).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.loadPurchase(id);
      },
      error: () => this.actionLoading.set(false),
    });
  }

  openCancelModal() {
    this.showCancelModal.set(true);
    this.cancelError.set('');
  }

  closeCancelModal() {
    this.showCancelModal.set(false);
  }

  cancelOrder(reason: string) {
    if (!reason.trim()) {
      this.cancelError.set('Please provide a cancellation reason');
      return;
    }
    const id = this.purchase()?.id;
    if (!id) return;
    this.actionLoading.set(true);
    this.cancelError.set('');
    this.api.post<any>(`/purchasing/purchases/${id}/cancel`, { reason }).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.closeCancelModal();
        this.loadPurchase(id);
      },
      error: (err) => {
        this.actionLoading.set(false);
        this.cancelError.set(err?.error?.message || 'Failed to cancel order');
      },
    });
  }
}
