import { test, expect } from '@playwright/test';

test.describe('Login flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Contraseña')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ingresar' })).toBeVisible();
  });

  test('should show validation errors on empty submit', async ({ page }) => {
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page.getByText('El email es requerido')).toBeVisible();
    await expect(page.getByText('La contraseña es requerida')).toBeVisible();
  });

  test('should show email format error for invalid email', async ({ page }) => {
    await page.getByLabel('Email').fill('notanemail');
    await page.getByLabel('Contraseña').fill('somepassword');
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page.getByText('Ingresá un email válido')).toBeVisible();
  });

  test('should show session expired banner when redirected with reason=session-expired', async ({ page }) => {
    await page.goto('/auth/login?reason=session-expired');
    await expect(page.getByText('Tu sesión expiró. Ingresá nuevamente.')).toBeVisible();
  });

  test('should have link to forgot-password page', async ({ page }) => {
    await expect(page.getByRole('link', { name: '¿Olvidaste tu contraseña?' })).toBeVisible();
  });
});

test.describe('Forgot password flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/forgot-password');
  });

  test('should display forgot password form', async ({ page }) => {
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enviar instrucciones' })).toBeVisible();
  });

  test('should show validation error on empty submit', async ({ page }) => {
    await page.getByRole('button', { name: 'Enviar instrucciones' }).click();
    await expect(page.getByText('El email es requerido')).toBeVisible();
  });
});
