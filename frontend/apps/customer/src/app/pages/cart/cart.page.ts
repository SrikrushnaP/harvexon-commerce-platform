import { Component, inject, computed, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { SettingsService } from '../../services/settings.service';
import { ConfirmDialogComponent } from '../../components/confirm-dialog.component';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [RouterModule, ConfirmDialogComponent],
  template: `
    <div class="cart-page">
      <div class="page-header">
        <h1 class="page-title">Your Cart</h1>
        <span class="item-count">{{ cart.cartCount() }} {{ cart.cartCount() === 1 ? 'item' : 'items' }}</span>
      </div>

      @if (cart.items().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <path d="M8 8H13.3L18.1 40.8C18.4 42.6 19.9 44 21.7 44H49.5C51.2 44 52.7 42.8 53.1 41.1L57.8 20.1C58.3 18 56.7 16 54.5 16H16" stroke="#A0AEC0" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="23" cy="52" r="3" fill="#A0AEC0"/>
              <circle cx="48" cy="52" r="3" fill="#A0AEC0"/>
            </svg>
          </div>
          <h2 class="empty-title">Your cart is empty</h2>
          <p class="empty-subtitle">Add some fresh products to get started</p>
          <a routerLink="/catalog" class="browse-btn">Browse Catalog</a>
        </div>
      } @else {
        <div class="cart-layout">
          <div class="cart-items">
            @for (item of cart.items(); track item.productId) {
              <div class="cart-item">
                <div class="item-info">
                  <h3 class="item-name">{{ item.name }}</h3>
                  <span class="item-price-unit">{{ settings.currencySymbol() }}{{ item.basePrice }} / {{ item.unit }}</span>
                </div>
                <div class="item-actions">
                  <div class="quantity-controls">
                    <button class="qty-btn" (click)="cart.updateQuantity(item.productId, item.quantity - 1)" [disabled]="item.quantity <= 1">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M3 7H11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                      </svg>
                    </button>
                    <span class="qty-value">{{ item.quantity }}</span>
                    <button class="qty-btn" (click)="cart.updateQuantity(item.productId, item.quantity + 1)">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M7 3V11M3 7H11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                      </svg>
                    </button>
                  </div>
                  <button class="remove-btn" (click)="confirmRemoveItem(item.productId, item.name)" aria-label="Remove item">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M2 4H14M5 4V3C5 2.4 5.4 2 6 2H10C10.6 2 11 2.4 11 3V4M6 7V12M10 7V12M3 4L4 13C4 13.6 4.4 14 5 14H11C11.6 14 12 13.6 12 13L13 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                </div>
                <div class="item-total">
                  {{ settings.currencySymbol() }}{{ item.basePrice * item.quantity }}
                </div>
              </div>
            }
          </div>

          <div class="order-summary">
            <h2 class="summary-title">Order Summary</h2>
            <div class="summary-row">
              <span>Subtotal</span>
              <span>{{ settings.currencySymbol() }}{{ cart.cartTotal().toFixed(2) }}</span>
            </div>
            <div class="summary-row">
              <span>Delivery</span>
              <span class="free-delivery">{{ deliveryDisplay() }}</span>
            </div>
            <div class="summary-row">
              <span>GST (5%)</span>
              <span>{{ settings.currencySymbol() }}{{ gstAmount().toFixed(2) }}</span>
            </div>
            <div class="summary-divider"></div>
            <div class="summary-row total-row">
              <span>Total</span>
              <span class="total-amount">{{ settings.currencySymbol() }}{{ grandTotal().toFixed(2) }}</span>
            </div>
            @if (!settings.acceptOrders()) {
              <div class="cart-warning">🚫 We are not accepting orders right now. Please check back later.</div>
            }
            @if (settings.acceptOrders() && settings.minOrderAmount() > 0 && cart.cartTotal() < settings.minOrderAmount()) {
              <div class="cart-warning">⚠️ Minimum order amount is {{ settings.currencySymbol() }}{{ settings.minOrderAmount() }}. Add {{ settings.currencySymbol() }}{{ (settings.minOrderAmount() - cart.cartTotal()).toFixed(0) }} more.</div>
            }
            <a routerLink="/checkout" class="checkout-btn" [class.disabled]="!canCheckout()">
              Proceed to Checkout
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M4 9H14M14 9L10 5M14 9L10 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </a>
          </div>
        </div>
      }

      <app-confirm-dialog
        [open]="showRemoveConfirm()"
        title="Remove Item"
        [message]="'Remove ' + pendingRemoveName() + ' from your cart?'"
        confirmText="Remove"
        (confirmed)="doRemoveItem()"
        (cancelled)="showRemoveConfirm.set(false)"
      />
    </div>
  `,
  styles: [`
    .cart-page { min-height: calc(100vh - 56px - 64px); min-height: calc(100dvh - 56px - 64px); padding: 16px; background: #f8faf8; max-width: 960px; margin: 0 auto; overflow-x: hidden; }
    .page-header { display: flex; align-items: baseline; gap: 12px; margin-bottom: 24px; }
    .page-title { font-size: 24px; font-weight: 700; color: #1a202c; margin: 0; }
    .item-count { font-size: 14px; color: #718096; font-weight: 500; }
    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; text-align: center; }
    .empty-icon { margin-bottom: 24px; opacity: 0.7; }
    .empty-title { font-size: 20px; font-weight: 700; color: #2d3748; margin: 0 0 8px 0; }
    .empty-subtitle { font-size: 14px; color: #718096; margin: 0 0 28px 0; }
    .browse-btn { display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #38c172 0%, #2d8a4e 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-size: 15px; font-weight: 600; transition: all 0.2s; box-shadow: 0 4px 12px rgba(45,138,78,0.3); }
    .browse-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(45,138,78,0.4); }
    .cart-layout { display: grid; grid-template-columns: 1fr; gap: 24px; }
    @media (min-width: 768px) { .cart-layout { grid-template-columns: 1fr 320px; } }
    .cart-items { display: flex; flex-direction: column; gap: 12px; }
    .cart-item { display: flex; align-items: center; gap: 12px; background: #ffffff; border-radius: 14px; padding: 14px 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.04); transition: box-shadow 0.2s; flex-wrap: wrap; }
    .cart-item:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
    .cart-item:hover .remove-btn { opacity: 1; }
    .item-info { flex: 1; min-width: 0; }
    .item-name { font-size: 15px; font-weight: 600; color: #1a202c; margin: 0 0 4px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .item-price-unit { font-size: 13px; color: #718096; }
    .item-actions { display: flex; align-items: center; gap: 12px; }
    .quantity-controls { display: flex; align-items: center; background: #f0faf4; border-radius: 24px; padding: 3px; border: 1.5px solid #d1ead9; }
    .qty-btn { width: 30px; height: 30px; border-radius: 50%; border: none; background: #ffffff; color: #2d8a4e; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.06); }
    .qty-btn:hover:not(:disabled) { background: #2d8a4e; color: #ffffff; }
    .qty-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .qty-value { min-width: 32px; text-align: center; font-size: 14px; font-weight: 700; color: #1a202c; }
    .remove-btn { width: 32px; height: 32px; border-radius: 8px; border: none; background: transparent; color: #a0aec0; display: flex; align-items: center; justify-content: center; cursor: pointer; opacity: 0; transition: all 0.2s; }
    @media (max-width: 767px) { .remove-btn { opacity: 1; } }
    .remove-btn:hover { background: #fff5f5; color: #e53e3e; }
    .item-total { font-size: 15px; font-weight: 700; color: #1a202c; min-width: 60px; text-align: right; }
    .order-summary { background: #ffffff; border-radius: 16px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.04); height: fit-content; position: sticky; top: 16px; }
    .summary-title { font-size: 17px; font-weight: 700; color: #1a202c; margin: 0 0 20px 0; }
    .summary-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; font-size: 14px; color: #4a5568; }
    .free-delivery { color: #38c172; font-weight: 600; }
    .summary-divider { height: 1px; background: #e2e8f0; margin: 16px 0; }
    .total-row { margin-bottom: 20px; font-size: 16px; font-weight: 700; color: #1a202c; }
    .total-amount { color: #2d8a4e; font-size: 20px; }
    .checkout-btn { width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px 20px; background: linear-gradient(135deg, #38c172 0%, #2d8a4e 100%); color: #ffffff; border: none; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 14px rgba(45,138,78,0.3); text-decoration: none; }
    .checkout-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(45,138,78,0.4); }
    .checkout-btn:active { transform: translateY(0); }
    .cart-warning { padding: 12px 16px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; color: #92400e; font-size: 0.85rem; margin-bottom: 12px; }
    .checkout-btn.disabled { pointer-events: none; opacity: 0.5; }
  `]
})
export class CartPage {
  cart = inject(CartService);
  settings = inject(SettingsService);

