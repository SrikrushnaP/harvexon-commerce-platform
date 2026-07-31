import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ApiService } from '@frontend/shared-data-access';

interface OrderItem {
  product: string | { id: string; name: string; sku: string; images: string[] };
  name: string;
  quantity: number;
  price: number;
  total: number;
  unit: string;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  deliveryAddress: { label?: string; line1: string; line2?: string; city: string; state: string; pincode: string; phone?: string };
  paymentMethod: string;
  notes?: string;
  deliveryStaff?: { name: string; phone?: string };
}

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [RouterModule, DatePipe],
  template: `
    <div class="detail-container">
      <header class="detail-header">
        <a routerLink="/orders" class="back-btn">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </a>
        <h1>Order Details</h1>
      </header>

      @if (loading()) {
        <div class="loading-skeleton">
          <div class="skel-block skel-lg"></div>
          <div class="skel-block skel-md"></div>
          <div class="skel-block skel-sm"></div>
        </div>
      } @else if (order()) {
        <!-- Order Header -->
        <div class="order-header-card">
          <div class="order-header-top">
            <span class="order-num">#{{ order()!.orderNumber }}</span>
            <span class="status-badge" [class]="'status-' + order()!.status">{{ getStatusLabel(order()!.status) }}</span>
          </div>
          <div class="order-dates">
            <span>Placed: {{ order()!.createdAt | date:'dd MMM yyyy, hh:mm a' }}</span>
          </div>
        </div>

        <!-- Vertical Timeline -->
        <div class="timeline-section">
          <h3 class="section-title">Order Progress</h3>
          <div class="timeline">
            @for (step of statusSteps; track step; let i = $index) {
              <div class="timeline-step" [class.active]="isStepActive(step)" [class.current]="order()!.status === step">
                <div class="timeline-dot-wrapper">
                  <div class="timeline-dot"></div>
                  @if (order()!.status === step) { <div class="pulse-ring"></div> }
                </div>
                @if (i < statusSteps.length - 1) { <div class="timeline-line" [class.active]="isStepActive(statusSteps[i + 1])"></div> }
                <div class="timeline-content">
                  <span class="timeline-label">{{ getStatusLabel(step) }}</span>
                  @if (isStepActive(step)) {
                    <span class="timeline-time">{{ order()!.updatedAt | date:'dd MMM, hh:mm a' }}</span>
                  }
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Delivery Partner -->
        @if (order()!.deliveryStaff && isDeliveryPhase()) {
          <div class="detail-card delivery-partner-card">
            <h3 class="section-title">🚚 Delivery Partner</h3>
            <p class="partner-name">{{ order()!.deliveryStaff!.name }}</p>
            @if (order()!.deliveryStaff!.phone) {
              <p class="partner-phone">📞 {{ order()!.deliveryStaff!.phone }}</p>
            }
          </div>
        }

        <!-- Items -->
        <div class="detail-card">
          <h3 class="section-title">Items</h3>
          <div class="items-table">
            @for (item of order()!.items; track item.product; let odd = $odd) {
              <div class="item-row" [class.alt]="odd">
                <div class="item-info">
                  <span class="item-name">{{ item.name }}</span>
                  <span class="item-qty">&times; {{ item.quantity }}</span>
                </div>
                <span class="item-price">&#8377;{{ item.price * item.quantity }}</span>
              </div>
            }
          </div>
          <div class="items-total">
            <span>Total</span>
            <span class="total-amount">&#8377;{{ orderTotal() }}</span>
          </div>
        </div>

        <!-- Delivery Address -->
        <div class="detail-card address-card">
          <h3 class="section-title">Delivery Address</h3>
          <p class="address-text">
            {{ order()!.deliveryAddress.line1 }}<br>
            {{ order()!.deliveryAddress.city }}, {{ order()!.deliveryAddress.state }} - {{ order()!.deliveryAddress.pincode }}
          </p>
          @if (order()!.deliveryAddress.phone) {
            <p class="address-phone">&#128222; {{ order()!.deliveryAddress.phone }}</p>
          }
        </div>

        <!-- Payment -->
        <div class="detail-card">
          <h3 class="section-title">Payment Method</h3>
          <p class="payment-text">{{ getPaymentLabel(order()!.paymentMethod) }}</p>
        </div>

        <!-- Notes -->
        @if (order()!.notes) {
          <div class="detail-card">
            <h3 class="section-title">Notes</h3>
            <p class="notes-text">{{ order()!.notes }}</p>
          </div>
        }
      } @else {
        <div class="empty-state">
          <div class="empty-icon">😕</div>
          <h3>Order not found</h3>
          <p>We couldn't load this order. Please try again.</p>
          <a routerLink="/orders" class="shop-btn">Back to Orders</a>
        </div>
      }
    </div>
  `,
  styles: [`
    .detail-container { max-width: 600px; margin: 0 auto; padding: 16px; }
    .detail-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
    .detail-header h1 { font-size: 1.5rem; font-weight: 700; color: #1a1a1a; margin: 0; }
    .back-btn { width: 36px; height: 36px; border-radius: 50%; border: 1px solid #e5e7eb; background: white; display: flex; align-items: center; justify-content: center; color: #374151; text-decoration: none; }
    .back-btn:hover { background: #f3f4f6; }

    .loading-skeleton { display: flex; flex-direction: column; gap: 16px; }
    .skel-block { border-radius: 14px; background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
    .skel-lg { height: 80px; }
    .skel-md { height: 200px; }
    .skel-sm { height: 120px; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    .order-header-card { background: white; border-radius: 14px; padding: 18px 20px; margin-bottom: 16px; border: 1px solid #f0f0f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .order-header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .order-num { font-size: 1.1rem; font-weight: 700; color: #1a1a1a; }
    .status-badge { padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; }
    .status-draft { background: #ecfdf5; color: #065f46; }
    .status-confirmed { background: #dbeafe; color: #1e40af; }
    .status-processing { background: #f3e8ff; color: #7c3aed; }
    .status-packed { background: #cffafe; color: #0e7490; }
    .status-assigned { background: #fef3c7; color: #92400e; }
    .status-out_for_delivery { background: #d1fae5; color: #065f46; }
    .status-delivered { background: #dcfce7; color: #166534; }
    .status-cancelled { background: #fee2e2; color: #991b1b; }
    .order-dates { font-size: 0.8rem; color: #9ca3af; }

    /* Vertical Timeline */
    .timeline-section { background: white; border-radius: 14px; padding: 20px; margin-bottom: 16px; border: 1px solid #f0f0f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .section-title { font-size: 0.95rem; font-weight: 600; color: #1a1a1a; margin: 0 0 16px; }

    .timeline { position: relative; padding-left: 0; }
    .timeline-step { position: relative; display: flex; align-items: flex-start; padding-left: 36px; min-height: 50px; margin-bottom: 4px; }
    .timeline-step:last-child { min-height: auto; }

    .timeline-dot-wrapper { position: absolute; left: 0; top: 2px; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; }
    .timeline-dot { width: 12px; height: 12px; border-radius: 50%; background: #e5e7eb; border: 2px solid #e5e7eb; transition: all 0.3s; z-index: 1; }
    .timeline-step.active .timeline-dot { background: #22c55e; border-color: #22c55e; }
    .timeline-step.current .timeline-dot { background: #22c55e; border-color: #22c55e; box-shadow: 0 0 0 4px rgba(34,197,94,0.2); }

    .pulse-ring { position: absolute; width: 24px; height: 24px; border-radius: 50%; border: 2px solid #22c55e; animation: pulse 2s infinite; }
    @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(1.8); opacity: 0; } }

    .timeline-line { position: absolute; left: 11px; top: 26px; bottom: -4px; width: 2px; background: #e5e7eb; }
    .timeline-line.active { background: #22c55e; }

    .timeline-content { display: flex; flex-direction: column; gap: 2px; padding-top: 2px; }
    .timeline-label { font-size: 0.85rem; font-weight: 500; color: #6b7280; text-transform: capitalize; }
    .timeline-step.active .timeline-label { color: #1a1a1a; font-weight: 600; }
    .timeline-time { font-size: 0.75rem; color: #9ca3af; }

    /* Detail Cards */
    .detail-card { background: white; border-radius: 14px; padding: 18px 20px; margin-bottom: 16px; border: 1px solid #f0f0f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .address-card { border-left: 4px solid #22c55e; }

    /* Delivery Partner */
    .delivery-partner-card { border-left: 4px solid #3b82f6; }
    .partner-name { font-size: 1rem; font-weight: 600; color: #1a1a1a; margin: 0 0 6px; }
    .partner-phone { font-size: 0.9rem; color: #4b5563; margin: 0; }

    .items-table { display: flex; flex-direction: column; gap: 0; }
    .item-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; border-radius: 8px; }
    .item-row.alt { background: #f9fafb; }
    .item-info { display: flex; align-items: center; gap: 6px; }
    .item-name { font-size: 0.9rem; font-weight: 500; color: #374151; }
    .item-qty { font-size: 0.8rem; color: #9ca3af; }
    .item-price { font-size: 0.9rem; font-weight: 600; color: #1a1a1a; }
    .items-total { display: flex; justify-content: space-between; align-items: center; padding: 14px 14px 0; border-top: 1px solid #e5e7eb; margin-top: 8px; font-weight: 600; color: #1a1a1a; }
    .total-amount { font-size: 1.1rem; font-weight: 700; }

    .address-text { font-size: 0.9rem; color: #4b5563; line-height: 1.5; margin: 0; }
    .address-phone { font-size: 0.85rem; color: #6b7280; margin: 8px 0 0; }
    .payment-text { font-size: 0.9rem; color: #4b5563; margin: 0; }
    .notes-text { font-size: 0.9rem; color: #4b5563; margin: 0; font-style: italic; }
  `]
})
export class OrderDetailPage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private pollingInterval: ReturnType<typeof setInterval> | null = null;

  order = signal<OrderDetail | null>(null);
  loading = signal<boolean>(true);

  statusSteps = ['draft', 'confirmed', 'processing', 'packed', 'assigned', 'out_for_delivery', 'delivered'];

  orderTotal = computed(() => {
    const o = this.order();
    if (!o) return 0;
    return o.total ?? 0;
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadOrder(id);
      this.pollingInterval = setInterval(() => this.loadOrder(id), 30000);
    }
  }

  ngOnDestroy() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  private loadOrder(id: string) {
    this.api.get<any>(`/orders/${id}`).subscribe({
      next: (res) => {
        const orderData = res.data?.order || res.data || null;
        this.order.set(orderData);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  isStepActive(step: string): boolean {
    const order = this.order();
    if (!order) return false;
    const currentIdx = this.statusSteps.indexOf(order.status);
    const stepIdx = this.statusSteps.indexOf(step);
    return stepIdx <= currentIdx;
  }

  isDeliveryPhase(): boolean {
    const order = this.order();
    if (!order) return false;
    return ['assigned', 'out_for_delivery', 'delivered'].includes(order.status);
  }

  getStatusLabel(step: string): string {
    const labels: Record<string, string> = {
      draft: 'Order Placed',
      confirmed: 'Confirmed',
      processing: 'Preparing',
      packed: 'Ready',
      assigned: 'Assigned',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    };
    return labels[step] || step.replace('_', ' ');
  }

  getPaymentLabel(method: string): string {
    const labels: Record<string, string> = {
      cod: '💵 Cash on Delivery',
      upi: '📱 UPI Payment',
      card: '💳 Credit/Debit Card'
    };
    return labels[method] || method;
  }
}
