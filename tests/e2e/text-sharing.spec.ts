import { test } from '@playwright/test';

// US1 text-sharing E2E for the authenticated flow.
//
// These specs need a real Cloudflare binding (D1 + R2) plus a way to seed an
// authenticated session without going through the live Google OAuth flow.
// They are deliberately gated behind the SHAREBOX_E2E_AUTH environment
// variable so the default `pnpm test:e2e` (running against `vite dev`) does
// not fail in the absence of those bindings.
//
// To run them locally:
//   1. Apply the migration to the local D1 mirror:
//        pnpm db:migrate:local
//   2. Start the wrangler-backed dev server with a dev login override:
//        DEV_LOGIN_ENABLED=true pnpm wrangler:dev
//   3. Run the suite:
//        SHAREBOX_E2E_AUTH=1 pnpm test:e2e
//
// The DEV_LOGIN_ENABLED helper route and the per-test seeding helpers will
// be added in a future revision; for now this file documents the intended
// shape of the verification steps so the SC-006 success criterion has a
// concrete target.

test.describe('US1 — authenticated text sharing', () => {
  test.skip(
    !process.env.SHAREBOX_E2E_AUTH,
    'set SHAREBOX_E2E_AUTH=1 with wrangler pages dev to run'
  );

  test('post a text message and see it appear at the bottom of the timeline', async ({ page }) => {
    await page.goto('/test/login');
    await page.goto('/');
    const composer = page.getByLabel('メッセージ入力');
    await composer.fill('hello sharebox');
    await page.keyboard.press('Meta+Enter');
    await page.waitForTimeout(300);
    await page.getByText('hello sharebox').waitFor({ state: 'visible' });
  });

  test('the most recent post can be deleted via the trash button', async ({ page }) => {
    await page.goto('/test/login');
    await page.goto('/');
    const composer = page.getByLabel('メッセージ入力');
    await composer.fill('to-be-deleted');
    await page.keyboard.press('Meta+Enter');
    await page.getByText('to-be-deleted').waitFor({ state: 'visible' });

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByText('to-be-deleted').hover();
    await page.getByRole('button', { name: '削除' }).last().click();
    await page.getByText('to-be-deleted').waitFor({ state: 'hidden' });
  });
});