  isDeliveryFree = computed(() =>
    this.cart.cartTotal() >= this.settings.freeDeliveryAbove() || this.settings.deliveryCharge() === 0
  );

  deliveryDisplay = computed(() =>
    this.isDeliveryFree() ? 'Free' : this.settings.currencySymbol() + this.settings.deliveryCharge()
  );

  totalWithDelivery = computed(() =>
    this.isDeliveryFree() ? this.cart.cartTotal() : this.cart.cartTotal() + this.settings.deliveryCharge()
  );

  gstAmount = computed(() => this.cart.cartTotal() * 0.05);

  grandTotal = computed(() => {
    const delivery = this.isDeliveryFree() ? 0 : this.settings.deliveryCharge();
    return this.cart.cartTotal() + delivery + this.gstAmount();
  });

  canCheckout = computed(() => {
    if (!this.settings.acceptOrders()) return false;
    if (this.settings.minOrderAmount() > 0 && this.cart.cartTotal() < this.settings.minOrderAmount()) return false;
    return true;
  });

  showRemoveConfirm = signal(false);
  pendingRemoveName = signal('');
  private pendingRemoveId = '';

  confirmRemoveItem(productId: string, name: string) {
    this.pendingRemoveId = productId;
    this.pendingRemoveName.set(name);
    this.showRemoveConfirm.set(true);
  }

  doRemoveItem() {
    this.showRemoveConfirm.set(false);
    if (this.pendingRemoveId) {
      this.cart.removeItem(this.pendingRemoveId);
      this.pendingRemoveId = '';
      this.pendingRemoveName.set('');
    }
  }
}
