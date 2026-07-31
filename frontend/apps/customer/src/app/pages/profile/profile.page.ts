import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ApiService, AuthService } from '@frontend/shared-data-access';
import { AddressService, Address } from '../../services/address.service';
import { ConfirmDialogComponent } from '../../components/confirm-dialog.component';

@Component({
  standalone: true,
  imports: [RouterModule, ReactiveFormsModule, ConfirmDialogComponent],
  template: `
    <div class="profile-container">
      <div class="profile-header">
        <div class="avatar">
          {{ auth.user()?.name?.charAt(0)?.toUpperCase() || 'U' }}
        </div>
        <h1 class="profile-name">{{ auth.user()?.name || 'User' }}</h1>
        <p class="profile-email">{{ auth.user()?.email || '' }}</p>
        @if (auth.user()?.phone) {
          <p class="profile-phone">📞 {{ auth.user()?.phone }}</p>
        }
      </div>

      <div class="nav-section">
        <a routerLink="/orders" class="nav-item">
          <div class="nav-item-left">
            <div class="nav-icon">📦</div>
            <div class="nav-text">
              <span class="nav-label">My Orders</span>
              <span class="nav-desc">Track and manage your orders</span>
            </div>
          </div>
          <span class="nav-arrow">›</span>
        </a>

        <div class="nav-item" (click)="toggleAddresses()">
          <div class="nav-item-left">
            <div class="nav-icon">📍</div>
            <div class="nav-text">
              <span class="nav-label">Saved Addresses</span>
              <span class="nav-desc">{{ addresses().length }} address{{ addresses().length !== 1 ? 'es' : '' }} saved</span>
            </div>
          </div>
          <span class="nav-arrow" [class.expanded]="showAddresses()">›</span>
        </div>

        @if (showAddresses()) {
          <div class="expandable-section">
            @if (loadingAddresses()) {
              <div class="loading-row">Loading addresses...</div>
            } @else {
              @for (addr of addresses(); track addr.id) {
                <div class="address-item">
                  <div class="address-info">
                    @if (addr.label) {
                      <span class="address-label-tag">{{ addr.label }}</span>
                    }
                    <span class="address-text">{{ addr.line1 }}, {{ addr.city }}, {{ addr.state }} - {{ addr.pincode }}</span>
                    @if (addr.phone) {
                      <span class="address-phone">📞 {{ addr.phone }}</span>
                    }
                  </div>
                  <div class="address-actions">
                    <button class="edit-btn" (click)="editAddress(addr)">✏️</button>
                    <button class="delete-btn" (click)="deleteAddress(addr.id)">🗑️</button>
                  </div>
                </div>
              } @empty {
                <div class="empty-row">No addresses saved yet</div>
              }

              @if (!showAddressForm()) {
                <button class="add-btn" (click)="startAddAddress()">+ Add New Address</button>
              }

              @if (showAddressForm()) {
                <form class="address-form" [formGroup]="addressForm" (ngSubmit)="saveAddress()">
                  <h4 class="form-title">{{ editingAddressId() ? 'Edit Address' : 'New Address' }}</h4>
                  <div class="form-grid">
                    <div class="form-group">
                      <label>Label</label>
                      <input formControlName="label" placeholder="Home, Office...">
                    </div>
                    <div class="form-group full-width">
                      <label>Address</label>
                      <input formControlName="line1" placeholder="Street address">
                    </div>
                    <div class="form-group">
                      <label>City</label>
                      <input formControlName="city" placeholder="City">
                    </div>
                    <div class="form-group">
                      <label>State</label>
                      <input formControlName="state" placeholder="State">
                    </div>
                    <div class="form-group">
                      <label>Pincode</label>
                      <input formControlName="pincode" placeholder="Pincode">
                    </div>
                    <div class="form-group">
                      <label>Phone</label>
                      <input formControlName="phone" placeholder="Phone (optional)">
                    </div>
                  </div>
                  <div class="form-actions">
                    <button type="button" class="cancel-btn" (click)="cancelAddressForm()">Cancel</button>
                    <button type="submit" class="save-btn" [disabled]="addressForm.invalid || savingAddress()">
                      {{ savingAddress() ? 'Saving...' : (editingAddressId() ? 'Update' : 'Save') }}
                    </button>
                  </div>
                </form>
              }
            }
          </div>
        }

        <div class="nav-item disabled-item">
          <div class="nav-item-left">
            <div class="nav-icon">💳</div>
            <div class="nav-text">
              <span class="nav-label">Payment Methods</span>
              <span class="nav-desc coming-soon">Coming soon</span>
            </div>
          </div>
          <span class="badge-soon">Soon</span>
        </div>

        <div class="nav-item disabled-item">
          <div class="nav-item-left">
            <div class="nav-icon">🥗</div>
            <div class="nav-text">
              <span class="nav-label">Nutrition Profile</span>
              <span class="nav-desc coming-soon">Coming soon</span>
            </div>
          </div>
          <span class="badge-soon">Soon</span>
        </div>
      </div>

      <div class="nav-section settings-section">
        <div class="nav-item" (click)="toggleSettings()">
          <div class="nav-item-left">
            <div class="nav-icon">⚙️</div>
            <div class="nav-text">
              <span class="nav-label">Settings</span>
              <span class="nav-desc">Profile, notifications & account</span>
            </div>
          </div>
          <span class="nav-arrow" [class.expanded]="showSettings()">›</span>
        </div>

        @if (showSettings()) {
          <div class="expandable-section settings-content">

            <!-- Edit Profile -->
            <div class="settings-group">
              <h4 class="settings-group-title">Edit Profile</h4>
              <form class="settings-form" [formGroup]="profileForm" (ngSubmit)="saveProfile()">
                <div class="form-group">
                  <label>Name</label>
                  <input formControlName="name" placeholder="Your name">
                </div>
                <div class="form-group">
                  <label>Phone</label>
                  <input formControlName="phone" placeholder="Phone number">
                </div>
                <div class="form-actions">
                  <button type="submit" class="save-btn" [disabled]="profileForm.invalid || profileForm.pristine || savingProfile()">
                    {{ savingProfile() ? 'Saving...' : 'Save Changes' }}
                  </button>
                </div>
                @if (profileSuccess()) {
                  <p class="success-msg">✓ Profile updated</p>
                }
                @if (profileError()) {
                  <p class="error-msg">{{ profileError() }}</p>
                }
              </form>
            </div>

            <!-- Notification Preferences -->
            <div class="settings-group">
              <h4 class="settings-group-title">Notifications</h4>
              <div class="toggle-list">
                <div class="toggle-item">
                  <div class="toggle-info">
                    <span class="toggle-label">Order Updates</span>
                    <span class="toggle-desc">Get notified about order status changes</span>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox" [checked]="notifOrderUpdates()" (change)="toggleNotif('orderUpdates')">
                    <span class="toggle-slider"></span>
                  </label>
                </div>
                <div class="toggle-item">
                  <div class="toggle-info">
                    <span class="toggle-label">Promotions</span>
                    <span class="toggle-desc">Deals, offers & seasonal discounts</span>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox" [checked]="notifPromotions()" (change)="toggleNotif('promotions')">
                    <span class="toggle-slider"></span>
                  </label>
                </div>
                <div class="toggle-item">
                  <div class="toggle-info">
                    <span class="toggle-label">Delivery Alerts</span>
                    <span class="toggle-desc">Real-time delivery tracking updates</span>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox" [checked]="notifDeliveryAlerts()" (change)="toggleNotif('deliveryAlerts')">
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>

            <!-- Delete Account -->
            <div class="settings-group danger-zone">
              <h4 class="settings-group-title danger-title">Danger Zone</h4>
              <p class="danger-desc">Permanently delete your account and all associated data. This action cannot be undone.</p>
              <button class="danger-btn" (click)="requestDeleteAccount()">Delete My Account</button>
            </div>
          </div>
        }

        <div class="nav-item sign-out" (click)="auth.logout()">
          <div class="nav-item-left">
            <div class="nav-icon sign-out-icon">🚪</div>
            <div class="nav-text">
              <span class="nav-label sign-out-text">Sign Out</span>
            </div>
          </div>
        </div>
      </div>

      <app-confirm-dialog
        [open]="showDeleteConfirm()"
        title="Delete Address"
        message="Are you sure you want to delete this address? This cannot be undone."
        confirmText="Delete"
        (confirmed)="confirmDeleteAddress()"
        (cancelled)="showDeleteConfirm.set(false)"
      />

      <app-confirm-dialog
        [open]="showAccountDeleteConfirm()"
        title="Delete Account"
        message="This will permanently delete your account, order history, saved addresses, and all data. This cannot be undone."
        confirmText="Delete Account"
        (confirmed)="confirmDeleteAccount()"
        (cancelled)="showAccountDeleteConfirm.set(false)"
      />
    </div>
  `,
  styles: [`
    .profile-container {
      min-height: 100vh;
      background: #f8faf8;
      padding: 24px 16px;
      padding-bottom: 100px;
      max-width: 480px;
      margin: 0 auto;
    }
    .profile-header {
      text-align: center;
      padding: 32px 0 24px;
    }
    .avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, #16a34a, #15803d);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
      font-size: 32px;
      font-weight: 700;
      color: white;
      box-shadow: 0 4px 14px rgba(22, 163, 74, 0.3);
    }
    .profile-name {
      font-size: 22px;
      font-weight: 700;
      color: #1a1a1a;
      margin: 0 0 4px;
    }
    .profile-email {
      font-size: 14px;
      color: #6b7280;
      margin: 0 0 4px;
    }
    .profile-phone {
      font-size: 13px;
      color: #6b7280;
      margin: 0;
    }
    .nav-section {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      margin-bottom: 16px;
    }
    .settings-section {
      margin-top: 8px;
    }
    .nav-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      cursor: pointer;
      transition: background 0.15s ease;
      text-decoration: none;
      color: inherit;
      border-bottom: 1px solid #f3f4f6;
    }
    .nav-item:last-child {
      border-bottom: none;
    }
    .nav-item:hover {
      background: #f9fafb;
    }
    .disabled-item {
      cursor: default;
      opacity: 0.7;
    }
    .disabled-item:hover {
      background: transparent;
    }
    .nav-item-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .nav-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: #f0fdf4;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      flex-shrink: 0;
    }
    .nav-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .nav-label {
      font-size: 15px;
      font-weight: 600;
      color: #1f2937;
    }
    .nav-desc {
      font-size: 12px;
      color: #9ca3af;
    }
    .coming-soon {
      color: #d97706;
      font-style: italic;
    }
    .badge-soon {
      font-size: 10px;
      font-weight: 600;
      color: #d97706;
      background: #fef3c7;
      padding: 2px 8px;
      border-radius: 10px;
      text-transform: uppercase;
    }
    .nav-arrow {
      font-size: 20px;
      color: #d1d5db;
      font-weight: 300;
      transition: transform 0.2s;
    }
    .nav-arrow.expanded {
      transform: rotate(90deg);
    }
    .sign-out-icon {
      background: #fef2f2;
    }
    .sign-out-text {
      color: #dc2626;
    }
    .sign-out:hover {
      background: #fef2f2;
    }

    /* Expandable address section */
    .expandable-section {
      padding: 0 20px 16px;
      border-bottom: 1px solid #f3f4f6;
    }
    .loading-row, .empty-row {
      padding: 12px 0;
      font-size: 13px;
      color: #9ca3af;
      text-align: center;
    }
    .address-item {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 12px 14px;
      background: #f9fafb;
      border-radius: 10px;
      margin-bottom: 8px;
    }
    .address-info {
      display: flex;
      flex-direction: column;
      gap: 3px;
      flex: 1;
    }
    .address-label-tag {
      font-size: 12px;
      font-weight: 600;
      color: #16a34a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .address-text {
      font-size: 13px;
      color: #374151;
      line-height: 1.4;
    }
    .address-phone {
      font-size: 12px;
      color: #6b7280;
    }
    .delete-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 14px;
      padding: 4px;
      opacity: 0.6;
      transition: opacity 0.15s;
    }
    .delete-btn:hover {
      opacity: 1;
    }
    .edit-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 14px;
      padding: 4px;
      opacity: 0.6;
      transition: opacity 0.15s;
    }
    .edit-btn:hover {
      opacity: 1;
    }
    .address-actions {
      display: flex;
      gap: 4px;
      align-items: center;
      flex-shrink: 0;
    }
    .form-title {
      font-size: 13px;
      font-weight: 600;
      color: #374151;
      margin: 0 0 10px;
    }
    .add-btn {
      display: block;
      width: 100%;
      padding: 10px;
      border: 1px dashed #d1d5db;
      border-radius: 10px;
      background: transparent;
      color: #16a34a;
      font-weight: 500;
      font-size: 13px;
      cursor: pointer;
      margin-top: 4px;
    }
    .add-btn:hover {
      background: #f0fdf4;
      border-color: #16a34a;
    }

    /* Address form */
    .address-form {
      margin-top: 12px;
      padding: 14px;
      background: #f9fafb;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
    }
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .form-group.full-width {
      grid-column: span 2;
    }
    .form-group label {
      font-size: 11px;
      font-weight: 500;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .form-group input {
      padding: 9px 11px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 13px;
      outline: none;
    }
    .form-group input:focus {
      border-color: #16a34a;
      box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.1);
    }
    .form-actions {
      display: flex;
      gap: 8px;
      margin-top: 12px;
      justify-content: flex-end;
    }
    .cancel-btn {
      padding: 7px 14px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      background: white;
      color: #6b7280;
      font-size: 13px;
      cursor: pointer;
    }
    .save-btn {
      padding: 7px 14px;
      border: none;
      border-radius: 8px;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: white;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
    }
    .save-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Settings */
    .settings-content { padding-top: 4px; }
    .settings-group {
      padding: 16px 0;
      border-bottom: 1px solid #f3f4f6;
    }
    .settings-group:last-child { border-bottom: none; }
    .settings-group-title {
      font-size: 13px;
      font-weight: 600;
      color: #374151;
      margin: 0 0 12px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .settings-form .form-group {
      margin-bottom: 10px;
    }
    .success-msg {
      font-size: 12px; color: #16a34a; margin: 8px 0 0; font-weight: 500;
    }
    .error-msg {
      font-size: 12px; color: #dc2626; margin: 8px 0 0;
    }

    /* Toggle switches */
    .toggle-list { display: flex; flex-direction: column; gap: 12px; }
    .toggle-item {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 12px; background: #f9fafb; border-radius: 10px;
    }
    .toggle-info { display: flex; flex-direction: column; gap: 2px; }
    .toggle-label { font-size: 13px; font-weight: 500; color: #1f2937; }
    .toggle-desc { font-size: 11px; color: #9ca3af; }
    .toggle-switch {
      position: relative; width: 44px; height: 24px; cursor: pointer;
    }
    .toggle-switch input { opacity: 0; width: 0; height: 0; }
    .toggle-slider {
      position: absolute; inset: 0;
      background: #d1d5db; border-radius: 24px; transition: 0.2s;
    }
    .toggle-slider::before {
      content: ''; position: absolute; width: 18px; height: 18px;
      left: 3px; bottom: 3px; background: white; border-radius: 50%;
      transition: 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    }
    .toggle-switch input:checked + .toggle-slider { background: #16a34a; }
    .toggle-switch input:checked + .toggle-slider::before { transform: translateX(20px); }

    /* Danger zone */
    .danger-zone { border-bottom: none; }
    .danger-title { color: #dc2626; }
    .danger-desc { font-size: 12px; color: #6b7280; margin: 0 0 12px; line-height: 1.4; }
    .danger-btn {
      padding: 9px 16px; border: 1px solid #fca5a5; border-radius: 8px;
      background: #fef2f2; color: #dc2626; font-size: 13px; font-weight: 500;
      cursor: pointer; transition: all 0.15s;
    }
    .danger-btn:hover { background: #fee2e2; border-color: #f87171; }
  `]
})
export class ProfilePage implements OnInit {
  private fb = inject(FormBuilder);
  private addressService = inject(AddressService);
  private api = inject(ApiService);
  private router = inject(Router);
  auth = inject(AuthService);

