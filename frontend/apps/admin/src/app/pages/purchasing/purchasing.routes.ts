import { Route } from '@angular/router';

export const PURCHASING_ROUTES: Route[] = [
  {
    path: '',
    loadComponent: () => import('./purchasing-list.page').then(m => m.PurchasingListPage),
  },
  {
    path: 'suppliers',
    loadComponent: () => import('./suppliers.page').then(m => m.SuppliersPage),
  },
  {
    path: 'detail/:id',
    loadComponent: () => import('./purchase-detail.page').then(m => m.PurchaseDetailPage),
  },
];
