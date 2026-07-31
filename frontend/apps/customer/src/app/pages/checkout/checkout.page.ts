import { Component, inject, signal, computed, OnInit, effect } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { ApiService, AuthService } from '@frontend/shared-data-access';
import { CartService } from '../../services/cart.service';
import { SettingsService } from '../../services/settings.service';
import { AddressService, Address } from '../../services/address.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [RouterModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="checkout-container">
      <header class="checkout-header">
        <button class="back-btn" routerLink="/cart">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <h1>Checkout</h1>
      </header>

      <!-- 1. Order Items -->
      <section class="checkout-section">
        <div class="section-header">
          <span class="step-number">1</span>
          <h2>Order Items</h2>
        </div>
        <div class="items-list">
          @for (item of cart.items(); track item.productId) {
            <div class="item-row">
              <span class="item-name">{{ item.name }} <span class="item-qty">&times; {{ item.quantity }}</span></span>
              <span class="item-price">{{ settings.currencySymbol() }}{{ item.basePrice * item.quantity }}</span>
            </div>
          }
        </div>
        <div class="bill-summary">
          <div class="bill-title">Bill Summary</div>
          <div class="bill-row"><span>Items Subtotal</span><span>{{ settings.currencySymbol() }}{{ cart.cartTotal() }}</span></div>
          <div class="bill-row"><span>Delivery Fee</span><span class="free-tag">{{ deliveryDisplay() }}</span></div>
          @if (couponDiscount() > 0) {
            <div class="bill-row coupon-row"><span>Coupon Discount</span><span class="coupon-savings">-{{ settings.currencySymbol() }}{{ couponDiscount() }}</span></div>
          }
          <div class="bill-row"><span>GST (5%)</span><span>{{ settings.currencySymbol() }}{{ (cart.cartTotal() * 0.05).toFixed(2) }}</span></div>
          <div class="bill-row total-row"><span>Total Amount</span><span>{{ settings.currencySymbol() }}{{ totalAmount() }}</span></div>
        </div>
      </section>

      <!-- 2. Apply Coupon -->
      <section class="checkout-section">
        <div class="section-header">
          <span class="step-number">2</span>
          <h2>Apply Coupon</h2>
        </div>
        @if (couponApplied()) {
          <div class="coupon-applied-box">
            <div class="coupon-applied-left">
              <span class="coupon-tag">🏷️ {{ couponCode() }}</span>
              <span class="coupon-applied-text">{{ couponMessage() }}</span>
            </div>
            <button class="coupon-remove-btn" (click)="removeCoupon()">✕</button>
          </div>
        } @else {
          <div class="coupon-section">
            <div class="coupon-input-wrap">
              <span class="coupon-icon">🏷️</span>
              <input
                class="coupon-input"
                placeholder="Enter coupon code"
                [(ngModel)]="couponInputValue"
              />
            </div>
            <button
              class="coupon-btn"
              (click)="applyCoupon()"
              [disabled]="applyingCoupon() || !couponInputValue.trim()"
            >
              @if (applyingCoupon()) { <span class="spinner"></span> }
              @else { Apply }
            </button>
          </div>
          @if (couponError()) {
            <div class="coupon-error">⚠️ {{ couponError() }}</div>
          }
        }
      </section>

      <!-- 3. Delivery Address -->
      <section class="checkout-section">
        <div class="section-header">
          <span class="step-number">3</span>
          <h2>Delivery Address</h2>
        </div>

        @if (addresses().length > 0) {
          <div class="address-list">
            @for (addr of addresses(); track addr.id) {
              <div class="address-card" [class.selected]="selectedAddressId() === addr.id" (click)="selectAddress(addr.id)">
                <div class="address-top">
                  <div class="address-label">{{ addr.label }}</div>
                  <button class="addr-edit-btn" (click)="editAddress(addr, $event)" title="Edit">✎</button>
                </div>
                <div class="address-detail">{{ addr.line1 }}, {{ addr.city }}, {{ addr.state }} - {{ addr.pincode }}</div>
                @if (addr.phone) { <div class="address-phone">📞 {{ addr.phone }}</div> }
              </div>
            }
          </div>
        }

        @if (!showNewAddress() && addresses().length > 0) {
          <button class="add-address-btn" (click)="showNewAddress.set(true)">+ Add New Address</button>
        }

        @if (showNewAddress() || editingAddressId() || addresses().length === 0) {
          <form class="address-form" [formGroup]="addressForm" (ngSubmit)="saveOrUpdateAddress()">
            <div class="form-grid">
              <div class="form-group"><label>Label</label><input formControlName="label" placeholder="Home, Office..."></div>
              <div class="form-group"><label>Phone</label><input formControlName="phone" placeholder="Delivery phone"></div>
              <div class="form-group full-width"><label>Address</label><input formControlName="line1" placeholder="House/flat, street, area"></div>
              <div class="form-group"><label>City</label><input formControlName="city" placeholder="City"></div>
              <div class="form-group"><label>State</label><input formControlName="state" placeholder="State"></div>
              <div class="form-group"><label>Pincode</label><input formControlName="pincode" placeholder="Pincode"></div>
            </div>
            <div class="form-actions">
              @if (addresses().length > 0) {
                <button type="button" class="cancel-btn" (click)="cancelEdit()">Cancel</button>
              }
              <button type="submit" class="save-btn" [disabled]="addressForm.invalid">{{ editingAddressId() ? 'Update Address' : 'Save Address' }}</button>
            </div>
          </form>
        }
      </section>

      <!-- 4. Payment -->
      <section class="checkout-section">
        <div class="section-header">
          <span class="step-number">4</span>
          <h2>Payment</h2>
        </div>
        <div class="payment-options">
          @for (method of paymentMethods; track method.value) {
            <label class="payment-option" [class.selected]="selectedPayment() === method.value">
              <div class="custom-radio" [class.active]="selectedPayment() === method.value"><div class="radio-dot"></div></div>
              <input type="radio" name="payment" [value]="method.value" [checked]="selectedPayment() === method.value" (change)="selectedPayment.set(method.value)" class="sr-only">
              <span class="payment-icon">{{ method.icon }}</span>
              <span>{{ method.label }}</span>
            </label>
          }
        </div>
      </section>

      <!-- 5. Notes -->
      <section class="checkout-section">
        <div class="section-header">
          <span class="step-number">5</span>
          <h2>Notes (Optional)</h2>
        </div>
        <textarea class="notes-input" placeholder="Any special instructions..." [value]="notes()" (input)="notes.set($any($event.target).value)" rows="3"></textarea>
      </section>

      @if (!isAddressServiceable()) {
        <div class="serviceability-warning">
          <span class="warning-icon">⚠️</span>
          <span>Sorry, we don't deliver to this pincode yet. Please select a different address or add one with a serviceable pincode.</span>
        </div>
      }

      @if (error()) { <div class="error-banner">{{ error() }}</div> }

      <div class="order-btn-spacer"></div>
      <button class="place-order-btn" (click)="placeOrder()" [disabled]="placing() || !selectedAddressId() || !isAddressServiceable()">
        @if (placing()) { <span class="spinner"></span> Placing... }
        @else { Place Order &rarr; <span class="price-pill">{{ settings.currencySymbol() }}{{ totalAmount() }}</span> }
      </button>
    </div>
  `,
  styles: [`
    .checkout-container { max-width: 600px; margin: 0 auto; padding: 16px; padding-bottom: calc(var(--bottom-nav-height, 64px) + 90px); }
    .checkout-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
    .checkout-header h1 { font-size: 1.5rem; font-weight: 700; color: #1a1a1a; margin: 0; }
    .back-btn { width: 36px; height: 36px; border-radius: 50%; border: 1px solid #e5e7eb; background: white; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #374151; }
    .back-btn:hover { background: #f3f4f6; }
    .checkout-section { background: white; border-radius: 16px; padding: 20px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); border: 1px solid #f0f0f0; }
    .section-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .step-number { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #22c55e, #16a34a); color: white; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700; }
    .section-header h2 { font-size: 1.05rem; font-weight: 600; color: #1a1a1a; margin: 0; }
    .items-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
    .item-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: #f9fafb; border-radius: 10px; }
    .item-name { font-size: 0.9rem; color: #374151; font-weight: 500; }
    .item-qty { color: #6b7280; font-weight: 400; }
    .item-price { font-size: 0.9rem; font-weight: 600; color: #1a1a1a; }
    .bill-summary { border-top: 1px dashed #e5e7eb; padding-top: 14px; margin-top: 8px; }
    .bill-title { font-size: 0.85rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
    .bill-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 0.9rem; color: #4b5563; }
    .free-tag { color: #22c55e; font-weight: 600; }
    .total-row { border-top: 1px solid #e5e7eb; margin-top: 8px; padding-top: 12px; font-size: 1.1rem; font-weight: 700; color: #1a1a1a; }
    .coupon-section { display: flex; gap: 10px; }
    .coupon-input-wrap { flex: 1; display: flex; align-items: center; gap: 8px; padding: 0 14px; border: 1.5px dashed #d1d5db; border-radius: 10px; background: #f9fafb; transition: border-color 0.2s; }
    .coupon-input-wrap:focus-within { border-color: #22c55e; background: #fff; }
    .coupon-icon { font-size: 1.1rem; }
    .coupon-input { flex: 1; padding: 12px 0; border: none; background: transparent; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; font-weight: 500; outline: none; }
    .coupon-input::placeholder { text-transform: none; letter-spacing: 0; font-weight: 400; color: #9ca3af; }
    .coupon-btn { padding: 12px 22px; border: none; border-radius: 10px; background: linear-gradient(135deg, #22c55e, #16a34a); color: white; font-weight: 600; cursor: pointer; font-size: 0.9rem; white-space: nowrap; transition: all 0.2s; }
    .coupon-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    .coupon-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(34,197,94,0.3); }
    .coupon-applied-box { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 1.5px solid #86efac; border-radius: 12px; }
    .coupon-applied-left { display: flex; flex-direction: column; gap: 4px; }
    .coupon-tag { font-size: 0.8rem; font-weight: 700; color: #166534; letter-spacing: 0.5px; }
    .coupon-applied-text { font-size: 0.85rem; color: #15803d; font-weight: 500; }
    .coupon-remove-btn { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; background: rgba(220,38,38,0.08); border: none; border-radius: 50%; color: #dc2626; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; }
    .coupon-remove-btn:hover { background: rgba(220,38,38,0.15); transform: scale(1.1); }
    .coupon-error { padding: 10px 14px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; color: #dc2626; font-size: 0.85rem; margin-top: 10px; }
    .coupon-savings { color: #22c55e; font-weight: 600; }
    .coupon-row { color: #22c55e; }
    .address-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px; }
    .address-card { padding: 14px 16px; border-radius: 12px; border: 1px solid #e5e7eb; cursor: pointer; transition: all 0.2s; border-left: 4px solid transparent; }
    .address-card:hover { background: #f0fdf4; }
    .address-card.selected { border-left-color: #22c55e; background: #f0fdf4; border-color: #bbf7d0; }
    .address-top { display: flex; justify-content: space-between; align-items: center; }
    .address-label { font-weight: 600; color: #1a1a1a; font-size: 0.9rem; }
    .addr-edit-btn { background: none; border: none; color: #9ca3af; cursor: pointer; font-size: 14px; padding: 2px 6px; border-radius: 4px; }
    .addr-edit-btn:hover { color: #16a34a; background: #f0fdf4; }
    .address-detail { font-size: 0.85rem; color: #6b7280; margin-top: 4px; }
    .address-phone { font-size: 0.8rem; color: #6b7280; margin-top: 4px; }
    .add-address-btn { display: flex; align-items: center; gap: 8px; padding: 10px 16px; border: 1px dashed #d1d5db; border-radius: 10px; background: transparent; color: #22c55e; font-weight: 500; font-size: 0.9rem; cursor: pointer; width: 100%; justify-content: center; }
    .add-address-btn:hover { background: #f0fdf4; border-color: #22c55e; }
    .address-form { margin-top: 12px; padding: 16px; background: #f9fafb; border-radius: 12px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .form-group { display: flex; flex-direction: column; gap: 4px; }
    .form-group.full-width { grid-column: span 2; }
    .form-group label { font-size: 0.8rem; font-weight: 500; color: #6b7280; }
    .form-group input { padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 0.9rem; outline: none; }
    .form-group input:focus { border-color: #22c55e; box-shadow: 0 0 0 3px rgba(34,197,94,0.1); }
    .form-actions { display: flex; gap: 10px; margin-top: 14px; justify-content: flex-end; }
    .cancel-btn { padding: 8px 16px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; color: #6b7280; font-size: 0.85rem; cursor: pointer; }
    .save-btn { padding: 8px 16px; border: none; border-radius: 8px; background: linear-gradient(135deg, #22c55e, #16a34a); color: white; font-size: 0.85rem; cursor: pointer; font-weight: 500; }
    .save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .payment-options { display: flex; flex-direction: column; gap: 10px; }
    .payment-option { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 12px; border: 1px solid #e5e7eb; cursor: pointer; transition: all 0.2s; }
    .payment-option:hover { background: #f9fafb; }
    .payment-option.selected { border-color: #22c55e; background: #f0fdf4; }
    .custom-radio { width: 20px; height: 20px; border-radius: 50%; border: 2px solid #d1d5db; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .custom-radio.active { border-color: #22c55e; }
    .custom-radio .radio-dot { width: 10px; height: 10px; border-radius: 50%; background: transparent; }
    .custom-radio.active .radio-dot { background: #22c55e; }
    .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }
    .payment-icon { font-size: 1.2rem; }
    .notes-input { width: 100%; padding: 12px 14px; border: 1px solid #e5e7eb; border-radius: 10px; font-size: 0.9rem; resize: vertical; outline: none; font-family: inherit; box-sizing: border-box; }
    .notes-input:focus { border-color: #22c55e; box-shadow: 0 0 0 3px rgba(34,197,94,0.1); }
    .error-banner { padding: 12px 16px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; color: #dc2626; font-size: 0.85rem; margin-bottom: 16px; }
    .serviceability-warning { display: flex; align-items: flex-start; gap: 10px; padding: 14px 16px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; color: #92400e; font-size: 0.85rem; margin-bottom: 16px; line-height: 1.4; }
    .warning-icon { font-size: 1.1rem; flex-shrink: 0; }
    .order-btn-spacer { height: 20px; }
    .place-order-btn { position: fixed; bottom: calc(var(--bottom-nav-height, 64px) + 12px); left: 16px; right: 16px; max-width: 568px; margin: 0 auto; padding: 16px 24px; background: linear-gradient(135deg, #22c55e, #16a34a); color: white; border: none; border-radius: 14px; font-size: 1.05rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 12px; box-shadow: 0 4px 20px rgba(34,197,94,0.35); z-index: 90; }
    .place-order-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(34,197,94,0.45); }
    .place-order-btn:disabled { opacity: 0.6; cursor: not-allowed; background: #9ca3af; box-shadow: none; }
    .price-pill { background: rgba(255,255,255,0.25); padding: 4px 12px; border-radius: 20px; font-size: 0.9rem; font-weight: 700; }
    .spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class CheckoutPage implements OnInit {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private addressService = inject(AddressService);
  cart = inject(CartService);
  settings = inject(SettingsService);

  private readonly ADDRESSES_LOADED = signal(false);

  // Coupon signals
  couponCode = signal<string>('');
  couponInputValue = '';
  couponDiscount = signal<number>(0);
  couponMessage = signal<string>('');
  couponError = signal<string>('');
  applyingCoupon = signal<boolean>(false);
  couponApplied = signal<boolean>(false);

  isDeliveryFree = computed(() =>
    this.cart.cartTotal() >= this.settings.freeDeliveryAbove() || this.settings.deliveryCharge() === 0
  );

  deliveryDisplay = computed(() =>
    this.isDeliveryFree() ? 'FREE' : this.settings.currencySymbol() + this.settings.deliveryCharge()
  );

  totalAmount = computed(() => {
    const subtotal = this.cart.cartTotal();
    const delivery = this.isDeliveryFree() ? 0 : this.settings.deliveryCharge();
    const discount = this.couponDiscount();
    const gst = subtotal * 0.05;
    return Math.round(subtotal + delivery - discount + gst);
  });

  addresses = this.addressService.addresses;
  selectedAddressId = signal<string>('');
  selectedPayment = signal<string>('cod');
  notes = signal<string>('');
  showNewAddress = signal<boolean>(false);
  editingAddressId = signal<string>('');
  placing = signal<boolean>(false);
  error = signal<string>('');

  // Serviceability check
  isAddressServiceable = computed(() => {
    const pincodes = this.settings.serviceablePincodes();
    if (pincodes.length === 0) return true; // no restriction if list is empty
    const selected = this.addresses().find(a => a.id === this.selectedAddressId());
    if (!selected) return true; // no address selected yet
    return pincodes.includes(selected.pincode);
  });

  paymentMethods = [
    { value: 'cod', label: 'Cash on Delivery', icon: '💵' },
  ];

  addressForm = this.fb.nonNullable.group({
    label: ['', Validators.required],
    line1: ['', Validators.required],
    city: ['', Validators.required],
    state: ['', Validators.required],
    pincode: ['', Validators.required],
    phone: ['']
  });

  // Effect to clear coupon if cart changes after coupon is applied
  private lastCartSnapshot = '';
  private cartChangeEffect = effect(() => {
    const items = this.cart.items();
    const snapshot = JSON.stringify(items.map(i => i.productId + ':' + i.quantity));
    if (this.lastCartSnapshot && this.lastCartSnapshot !== snapshot && this.couponApplied()) {
      this.removeCoupon();
    }
    this.lastCartSnapshot = snapshot;
  }, { allowSignalWrites: true });

  ngOnInit() {
    this.loadAddresses();
    this.validateCartItems();
  }

  applyCoupon() {
    const code = this.couponInputValue.trim().toUpperCase();
    if (!code) return;

    this.applyingCoupon.set(true);
    this.couponError.set('');
    this.couponMessage.set('');

    const body = {
      code,
      cartSubtotal: this.cart.cartTotal(),
      cartItems: this.cart.items().map(i => ({
        product: i.productId,
        quantity: i.quantity,
        price: i.basePrice,
        total: i.basePrice * i.quantity,
      }))
    };

    this.api.post<any>('/coupons/validate', body).subscribe({
      next: (res) => {
        this.applyingCoupon.set(false);
        if (res.success && res.data?.valid) {
          const coupon = res.data.coupon;
          const discount = coupon.discount || 0;
          this.couponCode.set(coupon.code);
          this.couponDiscount.set(discount);
          this.couponApplied.set(true);
          this.couponError.set('');

          let msg = `${coupon.title || coupon.code}`;
          if (coupon.type === 'percentage' && coupon.discountPercent) {
            msg += ` — ${coupon.discountPercent}% off`;
          } else if (coupon.type === 'flat' && coupon.flatAmount) {
            msg += ` — ₹${coupon.flatAmount} off`;
          } else if (coupon.type === 'free_delivery') {
            msg += ` — Free delivery`;
          }
          msg += ` • You save ${this.settings.currencySymbol()}${discount}`;
          this.couponMessage.set(msg);
        } else if (res.success && res.data && !res.data.valid) {
          this.couponError.set(res.data.reason || 'Coupon is not valid');
          this.couponDiscount.set(0);
          this.couponApplied.set(false);
        } else {
          this.couponError.set(res.message || 'Could not apply coupon');
          this.couponDiscount.set(0);
          this.couponApplied.set(false);
        }
      },
      error: (err) => {
        this.applyingCoupon.set(false);
        this.couponError.set(err?.error?.message || 'Failed to validate coupon. Please try again.');
        this.couponDiscount.set(0);
        this.couponApplied.set(false);
      }
    });
  }

  removeCoupon() {
    this.couponCode.set('');
    this.couponInputValue = '';
    this.couponDiscount.set(0);
    this.couponMessage.set('');
    this.couponError.set('');
    this.couponApplied.set(false);
  }

  private validateCartItems() {
    const items = this.cart.items();
    if (items.length === 0) return;

    const invalidItems: string[] = [];
    let checked = 0;

    for (const item of items) {
      this.api.get<any>(`/catalog/products/${item.productId}`).subscribe({
        next: (res) => {
          checked++;
          if (!res.success || !res.data) {
            invalidItems.push(item.name);
            this.cart.removeItem(item.productId);
          }
          if (checked === items.length && invalidItems.length > 0) {
            this.error.set(
              `Some items are no longer available and were removed from your cart: ${invalidItems.join(', ')}. Please go back and add items again.`
            );
          }
        },
        error: () => {
          checked++;
          invalidItems.push(item.name);
          this.cart.removeItem(item.productId);
          if (checked === items.length && invalidItems.length > 0) {
            this.error.set(
              `Some items are no longer available and were removed from your cart: ${invalidItems.join(', ')}. Please go back and add items again.`
            );
          }
        }
      });
    }
  }

  private async loadAddresses() {
    await this.addressService.loadAddresses();
    const addrs = this.addressService.addresses();
    if (addrs.length > 0) {
      const defaultAddr = addrs.find(a => a.isDefault);
      this.selectedAddressId.set(defaultAddr?.id || addrs[0].id);
    }
  }

  selectAddress(id: string) {
    this.selectedAddressId.set(id);
  }

  editAddress(addr: Address, event: Event) {
    event.stopPropagation();
    this.editingAddressId.set(addr.id);
    this.showNewAddress.set(false);
    this.addressForm.patchValue({
      label: addr.label || '',
      line1: addr.line1,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      phone: addr.phone || '',
    });
  }

  cancelEdit() {
    this.editingAddressId.set('');
    this.showNewAddress.set(false);
    this.addressForm.reset();
  }

  async saveOrUpdateAddress() {
    if (this.addressForm.invalid) return;
    const formVal = this.addressForm.getRawValue();
    const data = {
      label: formVal.label || undefined,
      line1: formVal.line1,
      city: formVal.city,
      state: formVal.state,
      pincode: formVal.pincode,
      phone: formVal.phone || undefined,
    };

    try {
      if (this.editingAddressId()) {
        // Update existing
        const updated = await this.addressService.updateAddress(this.editingAddressId(), data);
        if (updated) {
          this.editingAddressId.set('');
          this.addressForm.reset();
          this.error.set('');
        }
      } else {
        // Create new
        const addr = await this.addressService.saveAddress(data);
        if (addr) {
          this.selectedAddressId.set(addr.id);
          this.showNewAddress.set(false);
          this.addressForm.reset();
          this.error.set('');
        }
      }
    } catch (err: any) {
      this.error.set(err?.error?.message || 'Failed to save address');
    }
  }

  async deleteAddress(id: string, event: Event) {
    event.stopPropagation();
    await this.addressService.deleteAddress(id);
    if (this.selectedAddressId() === id) {
      const remaining = this.addresses();
      this.selectedAddressId.set(remaining.length > 0 ? remaining[0].id : '');
    }
  }

  placeOrder() {
    const user = this.auth.user();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    const selectedAddr = this.addresses().find(a => a.id === this.selectedAddressId());
    if (!selectedAddr) {
      this.error.set('Please select or add a delivery address');
      return;
    }

    if (this.cart.items().length === 0) {
      this.error.set('Your cart is empty. Please add items before placing an order.');
      return;
    }

    this.placing.set(true);
    this.error.set('');

    const order: any = {
      customer: user.id,
      deliveryAddress: {
        label: selectedAddr.label,
        line1: selectedAddr.line1,
        city: selectedAddr.city,
        state: selectedAddr.state,
        pincode: selectedAddr.pincode,
        phone: selectedAddr.phone || user.phone,
      },
      items: this.cart.items().map(item => ({
        product: item.productId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.basePrice,
      })),
      paymentMethod: this.selectedPayment(),
      notes: this.notes() || undefined,
    };

    if (this.couponCode()) {
      order.couponCode = this.couponCode();
    }

    this.api.post<any>('/orders', order).subscribe({
      next: (res) => {
        this.placing.set(false);
        if (res.success && res.data) {
          this.cart.clearCart();
          const orderData = res.data.order || res.data;
          const orderId = orderData.id || orderData._id;
          this.router.navigate(['/orders', orderId]);
        } else {
          this.error.set(res.message || 'Failed to place order.');
        }
      },
      error: (err) => {
        this.placing.set(false);
        const msg = err?.error?.message || 'Failed to place order. Please try again.';
        if (msg.includes('Product') && msg.includes('not found')) {
          this.error.set('Some products in your cart are no longer available. Please clear your cart and add items again.');
          this.cart.clearCart();
        } else {
          this.error.set(msg);
        }
      }
    });
  }
}
