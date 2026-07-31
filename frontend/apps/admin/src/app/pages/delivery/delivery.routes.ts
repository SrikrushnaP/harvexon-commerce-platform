import { Route } from '@angular/router';

export const DELIVERY_ROUTES: Route[] = [
  {
    path: '',
    loadComponent: () => import('./delivery-list.page').then(m => m.DeliveryListPage),
  },
  {
    path: 'staff',
    loadComponent: () => import('./delivery-staff.page').then(m => m.DeliveryStaffPage),
  },
];
