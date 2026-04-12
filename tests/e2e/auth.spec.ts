import { expect, test } from '@playwright/test';

// These auth-page tests work against `vite dev` because the public routes
// (/login, /denied) and the global redirect for unauthenticated users are
// fully exercised without needing a Cloudflare D1 / R2 binding.

test.describe('public auth pages', () => {
  test('the root path redirects an unauthenticated visitor to /login', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.url()).toContain('/login');
    await expect(page.getByRole('button', { name: 'Google でログイン' })).toBeVisible();
  });

  test('the login page renders the sharebox hero and the Google CTA', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'sharebox' })).toBeVisible();
    await expect(page.getByText('自分のデバイス間で')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Google でログイン' })).toBeVisible();
    await expect(page.getByText('ホワイトリストに登録された')).toBeVisible();
  });

  test('the denied page renders the rejection message and a return link', async ({ page }) => {
    await page.goto('/denied');
    await expect(page.getByRole('heading', { name: 'アクセスが拒否されました' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'ログイン画面に戻る' })).toBeVisible();
  });

  test('an unauthenticated POST to a private API returns 401 JSON', async ({ request }) => {
    const res = await request.post('/api/entries/text', {
      data: { body: 'should not work' }
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error?.code).toBe('unauthorized');
  });
});
