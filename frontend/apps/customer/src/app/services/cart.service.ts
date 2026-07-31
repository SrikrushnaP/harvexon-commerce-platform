import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { ApiService, AuthService } from '@frontend/shared-data-access';

export interface CartItem {
  _id?: string;
  productId: string;
  name: string;
  slug: string;
  basePrice: number;
  unit: string;
  quantity: number;
}

const CART_STORAGE_KEY = 'hcp_cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  private _items = signal<CartItem[]>([]);
  private _loading = signal(false);
  private _initialized = false;

  items = this._items.asReadonly();
  loading = this._loading.asReadonly();

  cartCount = computed(() =>
    this._items().reduce((sum, item) => sum + item.quantity, 0)
  );

  cartTotal = computed(() =>
    this._items().reduce((sum, item) => sum + item.basePrice * item.quantity, 0)
  );

  private authEffect = effect(() => {
    const isAuth = this.auth.isAuthenticated();
    if (isAuth && !this._initialized) {
      this._initialized = true;
      this.syncOnLogin();
    } else if (!isAuth) {
      this._initialized = false;
      this._items.set(this.loadFromStorage());
    }
  }, { allowSignalWrites: true });

  constructor() {
    // Load from localStorage immediately for fast initial render
    this._items.set(this.loadFromStorage());
  }

  addItem(product: { id: string; name: string; slug: string; basePrice: number; unit?: { shortName: string } }, quantity = 1) {
    if (this.auth.isAuthenticated()) {
      this.api.post<any>('/cart/items', { productId: product.id, quantity }).subscribe({
        next: (res) => {
          if (res.success) this.updateFromBackend(res.data);
        },
      });
    } else {
      const items = [...this._items()];
      const existing = items.find(i => i.productId === product.id);
      if (existing) {
        existing.quantity += quantity;
      } else {
        items.push({
          productId: product.id,
          name: product.name,
          slug: product.slug,
          basePrice: product.basePrice,
          unit: product.unit?.shortName || 'pc',
          quantity,
        });
      }
      this._items.set(items);
      this.saveToStorage();
    }
  }

  removeItem(productId: string) {
    if (this.auth.isAuthenticated()) {
      const item = this._items().find(i => i.productId === productId);
      if (item?._id) {
        this.api.delete<any>(`/cart/items/${item._id}`).subscribe({
          next: (res) => {
            if (res.success) this.updateFromBackend(res.data);
          },
        });
      }
    } else {
      this._items.set(this._items().filter(i => i.productId !== productId));
      this.saveToStorage();
    }
  }

  updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      this.removeItem(productId);
      return;
    }

    if (this.auth.isAuthenticated()) {
      const item = this._items().find(i => i.productId === productId);
      if (item?._id) {
        this.api.patch<any>(`/cart/items/${item._id}`, { quantity }).subscribe({
          next: (res) => {
            if (res.success) this.updateFromBackend(res.data);
          },
        });
      }
    } else {
      const items = this._items().map(i =>
        i.productId === productId ? { ...i, quantity } : i
      );
      this._items.set(items);
      this.saveToStorage();
    }
  }

  clearCart() {
    if (this.auth.isAuthenticated()) {
      this.api.delete<any>('/cart').subscribe({
        next: (res) => {
          if (res.success) this.updateFromBackend(res.data);
        },
      });
    } else {
      this._items.set([]);
      this.saveToStorage();
    }
  }

  /** Called after login to merge local cart with backend */
  private syncOnLogin() {
    const localItems = this.loadFromStorage();

    if (localItems.length > 0) {
      // Merge localStorage items into backend
      const syncPayload = localItems.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
      }));
      this.api.post<any>('/cart/sync', { items: syncPayload }).subscribe({
        next: (res) => {
          if (res.success) {
            this.updateFromBackend(res.data);
            this.clearStorage();
          }
        },
        error: () => this.fetchCart(),
      });
    } else {
      this.fetchCart();
    }
  }

  /** Fetch cart from backend */
  fetchCart() {
    if (!this.auth.isAuthenticated()) return;
    this._loading.set(true);
    this.api.get<any>('/cart').subscribe({
      next: (res) => {
        this._loading.set(false);
        if (res.success) this.updateFromBackend(res.data);
      },
      error: () => this._loading.set(false),
    });
  }

  private updateFromBackend(data: any) {
    if (!data?.items) return;
    const items: CartItem[] = data.items.map((i: any) => ({
      _id: i.id || i._id,
      productId: i.productId,
      name: i.name,
      slug: i.slug,
      basePrice: i.basePrice,
      unit: i.unit || 'pc',
      quantity: i.quantity,
    }));
    this._items.set(items);
  }

  private saveToStorage() {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this._items()));
    } catch { /* storage full or unavailable */ }
  }

  private loadFromStorage(): CartItem[] {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private clearStorage() {
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch { /* ignore */ }
  }
}
