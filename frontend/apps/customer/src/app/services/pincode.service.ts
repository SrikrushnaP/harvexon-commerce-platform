import { Injectable, inject, signal, computed } from '@angular/core';
import { SettingsService } from './settings.service';

const PINCODE_KEY = 'hcp_pincode';

@Injectable({ providedIn: 'root' })
export class PincodeService {
  private settings = inject(SettingsService);

  /** The user's selected pincode */
  pincode = signal<string>(this.loadFromStorage());

  /** Whether the selected pincode is serviceable */
  isServiceable = computed(() => {
    const pin = this.pincode();
    if (!pin) return null; // no pincode set — unknown
    const serviceable = this.settings.serviceablePincodes();
    if (serviceable.length === 0) return true; // no restriction
    return serviceable.includes(pin);
  });

  /** Set the pincode and persist to localStorage */
  setPincode(pin: string) {
    const trimmed = pin.trim();
    this.pincode.set(trimmed);
    if (trimmed) {
      localStorage.setItem(PINCODE_KEY, trimmed);
    } else {
      localStorage.removeItem(PINCODE_KEY);
    }
  }

  /** Clear pincode */
  clearPincode() {
    this.pincode.set('');
    localStorage.removeItem(PINCODE_KEY);
  }

  /** Check if a given pincode is serviceable (without setting it) */
  checkServiceability(pin: string): boolean {
    const serviceable = this.settings.serviceablePincodes();
    if (serviceable.length === 0) return true;
    return serviceable.includes(pin.trim());
  }

  private loadFromStorage(): string {
    try {
      return localStorage.getItem(PINCODE_KEY) || '';
    } catch {
      return '';
    }
  }
}
