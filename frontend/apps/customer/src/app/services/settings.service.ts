import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from '@frontend/shared-data-access';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private api = inject(ApiService);

  businessName = signal<string>('');
  tagline = signal<string>('');
  logo = signal<string>('');
  currencySymbol = signal<string>('₹');
  deliveryCharge = signal<number>(0);
  freeDeliveryAbove = signal<number>(0);
  minOrderAmount = signal<number>(0);
  acceptOrders = signal<boolean>(true);
  deliveryMessage = signal<string>('');
  serviceablePincodes = signal<string[]>([]);
  constructor() {
    this.loadSettings();
  }

  private loadSettings() {
    this.api.get<any>('/settings/public').subscribe({
      next: (res) => {
        const data = res.data?.settings;
        if (data) {
          this.businessName.set(data.businessName || '');
          this.tagline.set(data.tagline || '');
          this.logo.set(data.logo || '');
          this.currencySymbol.set(data.currencySymbol || '₹');

          if (data.orderSettings) {
            this.deliveryCharge.set(data.orderSettings.deliveryCharge ?? 0);
            this.freeDeliveryAbove.set(data.orderSettings.freeDeliveryAbove ?? 0);
            this.minOrderAmount.set(data.orderSettings.minOrderAmount ?? 0);
            this.acceptOrders.set(data.orderSettings.acceptOrders ?? true);
            this.deliveryMessage.set(data.orderSettings.deliveryMessage ?? '');
            this.serviceablePincodes.set(data.orderSettings.serviceablePincodes ?? []);
          }
        }
      }
    });
  }
}
