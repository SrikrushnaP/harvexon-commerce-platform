import { Settings, ISettings } from './settings.model';
import { NotFoundError, ConflictError } from '../../common/middleware';

class SettingsService {
  /**
   * Get settings (there should only be one document)
   */
  async getSettings(): Promise<ISettings | null> {
    return Settings.findOne();
  }

  /**
   * Create settings (only one allowed per deployment)
   */
  async createSettings(data: Partial<ISettings>, userId?: string): Promise<ISettings> {
    // Check if settings already exist
    const existing = await Settings.findOne();
    if (existing) {
      throw new ConflictError('Settings already exist. Use update instead.');
    }

    const settings = await Settings.create({
      ...data,
      createdBy: userId,
    });

    return settings;
  }

  /**
   * Update settings
   */
  async updateSettings(data: Partial<ISettings>, userId?: string): Promise<ISettings> {
    const settings = await Settings.findOne();
    if (!settings) {
      throw new NotFoundError('Settings');
    }

    // Deep merge for nested objects
    const settingsObj = settings.toJSON();
    if (data.contact) {
      data.contact = { ...settingsObj.contact, ...data.contact };
    }
    if (data.theme) {
      data.theme = { ...settingsObj.theme, ...data.theme };
    }
    if (data.businessHours) {
      data.businessHours = { ...settingsObj.businessHours, ...data.businessHours };
    }
    if (data.orderSettings) {
      data.orderSettings = { ...settingsObj.orderSettings, ...data.orderSettings };
    }
    if (data.notifications) {
      data.notifications = { ...settingsObj.notifications, ...data.notifications };
    }

    Object.assign(settings, data);
    settings.updatedBy = userId as any;
    await settings.save();

    return settings;
  }

  /**
   * Get public settings (for Customer/Delivery PWA — no sensitive info)
   */
  async getPublicSettings(): Promise<Partial<ISettings> | null> {
    const settings = await Settings.findOne();
    if (!settings) return null;

    return {
      businessName: settings.businessName,
      tagline: settings.tagline,
      logo: settings.logo,
      favicon: settings.favicon,
      contact: {
        phone: settings.contact.phone,
        email: settings.contact.email,
        address: settings.contact.address,
        city: settings.contact.city,
        state: settings.contact.state,
        pincode: settings.contact.pincode,
        country: settings.contact.country,
      },
      currency: settings.currency,
      currencySymbol: settings.currencySymbol,
      timezone: settings.timezone,
      language: settings.language,
      theme: settings.theme,
      businessHours: settings.businessHours,
      orderSettings: {
        minOrderAmount: settings.orderSettings.minOrderAmount,
        deliveryCharge: settings.orderSettings.deliveryCharge,
        freeDeliveryAbove: settings.orderSettings.freeDeliveryAbove,
        acceptOrders: settings.orderSettings.acceptOrders,
        orderCutoffTime: settings.orderSettings.orderCutoffTime,
        deliveryMessage: settings.orderSettings.deliveryMessage,
      },
    } as Partial<ISettings>;
  }
}

export const settingsService = new SettingsService();
