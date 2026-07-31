import { Route } from '@angular/router';
import { authGuard, roleGuard } from '@frontend/shared-data-access';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.page').then(m => m.HomePage),
  },
  {
    path: 'catalog',
    loadComponent: () => import('./pages/catalog/catalog.page').then(m => m.CatalogPage),
  },
  {
    path: 'product/:slug',
    loadComponent: () => import('./pages/product/product.page').then(m => m.ProductPage),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login.page').then(m => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/auth/register.page').then(m => m.RegisterPage),
  },
  {
    path: 'cart',
    loadComponent: () => import('./pages/cart/cart.page').then(m => m.CartPage),
  },
  {
    path: 'checkout',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/checkout/checkout.page').then(m => m.CheckoutPage),
  },
  {
    path: 'orders',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/orders/orders.page').then(m => m.OrdersPage),
  },
  {
    path: 'orders/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/orders/order-detail.page').then(m => m.OrderDetailPage),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/profile/profile.page').then(m => m.ProfilePage),
  },
  {
    path: 'delivery',
    canActivate: [authGuard, roleGuard('delivery_staff', 'admin')],
    loadComponent: () => import('./pages/delivery/delivery-dashboard.page').then(m => m.DeliveryDashboardPage),
  },
  {
    path: 'delivery/:id',
    canActivate: [authGuard, roleGuard('delivery_staff', 'admin')],
    loadComponent: () => import('./pages/delivery/delivery-task.page').then(m => m.DeliveryTaskPage),
  },
  { path: '**', redirectTo: '' },
];
