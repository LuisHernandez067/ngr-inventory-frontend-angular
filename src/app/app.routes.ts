import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { publicGuard } from './core/guards/public.guard';

export const routes: Routes = [
  {
    path: 'auth',
    canActivate: [publicGuard],
    loadComponent: () =>
      import('./core/layout/auth-shell/auth-shell.component').then(m => m.AuthShellComponent),
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./pages/auth/login/login.page').then(m => m.LoginPage),
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./pages/auth/forgot-password/forgot-password.page').then(m => m.ForgotPasswordPage),
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./core/layout/app-shell/app-shell.component').then(m => m.AppShellComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.page').then(m => m.DashboardPage),
      },
      {
        path: 'catalog',
        children: [
          {
            path: 'products',
            children: [
              {
                path: '',
                loadComponent: () =>
                  import('./pages/catalog/products/products.page').then(m => m.ProductsPage),
              },
              {
                path: 'new',
                loadComponent: () =>
                  import('./pages/catalog/products/product-form.page').then(m => m.ProductFormPage),
              },
              {
                path: ':id/edit',
                loadComponent: () =>
                  import('./pages/catalog/products/product-form.page').then(m => m.ProductFormPage),
              },
            ],
          },
          {
            path: 'categories',
            children: [
              {
                path: '',
                loadComponent: () =>
                  import('./pages/catalog/categories/categories.page').then(m => m.CategoriesPage),
              },
              {
                path: 'new',
                loadComponent: () =>
                  import('./pages/catalog/categories/category-form.page').then(m => m.CategoryFormPage),
              },
              {
                path: ':id/edit',
                loadComponent: () =>
                  import('./pages/catalog/categories/category-form.page').then(m => m.CategoryFormPage),
              },
            ],
          },
          {
            path: 'suppliers',
            children: [
              {
                path: '',
                loadComponent: () =>
                  import('./pages/catalog/suppliers/suppliers.page').then(m => m.SuppliersPage),
              },
              {
                path: 'new',
                loadComponent: () =>
                  import('./pages/catalog/suppliers/supplier-form.page').then(m => m.SupplierFormPage),
              },
              {
                path: ':id/edit',
                loadComponent: () =>
                  import('./pages/catalog/suppliers/supplier-form.page').then(m => m.SupplierFormPage),
              },
            ],
          },
        ],
      },
      {
        path: 'inventory',
        children: [
          {
            path: 'warehouses',
            children: [
              {
                path: '',
                loadComponent: () =>
                  import('./pages/inventory/warehouses/warehouses.page').then(m => m.WarehousesPage),
              },
              {
                path: 'new',
                loadComponent: () =>
                  import('./pages/inventory/warehouses/warehouse-form.page').then(m => m.WarehouseFormPage),
              },
              {
                path: ':id/edit',
                loadComponent: () =>
                  import('./pages/inventory/warehouses/warehouse-form.page').then(m => m.WarehouseFormPage),
              },
            ],
          },
          {
            path: 'locations',
            children: [
              {
                path: '',
                loadComponent: () =>
                  import('./pages/inventory/locations/locations.page').then(m => m.LocationsPage),
              },
              {
                path: 'new',
                loadComponent: () =>
                  import('./pages/inventory/locations/location-form.page').then(m => m.LocationFormPage),
              },
              {
                path: ':id/edit',
                loadComponent: () =>
                  import('./pages/inventory/locations/location-form.page').then(m => m.LocationFormPage),
              },
            ],
          },
          {
            path: 'movements',
            children: [
              {
                path: '',
                loadComponent: () =>
                  import('./pages/inventory/movements/movements.page').then(m => m.MovementsPage),
              },
              {
                path: 'new',
                loadComponent: () =>
                  import('./pages/inventory/movements/movement-register.page').then(m => m.MovementRegisterPage),
              },
            ],
          },
          {
            path: 'stock',
            children: [
              {
                path: '',
                loadComponent: () =>
                  import('./pages/inventory/stock/stock-current.page').then(m => m.StockCurrentPage),
              },
              {
                path: 'by-location',
                loadComponent: () =>
                  import('./pages/inventory/stock/stock-by-location.page').then(m => m.StockByLocationPage),
              },
            ],
          },
          {
            path: 'kardex',
            loadComponent: () =>
              import('./pages/inventory/kardex/kardex.page').then(m => m.KardexPage),
          },
          {
            path: 'counts',
            children: [
              {
                path: '',
                loadComponent: () =>
                  import('./pages/inventory/counts/counts.page').then(m => m.CountsPage),
              },
              {
                path: 'new',
                loadComponent: () =>
                  import('./pages/inventory/counts/count-create.page').then(m => m.CountCreatePage),
              },
              {
                path: ':id',
                loadComponent: () =>
                  import('./pages/inventory/counts/count-detail.page').then(m => m.CountDetailPage),
              },
              {
                path: ':id/confirm',
                loadComponent: () =>
                  import('./pages/inventory/counts/count-confirm.page').then(m => m.CountConfirmPage),
              },
            ],
          },
        ],
      },
      {
        path: 'admin',
        children: [
          {
            path: 'users',
            children: [
              {
                path: '',
                loadComponent: () =>
                  import('./pages/admin/users/users.page').then(m => m.UsersPage),
              },
              {
                path: 'new',
                loadComponent: () =>
                  import('./pages/admin/users/user-create.page').then(m => m.UserCreatePage),
              },
              {
                path: ':id/edit',
                loadComponent: () =>
                  import('./pages/admin/users/user-edit.page').then(m => m.UserEditPage),
              },
              {
                path: ':id/roles',
                loadComponent: () =>
                  import('./pages/admin/users/user-roles.page').then(m => m.UserRolesPage),
              },
            ],
          },
          {
            path: 'roles',
            children: [
              {
                path: '',
                loadComponent: () =>
                  import('./pages/admin/roles/roles.page').then(m => m.RolesPage),
              },
              {
                path: 'new',
                loadComponent: () =>
                  import('./pages/admin/roles/role-create.page').then(m => m.RoleCreatePage),
              },
              {
                path: ':id/edit',
                loadComponent: () =>
                  import('./pages/admin/roles/role-edit.page').then(m => m.RoleEditPage),
              },
              {
                path: ':id/permissions',
                loadComponent: () =>
                  import('./pages/admin/roles/role-permissions.page').then(m => m.RolePermissionsPage),
              },
            ],
          },
          {
            path: 'permissions',
            children: [
              {
                path: '',
                loadComponent: () =>
                  import('./pages/admin/permissions/permissions.page').then(m => m.PermissionsPage),
              },
            ],
          },
          {
            path: 'audit',
            children: [
              {
                path: '',
                loadComponent: () =>
                  import('./pages/admin/audit/audit-log.page').then(m => m.AuditLogPage),
              },
              {
                path: ':id',
                loadComponent: () =>
                  import('./pages/admin/audit/audit-detail.page').then(m => m.AuditDetailPage),
              },
            ],
          },
        ],
      },
      {
        path: 'reports',
        children: [
          {
            path: 'stock',
            loadComponent: () =>
              import('./pages/reports/report-stock.page').then(m => m.ReportStockPage),
          },
          {
            path: 'movements',
            loadComponent: () =>
              import('./pages/reports/report-movements.page').then(m => m.ReportMovementsPage),
          },
          {
            path: 'kardex',
            loadComponent: () =>
              import('./pages/reports/report-kardex.page').then(m => m.ReportKardexPage),
          },
          {
            path: 'low-stock',
            loadComponent: () =>
              import('./pages/reports/report-low-stock.page').then(m => m.ReportLowStockPage),
          },
        ],
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'forbidden',
    loadComponent: () =>
      import('./pages/auth/forbidden/forbidden.page').then(m => m.ForbiddenPage),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
