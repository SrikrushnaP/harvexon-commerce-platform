import { Route } from '@angular/router';

export const INVENTORY_ROUTES: Route[] = [
  {
    path: '',
    loadComponent: () => import('./inventory-list.page').then(m => m.InventoryListPage),
  },
  {
    path: 'transactions',
    loadComponent: () => import('./inventory-transactions.page').then(m => m.InventoryTransactionsPage),
  },
  {
    path: 'adjust',
    loadComponent: () => import('./inventory-adjust.page').then(m => m.InventoryAdjustPage),
  },
];
