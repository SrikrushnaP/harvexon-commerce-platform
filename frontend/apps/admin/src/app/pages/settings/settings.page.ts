import { Component, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ApiService, AuthService } from '@frontend/shared-data-access';
import { DecimalPipe } from '@angular/common';

interface PricingRule {
  id: string;
  product: { id: string; name: string } | null;
  type: 'base' | 'group' | 'customer' | 'quantity_slab';
  group?: { name: string } | null;
  customer?: { name: string } | null;
  price: number;
  minQuantity: number;
  maxQuantity?: number;
  discountPercent?: number;
  priority: number;
  startDate?: string;
  endDate?: string;
  notes?: string;
}

interface ProductOption {
  id: string;
  name: string;
}

interface GroupOption {
  id: string;
  name: string;
}

interface CustomerOption {
  id: string;
  name: string;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe],
  template: `
    <div class="page-header">
      <div>
        <h1>Settings</h1>
        <p class="subtitle">Business profile, pricing rules, and configuration</p>
      </div>
      @if (settingsDirty()) {
        <button (click)="saveSettings()" class="btn btn-primary" [disabled]="saving()">
          {{ saving() ? 'Saving...' : '💾 Save Changes' }}
        </button>
      }
    </div>

    @if (successMsg()) {
      <div class="alert alert-success">{{ successMsg() }}</div>
    }
    @if (errorMsg()) {
      <div class="alert alert-error">{{ errorMsg() }}</div>
    }

    <div class="tabs">
      <button class="tab" [class.active]="activeTab() === 'general'" (click)="activeTab.set('general')">General</button>
      <button class="tab" [class.active]="activeTab() === 'orders'" (click)="activeTab.set('orders')">Order Settings</button>
      <button class="tab" [class.active]="activeTab() === 'invoice'" (click)="activeTab.set('invoice')">Invoice</button>
      <button class="tab" [class.active]="activeTab() === 'pricing'" (click)="activeTab.set('pricing'); loadPricingRules()">Pricing Rules</button>
      <button class="tab" [class.active]="activeTab() === 'notifications'" (click)="activeTab.set('notifications')">Notifications</button>
      <button class="tab" [class.active]="activeTab() === 'account'" (click)="activeTab.set('account')">Account</button>
    </div>

    @if (loading()) {
      <div class="loading">Loading settings...</div>
    } @else {

      <!-- GENERAL TAB -->
      @if (activeTab() === 'general') {
        <div class="card">
          <h2>Business Information</h2>
          <form [formGroup]="generalForm" (change)="markDirty()">
            <div class="form-grid">
              <div class="form-group">
                <label for="businessName">Business Name</label>
                <input id="businessName" formControlName="businessName" placeholder="Your business name" />
              </div>
              <div class="form-group">
                <label for="tagline">Tagline</label>
                <input id="tagline" formControlName="tagline" placeholder="Short description" />
              </div>
              <div class="form-group">
                <label for="logo">Logo URL</label>
                <input id="logo" formControlName="logo" placeholder="https://..." />
              </div>
              <div class="form-group">
                <label for="favicon">Favicon URL</label>
                <input id="favicon" formControlName="favicon" placeholder="https://..." />
              </div>
            </div>
          </form>
        </div>

        <div class="card">
          <h2>Contact Details</h2>
          <form [formGroup]="contactForm" (change)="markDirty()">
            <div class="form-grid">
              <div class="form-group">
                <label for="phone">Phone</label>
                <input id="phone" formControlName="phone" placeholder="+91 98765 43210" />
              </div>
              <div class="form-group">
                <label for="email">Email</label>
                <input id="email" formControlName="email" type="email" placeholder="info@business.com" />
              </div>
              <div class="form-group full-width">
                <label for="address">Address</label>
                <input id="address" formControlName="address" placeholder="Street address" />
              </div>
              <div class="form-group">
                <label for="city">City</label>
                <input id="city" formControlName="city" placeholder="City" />
              </div>
              <div class="form-group">
                <label for="state">State</label>
                <input id="state" formControlName="state" placeholder="State" />
              </div>
              <div class="form-group">
                <label for="pincode">Pincode</label>
                <input id="pincode" formControlName="pincode" placeholder="560001" />
              </div>
              <div class="form-group">
                <label for="country">Country</label>
                <input id="country" formControlName="country" placeholder="India" />
              </div>
            </div>
          </form>
        </div>

        <div class="card">
          <h2>Regional Settings</h2>
          <form [formGroup]="regionalForm" (change)="markDirty()">
            <div class="form-grid">
              <div class="form-group">
                <label for="currency">Currency</label>
                <input id="currency" formControlName="currency" placeholder="INR" />
              </div>
              <div class="form-group">
                <label for="currencySymbol">Currency Symbol</label>
                <input id="currencySymbol" formControlName="currencySymbol" placeholder="₹" />
              </div>
              <div class="form-group">
                <label for="timezone">Timezone</label>
                <input id="timezone" formControlName="timezone" placeholder="Asia/Kolkata" />
              </div>
              <div class="form-group">
                <label for="language">Language</label>
                <input id="language" formControlName="language" placeholder="en" />
              </div>
            </div>
          </form>
        </div>
      }

      <!-- ORDER SETTINGS TAB -->
      @if (activeTab() === 'orders') {
        <div class="card">
          <h2>Order Configuration</h2>
          <form [formGroup]="orderForm" (change)="markDirty()">
            <div class="form-grid">
              <div class="form-group">
                <label for="minOrderAmount">Min Order Amount (₹)</label>
                <input id="minOrderAmount" formControlName="minOrderAmount" type="number" min="0" />
              </div>
              <div class="form-group">
                <label for="deliveryCharge">Delivery Charge (₹)</label>
                <input id="deliveryCharge" formControlName="deliveryCharge" type="number" min="0" />
              </div>
              <div class="form-group">
                <label for="freeDeliveryAbove">Free Delivery Above (₹)</label>
                <input id="freeDeliveryAbove" formControlName="freeDeliveryAbove" type="number" min="0" />
              </div>
              <div class="form-group">
                <label for="orderCutoffTime">Order Cutoff Time</label>
                <input id="orderCutoffTime" formControlName="orderCutoffTime" type="time" />
              </div>
              <div class="form-group full-width">
                <label class="toggle-label">
                  <input type="checkbox" formControlName="acceptOrders" />
                  <span class="toggle-text">Accept Orders</span>
                  <span class="toggle-hint">When disabled, customers cannot place new orders</span>
                </label>
              </div>
            </div>
          </form>
        </div>
      }

      <!-- INVOICE TAB -->
      @if (activeTab() === 'invoice') {
        <div class="card">
          <h2>Invoice Settings</h2>
          <form [formGroup]="invoiceForm" (change)="markDirty()">
            <div class="form-grid">
              <div class="form-group">
                <label for="invoicePrefix">Invoice Prefix</label>
                <input id="invoicePrefix" formControlName="invoicePrefix" placeholder="INV-" />
              </div>
              <div class="form-group">
                <label for="invoiceStartNumber">Start Number</label>
                <input id="invoiceStartNumber" formControlName="invoiceStartNumber" type="number" min="1" />
              </div>
              <div class="form-group">
                <label for="gstNumber">GST Number</label>
                <input id="gstNumber" formControlName="gstNumber" placeholder="29ABCDE1234F1Z5" />
              </div>
              <div class="form-group">
                <label for="panNumber">PAN Number</label>
                <input id="panNumber" formControlName="panNumber" placeholder="ABCDE1234F" />
              </div>
            </div>
          </form>
        </div>
      }

      <!-- PRICING RULES TAB -->
      @if (activeTab() === 'pricing') {
        <div class="card">
          <div class="card-header-row">
            <h2>Pricing Rules</h2>
            <button (click)="openRuleForm()" class="btn btn-primary btn-sm">+ Add Rule</button>
          </div>

          @if (showRuleForm()) {
            <div class="rule-form">
              <h3>{{ editingRuleId() ? 'Edit Rule' : 'New Pricing Rule' }}</h3>
              <form [formGroup]="ruleForm" (ngSubmit)="submitRule()">
                <div class="form-grid">
                  <div class="form-group">
                    <label for="ruleProduct">Product *</label>
                    <select id="ruleProduct" formControlName="product">
                      <option value="">Select product</option>
                      @for (p of products(); track $index) {
                        <option [value]="p.id">{{ p.name }}</option>
                      }
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="ruleType">Type *</label>
                    <select id="ruleType" formControlName="type">
                      <option value="">Select type</option>
                      <option value="base">Base</option>
                      <option value="group">Group</option>
                      <option value="customer">Customer</option>
                      <option value="quantity_slab">Quantity Slab</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="rulePrice">Price (₹) *</label>
                    <input id="rulePrice" formControlName="price" type="number" min="0" step="0.01" />
                  </div>
                  <div class="form-group">
                    <label for="rulePriority">Priority</label>
                    <input id="rulePriority" formControlName="priority" type="number" min="0" />
                  </div>
                  @if (ruleForm.get('type')?.value === 'group') {
                    <div class="form-group">
                      <label for="ruleGroup">Group</label>
                      <select id="ruleGroup" formControlName="group">
                        <option value="">Select group</option>
                        @for (g of groups(); track $index) {
                          <option [value]="g.id">{{ g.name }}</option>
                        }
                      </select>
                    </div>
                  }
                  @if (ruleForm.get('type')?.value === 'customer') {
                    <div class="form-group">
                      <label for="ruleCustomer">Customer</label>
                      <select id="ruleCustomer" formControlName="customer">
                        <option value="">Select customer</option>
                        @for (c of customers(); track $index) {
                          <option [value]="c.id">{{ c.name }}</option>
                        }
                      </select>
                    </div>
                  }
                  <div class="form-group">
                    <label for="ruleMinQty">Min Quantity</label>
                    <input id="ruleMinQty" formControlName="minQuantity" type="number" min="1" />
                  </div>
                  <div class="form-group">
                    <label for="ruleMaxQty">Max Quantity</label>
                    <input id="ruleMaxQty" formControlName="maxQuantity" type="number" min="1" />
                  </div>
                  <div class="form-group">
                    <label for="ruleDiscount">Discount %</label>
                    <input id="ruleDiscount" formControlName="discountPercent" type="number" min="0" max="100" />
                  </div>
                  <div class="form-group">
                    <label for="ruleStart">Start Date</label>
                    <input id="ruleStart" formControlName="startDate" type="date" />
                  </div>
                  <div class="form-group">
                    <label for="ruleEnd">End Date</label>
                    <input id="ruleEnd" formControlName="endDate" type="date" />
                  </div>
                  <div class="form-group full-width">
                    <label for="ruleNotes">Notes</label>
                    <input id="ruleNotes" formControlName="notes" placeholder="Optional notes" />
                  </div>
                </div>
                @if (ruleError()) {
                  <div class="server-error">{{ ruleError() }}</div>
                }
                <div class="form-actions">
                  <button type="button" (click)="closeRuleForm()" class="btn btn-secondary">Cancel</button>
                  <button type="submit" class="btn btn-primary" [disabled]="savingRule()">
                    {{ savingRule() ? 'Saving...' : (editingRuleId() ? 'Update Rule' : 'Create Rule') }}
                  </button>
                </div>
              </form>
            </div>
          }

          @if (loadingRules()) {
            <div class="loading">Loading pricing rules...</div>
          } @else {
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Type</th>
                    <th>Group/Customer</th>
                    <th>Price</th>
                    <th>Qty Range</th>
                    <th>Discount</th>
                    <th>Priority</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (rule of pricingRules(); track $index) {
                    <tr>
                      <td>{{ rule.product?.name || '—' }}</td>
                      <td><span class="type-badge" [attr.data-type]="rule.type">{{ rule.type }}</span></td>
                      <td>{{ rule.group?.name || rule.customer?.name || '—' }}</td>
                      <td>₹{{ rule.price | number:'1.2-2' }}</td>
                      <td>{{ rule.minQuantity }}{{ rule.maxQuantity ? ' – ' + rule.maxQuantity : '+' }}</td>
                      <td>{{ rule.discountPercent ? rule.discountPercent + '%' : '—' }}</td>
                      <td>{{ rule.priority }}</td>
                      <td class="actions-cell">
                        <button (click)="editRule(rule)" class="action-btn" title="Edit">✏️</button>
                        <button (click)="deleteRule(rule)" class="action-btn delete" title="Delete">🗑️</button>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="8" class="empty">No pricing rules configured</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }

      <!-- NOTIFICATIONS TAB -->
      @if (activeTab() === 'notifications') {
        <div class="card">
          <h2>Notification Channels</h2>
          <form [formGroup]="notificationsForm" (change)="markDirty()">
            <div class="toggle-list">
              <label class="toggle-label">
                <input type="checkbox" formControlName="smsEnabled" />
                <span class="toggle-text">SMS Notifications</span>
                <span class="toggle-hint">Send order updates via SMS</span>
              </label>
              <label class="toggle-label">
                <input type="checkbox" formControlName="whatsappEnabled" />
                <span class="toggle-text">WhatsApp Notifications</span>
                <span class="toggle-hint">Send order updates via WhatsApp</span>
              </label>
              <label class="toggle-label">
                <input type="checkbox" formControlName="emailEnabled" />
                <span class="toggle-text">Email Notifications</span>
                <span class="toggle-hint">Send order confirmations and invoices via email</span>
              </label>
            </div>
          </form>
        </div>
      }

      <!-- ACCOUNT TAB -->
      @if (activeTab() === 'account') {
        <div class="card">
          <h2>Logged In As</h2>
          <div class="account-info">
            <div class="account-avatar">
              {{ auth.user()?.name?.charAt(0)?.toUpperCase() || 'A' }}
            </div>
            <div class="account-details">
              <p class="account-name">{{ auth.user()?.name || 'Admin' }}</p>
              <p class="account-email">{{ auth.user()?.email || '' }}</p>
              <span class="account-role">{{ auth.user()?.role || 'admin' }}</span>
            </div>
          </div>
        </div>

        <div class="card danger-zone">
          <h2>Session</h2>
          <p class="danger-text">Logging out will clear your session. You will need to sign in again.</p>
          <button (click)="handleLogout()" class="btn btn-danger">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </button>
        </div>
      }

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
    .btn-sm { padding: 0.4rem 0.8rem; font-size: 0.8rem; }
    .alert { padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.875rem; }
    .alert-success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #16a34a; }
    .alert-error { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; }
    .tabs { display: flex; gap: 0; margin-bottom: 1.5rem; border-bottom: 2px solid #e2e8f0; }
    .tab {
      padding: 0.75rem 1.25rem; font-size: 0.875rem; font-weight: 500; cursor: pointer;
      background: none; border: none; color: #64748b; border-bottom: 2px solid transparent; margin-bottom: -2px;
      &:hover { color: #334155; }
      &.active { color: #3b82f6; border-bottom-color: #3b82f6; }
    }
    .card {
      background: #fff; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06); border: 1px solid #f1f5f9;
      h2 { margin: 0 0 1.25rem; font-size: 1rem; color: #334155; }
    }
    .card-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; h2 { margin: 0; } }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.3rem; }
    .form-group.full-width { grid-column: 1 / -1; }
    label { font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; }
    input, select, textarea {
      padding: 0.5rem 0.75rem; border: 1px solid #e2e8f0; border-radius: 8px;
      font-size: 0.875rem; outline: none; font-family: inherit;
      &:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
    }
    input[type="checkbox"] { width: auto; margin-right: 0.5rem; }
    .toggle-label { display: flex; align-items: center; flex-wrap: wrap; gap: 0.25rem; cursor: pointer; padding: 0.75rem 0; border-bottom: 1px solid #f1f5f9; }
    .toggle-label:last-child { border-bottom: none; }
    .toggle-text { font-size: 0.875rem; font-weight: 500; color: #334155; text-transform: none; }
    .toggle-hint { width: 100%; font-size: 0.75rem; color: #94a3b8; margin-left: 1.5rem; text-transform: none; font-weight: 400; }
    .toggle-list { display: flex; flex-direction: column; }
    .rule-form {
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.25rem; margin-bottom: 1.25rem;
      h3 { margin: 0 0 1rem; font-size: 0.9rem; color: #334155; }
    }
    .form-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem; }
    .server-error { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 0.5rem 0.75rem; border-radius: 8px; margin-bottom: 0.75rem; font-size: 0.85rem; }
    .loading { color: #64748b; padding: 3rem; text-align: center; }
    .table-wrap { overflow-x: auto; margin-top: 1rem; }
    table { width: 100%; border-collapse: collapse; }
    th {
      text-align: left; padding: 0.75rem 0.75rem; font-size: 0.7rem; font-weight: 600;
      text-transform: uppercase; color: #64748b; background: #f8fafc; border-bottom: 1px solid #e2e8f0;
    }
    td { padding: 0.65rem 0.75rem; border-bottom: 1px solid #f1f5f9; font-size: 0.85rem; color: #334155; }
    .type-badge {
      padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: 500; text-transform: capitalize;
      background: #f1f5f9; color: #475569;
      &[data-type="base"] { background: #dbeafe; color: #1d4ed8; }
      &[data-type="group"] { background: #dcfce7; color: #16a34a; }
      &[data-type="customer"] { background: #fef3c7; color: #d97706; }
      &[data-type="quantity_slab"] { background: #ede9fe; color: #6d28d9; }
    }
    .actions-cell { white-space: nowrap; }
    .action-btn {
      background: none; border: none; cursor: pointer; padding: 0.25rem 0.4rem; border-radius: 4px; font-size: 0.85rem;
      &:hover { background: #f1f5f9; }
      &.delete:hover { background: #fee2e2; }
    }
    .empty { text-align: center; color: #94a3b8; padding: 2rem; }
    @media (max-width: 768px) { .form-grid { grid-template-columns: 1fr; } .tabs { overflow-x: auto; } }
    .account-info { display: flex; align-items: center; gap: 1rem; }
    .account-avatar {
      width: 48px; height: 48px; border-radius: 50%;
      background: linear-gradient(135deg, #10b981, #059669);
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 1.25rem; font-weight: 700; flex-shrink: 0;
    }
    .account-details { display: flex; flex-direction: column; gap: 0.2rem; }
    .account-name { font-size: 1rem; font-weight: 600; color: #1e293b; margin: 0; }
    .account-email { font-size: 0.875rem; color: #64748b; margin: 0; }
    .account-role {
      display: inline-block; margin-top: 0.25rem;
      font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em;
      background: #dbeafe; color: #1d4ed8; padding: 0.2rem 0.5rem; border-radius: 4px; width: fit-content;
    }
    .danger-zone { border: 1px solid #fecaca; }
    .danger-zone h2 { color: #dc2626; }
    .danger-text { color: #64748b; font-size: 0.875rem; margin: 0 0 1rem; }
    .btn-danger {
      display: inline-flex; align-items: center; gap: 0.5rem;
      background: #dc2626; color: #fff; padding: 0.6rem 1.2rem; border-radius: 8px;
      font-size: 0.875rem; font-weight: 500; cursor: pointer; border: none;
      &:hover { background: #b91c1c; }
    }
  `],
})
export class SettingsPage implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  auth = inject(AuthService);

  // State signals
  activeTab = signal<'general' | 'orders' | 'invoice' | 'pricing' | 'notifications' | 'account'>('general');
  loading = signal(true);
  saving = signal(false);
  settingsDirty = signal(false);
  successMsg = signal('');
  errorMsg = signal('');

  // Pricing rules state
  pricingRules = signal<PricingRule[]>([]);
  loadingRules = signal(false);
  showRuleForm = signal(false);
  editingRuleId = signal<string | null>(null);
  savingRule = signal(false);
  ruleError = signal('');
  rulesLoaded = false;

  // Dropdown options
  products = signal<ProductOption[]>([]);
  groups = signal<GroupOption[]>([]);
  customers = signal<CustomerOption[]>([]);

  // Settings forms
  generalForm = this.fb.group({
    businessName: [''],
    tagline: [''],
    logo: [''],
    favicon: [''],
  });

  contactForm = this.fb.group({
    phone: [''],
    email: [''],
    address: [''],
    city: [''],
    state: [''],
    pincode: [''],
    country: [''],
  });

  regionalForm = this.fb.group({
    currency: [''],
    currencySymbol: [''],
    timezone: [''],
    language: [''],
  });

  orderForm = this.fb.group({
    minOrderAmount: [0],
    deliveryCharge: [0],
    freeDeliveryAbove: [0],
    acceptOrders: [true],
    orderCutoffTime: [''],
  });

  invoiceForm = this.fb.group({
    invoicePrefix: [''],
    invoiceStartNumber: [1],
    gstNumber: [''],
    panNumber: [''],
  });

  notificationsForm = this.fb.group({
    smsEnabled: [false],
    whatsappEnabled: [false],
    emailEnabled: [false],
  });

  // Pricing rule form
  ruleForm = this.fb.group({
    product: ['', [Validators.required]],
    type: ['', [Validators.required]],
    price: [0, [Validators.required, Validators.min(0)]],
    priority: [0],
    group: [''],
    customer: [''],
    minQuantity: [1],
    maxQuantity: [null as number | null],
    discountPercent: [null as number | null],
    startDate: [''],
    endDate: [''],
    notes: [''],
  });

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    this.loading.set(true);
    this.api.get<any>('/settings').subscribe({
      next: (res) => {
        const s = res.data?.settings || res.data || {};
        this.generalForm.patchValue({
          businessName: s.businessName || '',
          tagline: s.tagline || '',
          logo: s.logo || '',
          favicon: s.favicon || '',
        });
        this.contactForm.patchValue({
          phone: s.contact?.phone || '',
          email: s.contact?.email || '',
          address: s.contact?.address || '',
          city: s.contact?.city || '',
          state: s.contact?.state || '',
          pincode: s.contact?.pincode || '',
          country: s.contact?.country || '',
        });
        this.regionalForm.patchValue({
          currency: s.currency || '',
          currencySymbol: s.currencySymbol || '',
          timezone: s.timezone || '',
          language: s.language || '',
        });
        this.orderForm.patchValue({
          minOrderAmount: s.orderSettings?.minOrderAmount || 0,
          deliveryCharge: s.orderSettings?.deliveryCharge || 0,
          freeDeliveryAbove: s.orderSettings?.freeDeliveryAbove || 0,
          acceptOrders: s.orderSettings?.acceptOrders ?? true,
          orderCutoffTime: s.orderSettings?.orderCutoffTime || '',
        });
        this.invoiceForm.patchValue({
          invoicePrefix: s.invoicePrefix || '',
          invoiceStartNumber: s.invoiceStartNumber || 1,
          gstNumber: s.gstNumber || '',
          panNumber: s.panNumber || '',
        });
        this.notificationsForm.patchValue({
          smsEnabled: s.notifications?.smsEnabled ?? false,
          whatsappEnabled: s.notifications?.whatsappEnabled ?? false,
          emailEnabled: s.notifications?.emailEnabled ?? false,
        });
        this.settingsDirty.set(false);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  markDirty() {
    this.settingsDirty.set(true);
    this.successMsg.set('');
  }

  saveSettings() {
    this.saving.set(true);
    this.errorMsg.set('');
    this.successMsg.set('');

    const body: any = {
      ...this.generalForm.value,
      contact: this.contactForm.value,
      ...this.regionalForm.value,
      invoicePrefix: this.invoiceForm.value.invoicePrefix,
      invoiceStartNumber: this.invoiceForm.value.invoiceStartNumber,
      gstNumber: this.invoiceForm.value.gstNumber,
      panNumber: this.invoiceForm.value.panNumber,
      orderSettings: this.orderForm.value,
      notifications: this.notificationsForm.value,
    };

    this.api.patch<any>('/settings', body).subscribe({
      next: () => {
        this.saving.set(false);
        this.settingsDirty.set(false);
        this.successMsg.set('Settings saved successfully');
        setTimeout(() => this.successMsg.set(''), 3000);
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMsg.set(err?.error?.message || 'Failed to save settings');
      },
    });
  }

  // --- Pricing Rules ---

  loadPricingRules() {
    if (this.rulesLoaded) return;
    this.loadingRules.set(true);
    this.api.get<any>('/pricing/rules').subscribe({
      next: (res) => {
        this.pricingRules.set(res.data || []);
        this.loadingRules.set(false);
        this.rulesLoaded = true;
      },
      error: () => this.loadingRules.set(false),
    });
    // Load dropdown options
    this.loadDropdownOptions();
  }

  private loadDropdownOptions() {
    this.api.get<any>('/catalog/products').subscribe({
      next: (res) => {
        const items = res.data?.products || res.data || [];
        this.products.set(items.map((p: any) => ({ id: p.id, name: p.name })));
      },
    });
    this.api.get<any>('/customers/groups').subscribe({
      next: (res) => {
        const items = res.data?.groups || res.data || [];
        this.groups.set(items.map((g: any) => ({ id: g.id, name: g.name })));
      },
    });
    this.api.get<any>('/customers').subscribe({
      next: (res) => {
        const items = res.data?.customers || res.data || [];
        this.customers.set(items.map((c: any) => ({ id: c.id, name: c.name })));
      },
    });
  }

  openRuleForm() {
    this.ruleForm.reset({ price: 0, priority: 0, minQuantity: 1 });
    this.editingRuleId.set(null);
    this.ruleError.set('');
    this.showRuleForm.set(true);
  }

  closeRuleForm() {
    this.showRuleForm.set(false);
    this.editingRuleId.set(null);
  }

  editRule(rule: PricingRule) {
    this.editingRuleId.set(rule.id);
    this.ruleForm.patchValue({
      product: rule.product?.id || '',
      type: rule.type,
      price: rule.price,
      priority: rule.priority,
      group: (rule as any).group?.id || '',
      customer: (rule as any).customer?.id || '',
      minQuantity: rule.minQuantity || 1,
      maxQuantity: rule.maxQuantity || null,
      discountPercent: rule.discountPercent || null,
      startDate: rule.startDate ? rule.startDate.substring(0, 10) : '',
      endDate: rule.endDate ? rule.endDate.substring(0, 10) : '',
      notes: (rule as any).notes || '',
    });
    this.ruleError.set('');
    this.showRuleForm.set(true);
  }

  deleteRule(rule: PricingRule) {
    if (!confirm(`Delete pricing rule for "${rule.product?.name || 'Unknown product'}"?`)) return;
    this.api.delete(`/pricing/rules/${rule.id}`).subscribe({
      next: () => {
        this.pricingRules.set(this.pricingRules().filter(r => r.id !== rule.id));
      },
    });
  }

  submitRule() {
    if (this.ruleForm.invalid) {
      this.ruleForm.markAllAsTouched();
      return;
    }
    this.savingRule.set(true);
    this.ruleError.set('');

    const val = this.ruleForm.value;
    const body: any = {
      product: val.product,
      type: val.type,
      price: val.price,
      priority: val.priority || 0,
      minQuantity: val.minQuantity || 1,
    };
    if (val.maxQuantity) body.maxQuantity = val.maxQuantity;
    if (val.discountPercent) body.discountPercent = val.discountPercent;
    if (val.group) body.group = val.group;
    if (val.customer) body.customer = val.customer;
    if (val.startDate) body.startDate = val.startDate;
    if (val.endDate) body.endDate = val.endDate;
    if (val.notes) body.notes = val.notes;

    const req$ = this.editingRuleId()
      ? this.api.patch(`/pricing/rules/${this.editingRuleId()}`, body)
      : this.api.post('/pricing/rules', body);

    req$.subscribe({
      next: () => {
        this.savingRule.set(false);
        this.closeRuleForm();
        this.rulesLoaded = false;
        this.loadPricingRules();
      },
      error: (err) => {
        this.savingRule.set(false);
        this.ruleError.set(err?.error?.message || 'Failed to save rule');
      },
    });
  }

  handleLogout() {
    this.auth.logout();
  }
}
