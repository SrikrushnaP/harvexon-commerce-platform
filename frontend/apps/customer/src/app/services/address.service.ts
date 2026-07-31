import { Injectable, inject, signal } from '@angular/core';
import { ApiService, AuthService } from '@frontend/shared-data-access';
import { firstValueFrom } from 'rxjs';

export interface Address {
  id: string;
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  phone?: string;
  isDefault?: boolean;
}

/** localStorage-only guest address (no _id from backend yet) */
interface GuestAddress {
  id: string; // local-only ID
  label?: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
  phone?: string;
}

const GUEST_STORAGE_KEY = 'hcp_guest_addresses';

@Injectable({ providedIn: 'root' })
export class AddressService {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  addresses = signal<Address[]>([]);
  loading = signal(false);

  /**
   * Load addresses — from API if logged in, from localStorage if guest.
   */
  async loadAddresses(): Promise<void> {
    this.loading.set(true);
    try {
      if (this.auth.isAuthenticated()) {
        const res = await firstValueFrom(
          this.api.get<{ addresses: Address[] }>('/auth/addresses')
        );
        if (res.success && res.data) {
          this.addresses.set(res.data.addresses);
        }
      } else {
        const guest = this.getGuestAddresses();
        // Map guest addresses to Address shape for consistent UI
        this.addresses.set(guest.map(g => ({
          id: g.id,
          label: g.label,
          line1: g.line1,
          city: g.city,
          state: g.state,
          pincode: g.pincode,
          phone: g.phone,
        })));
      }
    } catch {
      // fallback: if API fails but we have guest data, use it
      if (!this.auth.isAuthenticated()) {
        const guest = this.getGuestAddresses();
        this.addresses.set(guest.map(g => ({
          id: g.id,
          label: g.label,
          line1: g.line1,
          city: g.city,
          state: g.state,
          pincode: g.pincode,
          phone: g.phone,
        })));
      }
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Save a new address — to API if logged in, to localStorage if guest.
   */
  async saveAddress(data: {
    label?: string;
    line1: string;
    city: string;
    state: string;
    pincode: string;
    phone?: string;
  }): Promise<Address | null> {
    if (this.auth.isAuthenticated()) {
      const res = await firstValueFrom(
        this.api.post<{ address: Address }>('/auth/addresses', data)
      );
      if (res.success && res.data) {
        this.addresses.update(list => [...list, res.data!.address]);
        return res.data.address;
      }
      return null;
    } else {
      // Guest mode: save to localStorage
      const guestAddr: GuestAddress = {
        id: 'guest_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
        ...data,
      };
      const existing = this.getGuestAddresses();
      existing.push(guestAddr);
      this.setGuestAddresses(existing);

      const addr: Address = {
        id: guestAddr.id,
        label: guestAddr.label,
        line1: guestAddr.line1,
        city: guestAddr.city,
        state: guestAddr.state,
        pincode: guestAddr.pincode,
        phone: guestAddr.phone,
      };
      this.addresses.update(list => [...list, addr]);
      return addr;
    }
  }

  /**
   * Update an existing address — via API if logged in, in localStorage if guest.
   */
  async updateAddress(id: string, data: {
    label?: string;
    line1: string;
    city: string;
    state: string;
    pincode: string;
    phone?: string;
  }): Promise<Address | null> {
    if (this.auth.isAuthenticated()) {
      const res = await firstValueFrom(
        this.api.patch<{ address: Address }>(`/auth/addresses/${id}`, data)
      );
      if (res.success && res.data) {
        this.addresses.update(list =>
          list.map(a => a.id === id ? res.data!.address : a)
        );
        return res.data.address;
      }
      return null;
    } else {
      // Guest mode: update in localStorage
      const existing = this.getGuestAddresses();
      const idx = existing.findIndex(a => a.id === id);
      if (idx >= 0) {
        existing[idx] = { ...existing[idx], ...data };
        this.setGuestAddresses(existing);
        const updated: Address = {
          id,
          label: data.label,
          line1: data.line1,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          phone: data.phone,
        };
        this.addresses.update(list =>
          list.map(a => a.id === id ? updated : a)
        );
        return updated;
      }
      return null;
    }
  }

  /**
   * Delete an address — from API if logged in, from localStorage if guest.
   */
  async deleteAddress(id: string): Promise<void> {
    if (this.auth.isAuthenticated()) {
      await firstValueFrom(this.api.delete(`/auth/addresses/${id}`));
      this.addresses.update(list => list.filter(a => a.id !== id));
    } else {
      const existing = this.getGuestAddresses();
      this.setGuestAddresses(existing.filter(a => a.id !== id));
      this.addresses.update(list => list.filter(a => a.id !== id));
    }
  }

  /**
   * Merge guest addresses to backend after login.
   * Call this after a successful login to sync any locally-stored addresses.
   */
  async mergeGuestAddresses(): Promise<void> {
    const guest = this.getGuestAddresses();
    if (guest.length === 0) return;

    // Post each guest address to the backend
    for (const addr of guest) {
      try {
        await firstValueFrom(
          this.api.post('/auth/addresses', {
            label: addr.label,
            line1: addr.line1,
            city: addr.city,
            state: addr.state,
            pincode: addr.pincode,
            phone: addr.phone,
          })
        );
      } catch {
        // If one fails, continue with the rest
      }
    }

    // Clear guest addresses from localStorage
    this.clearGuestAddresses();

    // Reload from backend to get the canonical list
    await this.loadAddresses();
  }

  /**
   * Check if there are guest addresses pending merge.
   */
  hasGuestAddresses(): boolean {
    return this.getGuestAddresses().length > 0;
  }

  // --- localStorage helpers ---

  private getGuestAddresses(): GuestAddress[] {
    try {
      const stored = localStorage.getItem(GUEST_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private setGuestAddresses(addresses: GuestAddress[]): void {
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(addresses));
  }

  private clearGuestAddresses(): void {
    localStorage.removeItem(GUEST_STORAGE_KEY);
  }
}
