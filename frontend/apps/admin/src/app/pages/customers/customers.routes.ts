import { Route } from '@angular/router';

export const CUSTOMERS_ROUTES: Route[] = [
  {
    path: '',
    loadComponent: () => import('./customers-list.page').then(m => m.CustomersListPage),
  },
  {
    path: 'create',
    loadComponent: () => import('./customer-form.page').then(m => m.CustomerFormPage),
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./customer-form.page').then(m => m.CustomerFormPage),
  },
  {
    path: 'detail/:id',
    loadComponent: () => import('./customer-detail.page').then(m => m.CustomerDetailPage),
  },
  {
    path: 'groups',
    loadComponent: () => import('./customer-groups.page').then(m => m.CustomerGroupsPage),
  },
];
