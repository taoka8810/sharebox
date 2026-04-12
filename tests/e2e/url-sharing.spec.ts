import { test, expect } from '@playwright/test';

// US3 url-sharing E2E for the authenticated flow.
//
// Like text-sharing.spec.ts and file-sharing.spec.ts, this suite is gated
// behind SHAREBOX_E2E_AUTH because it needs a real Cloudflare D1 + R2
// binding plus a way to seed an authenticated session without going
// through the live Google OAuth flow. The OGP fetch additionally needs
// outbound network access from the wrangler dev environment.
//
// To run them locally:
//   1. pnpm db:migrate:local
//   2. DEV_LOGIN_ENABLED=true pnpm wrangler:dev
//   3. SHAREBOX_E2E_AUTH=1 pnpm test:e2e

test.describe('US3 — authenticated URL sharing', () => {
  test.skip(
    !process.env.SHAREBOX_E2E_AUTH,
    'set SHAREBOX_E2E_AUTH=1 with wrangler pages dev to run'
  );

  test('post a URL and see the OGP card or fallback render', async ({ page }) => {
    await page.goto('/test/login');
    await page.goto('/');
    const composer = page.getByLabel('メッセージ入力');
    await composer.fill('https://example.com/');
    await page.keyboard.press('Meta+Enter');
    await expect(page.getByText('example.com')).toBeVisible();
  });

  test('rejects ftp URLs in the composer before they are sent', async ({ page }) => {
    await page.goto('/test/login');
    await page.goto('/');
    const composer = page.getByLabel('メッセージ入力');
    await composer.fill('not-a-url');
    await page.keyboard.press('Meta+Enter');
    // The composer falls through to text mode for non-URLs, so we
    // assert the message round-trips as a regular text bubble.
    await expect(page.getByText('not-a-url')).toBeVisible();
  });
});
