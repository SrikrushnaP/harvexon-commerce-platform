import { Route } from '@angular/router';

export const ORDERS_ROUTES: Route[] = [
  {
    path: '',
    loadComponent: () => import('./orders-list.page').then(m => m.OrdersListPage),
  },
  {
    path: 'detail/:id',
    loadComponent: () => import('./order-detail.page').then(m => m.OrderDetailPage),
  },
];
