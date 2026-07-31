import { Route } from '@angular/router';

export const CATALOG_ROUTES: Route[] = [
  {
    path: '',
    loadComponent: () => import('./catalog-list.page').then(m => m.CatalogListPage),
  },
  {
    path: 'create',
    loadComponent: () => import('./catalog-form.page').then(m => m.CatalogFormPage),
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./catalog-form.page').then(m => m.CatalogFormPage),
  },
  {
    path: 'categories',
    loadComponent: () => import('./categories.page').then(m => m.CategoriesPage),
  },
  {
    path: 'units',
    loadComponent: () => import('./units.page').then(m => m.UnitsPage),
  },
];
