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