  addresses = this.addressService.addresses;
  loadingAddresses = this.addressService.loading;
  showAddresses = signal(false);
  showAddressForm = signal(false);
  savingAddress = signal(false);
  editingAddressId = signal<string | null>(null);

  // Settings
  showSettings = signal(false);
  savingProfile = signal(false);
  profileSuccess = signal(false);
  profileError = signal('');
  notifOrderUpdates = signal(true);
  notifPromotions = signal(true);
  notifDeliveryAlerts = signal(true);
  showAccountDeleteConfirm = signal(false);

  addressForm = this.fb.nonNullable.group({
    label: [''],
    line1: ['', Validators.required],
    city: ['', Validators.required],
    state: ['', Validators.required],
    pincode: ['', Validators.required],
    phone: ['']
  });

  profileForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.required, Validators.minLength(10)]],
  });

  ngOnInit() {
    this.addressService.loadAddresses();
    this.loadProfile();
  }

  private loadProfile() {
    const user = this.auth.user();
    if (user) {
      this.profileForm.patchValue({
        name: user.name || '',
        phone: user.phone || '',
      });
      this.profileForm.markAsPristine();
    }
    // Load notification preferences
    this.api.get<any>('/auth/profile').subscribe(res => {
      if (res.success && res.data?.user?.notificationPreferences) {
        const prefs = res.data.user.notificationPreferences;
        this.notifOrderUpdates.set(prefs.orderUpdates !== false);
        this.notifPromotions.set(prefs.promotions !== false);
        this.notifDeliveryAlerts.set(prefs.deliveryAlerts !== false);
      }
    });
  }

  toggleSettings() {
    this.showSettings.update(v => !v);
  }

  toggleAddresses() {
    this.showAddresses.update(v => !v);
  }

  async saveProfile() {
    if (this.profileForm.invalid) return;
    this.savingProfile.set(true);
    this.profileSuccess.set(false);
    this.profileError.set('');

    const val = this.profileForm.getRawValue();
    this.api.patch<any>('/auth/profile', { name: val.name, phone: val.phone }).subscribe({
      next: (res) => {
        this.savingProfile.set(false);
        if (res.success) {
          this.profileSuccess.set(true);
          this.profileForm.markAsPristine();
          // Update stored user data
          if (res.data?.user) {
            localStorage.setItem('hcp_user', JSON.stringify(res.data.user));
          }
          setTimeout(() => this.profileSuccess.set(false), 3000);
        } else {
          this.profileError.set(res.message || 'Failed to update profile');
        }
      },
      error: (err) => {
        this.savingProfile.set(false);
        this.profileError.set(err?.error?.message || 'Failed to update profile');
      }
    });
  }

  toggleNotif(key: 'orderUpdates' | 'promotions' | 'deliveryAlerts') {
    // Toggle locally
    if (key === 'orderUpdates') this.notifOrderUpdates.update(v => !v);
    else if (key === 'promotions') this.notifPromotions.update(v => !v);
    else this.notifDeliveryAlerts.update(v => !v);

    // Persist to backend
    const prefs = {
      orderUpdates: this.notifOrderUpdates(),
      promotions: this.notifPromotions(),
      deliveryAlerts: this.notifDeliveryAlerts(),
    };
    this.api.patch<any>('/auth/profile', { notificationPreferences: prefs }).subscribe();
  }

  requestDeleteAccount() {
    this.showAccountDeleteConfirm.set(true);
  }

  confirmDeleteAccount() {
    this.showAccountDeleteConfirm.set(false);
    this.api.delete<any>('/auth/profile').subscribe({
      next: () => {
        this.auth.logout();
        this.router.navigate(['/']);
      },
      error: () => {
        this.auth.logout();
        this.router.navigate(['/']);
      }
    });
  }

  startAddAddress() {
    this.editingAddressId.set(null);
    this.addressForm.reset();
    this.showAddressForm.set(true);
  }

  editAddress(addr: Address) {
    this.editingAddressId.set(addr.id);
    this.addressForm.patchValue({
      label: addr.label || '',
      line1: addr.line1,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      phone: addr.phone || '',
    });
    this.showAddressForm.set(true);
  }

  cancelAddressForm() {
    this.showAddressForm.set(false);
    this.editingAddressId.set(null);
    this.addressForm.reset();
  }

  async saveAddress() {
    if (this.addressForm.invalid) return;
    this.savingAddress.set(true);
    const body = this.addressForm.getRawValue();
    const payload = {
      label: body.label || undefined,
      line1: body.line1,
      city: body.city,
      state: body.state,
      pincode: body.pincode,
      phone: body.phone || undefined,
    };
    try {
      const editId = this.editingAddressId();
      if (editId) {
        const updated = await this.addressService.updateAddress(editId, payload);
        if (updated) {
          this.showAddressForm.set(false);
          this.editingAddressId.set(null);
          this.addressForm.reset();
        }
      } else {
        const addr = await this.addressService.saveAddress(payload);
        if (addr) {
          this.showAddressForm.set(false);
          this.addressForm.reset();
        }
      }
    } finally {
      this.savingAddress.set(false);
    }
  }

  showDeleteConfirm = signal(false);
  private pendingDeleteId = '';

  async deleteAddress(id: string) {
    this.pendingDeleteId = id;
    this.showDeleteConfirm.set(true);
  }

  async confirmDeleteAddress() {
    this.showDeleteConfirm.set(false);
    if (this.pendingDeleteId) {
      await this.addressService.deleteAddress(this.pendingDeleteId);
      this.pendingDeleteId = '';
    }
  }
}
