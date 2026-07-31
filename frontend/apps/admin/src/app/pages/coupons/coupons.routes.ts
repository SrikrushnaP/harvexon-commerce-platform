import { Route } from '@angular/router';

export const COUPONS_ROUTES: Route[] = [
  {
    path: '',
    loadComponent: () => import('./coupons-list.page').then(m => m.CouponsListPage),
  },
  {
    path: 'create',
    loadComponent: () => import('./coupon-form.page').then(m => m.CouponFormPage),
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./coupon-form.page').then(m => m.CouponFormPage),
  },
];
