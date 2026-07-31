import { Route } from '@angular/router';
import { authGuard } from '@frontend/shared-data-access';

export const appRoutes: Route[] = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage),
  },
  {
    path: '',
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.page').then(m => m.DashboardPage),
      },
      {
        path: 'catalog',
        loadChildren: () => import('./pages/catalog/catalog.routes').then(m => m.CATALOG_ROUTES),
      },
      {
        path: 'customers',
        loadChildren: () => import('./pages/customers/customers.routes').then(m => m.CUSTOMERS_ROUTES),
      },
      {
        path: 'orders',
        loadChildren: () => import('./pages/orders/orders.routes').then(m => m.ORDERS_ROUTES),
      },
      {
        path: 'coupons',
        loadChildren: () => import('./pages/coupons/coupons.routes').then(m => m.COUPONS_ROUTES),
      },
      {
        path: 'inventory',
        loadChildren: () => import('./pages/inventory/inventory.routes').then(m => m.INVENTORY_ROUTES),
      },
      {
        path: 'purchasing',
        loadChildren: () => import('./pages/purchasing/purchasing.routes').then(m => m.PURCHASING_ROUTES),
      },
      {
        path: 'delivery',
        loadChildren: () => import('./pages/delivery/delivery.routes').then(m => m.DELIVERY_ROUTES),
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings.page').then(m => m.SettingsPage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
