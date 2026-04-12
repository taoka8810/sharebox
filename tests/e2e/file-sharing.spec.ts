import { test, expect } from '@playwright/test';

// US2 file-sharing E2E for the authenticated flow.
//
// Like text-sharing.spec.ts, this suite is gated behind SHAREBOX_E2E_AUTH
// because it needs a real Cloudflare D1 + R2 binding plus a way to seed an
// authenticated session without going through the live Google OAuth flow.
//
// To run them locally:
//   1. pnpm db:migrate:local
//   2. DEV_LOGIN_ENABLED=true pnpm wrangler:dev
//   3. SHAREBOX_E2E_AUTH=1 pnpm test:e2e

test.describe('US2 — authenticated file sharing', () => {
  test.skip(
    !process.env.SHAREBOX_E2E_AUTH,
    'set SHAREBOX_E2E_AUTH=1 with wrangler pages dev to run'
  );

  test('upload a small image and see it appear at the bottom of the timeline', async ({
    page
  }) => {
    await page.goto('/test/login');
    await page.goto('/');
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'ファイルを添付' }).click();
    const chooser = await fileChooserPromise;
    await chooser.setFiles({
      name: 'tiny.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEX/AAAZ4gk3AAAAAXRSTlMAQObYZgAAAApJREFUeJxjYAAAAAIAAUivpHEAAAAASUVORK5CYII=',
        'base64'
      )
    });
    await page.getByText('tiny.png').waitFor({ state: 'visible' });
  });

  test('rejects an oversize file with an error toast', async ({ page }) => {
    await page.goto('/test/login');
    await page.goto('/');
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'ファイルを添付' }).click();
    const chooser = await fileChooserPromise;
    await chooser.setFiles({
      name: 'huge.bin',
      mimeType: 'application/octet-stream',
      // 51 MB of zeros
      buffer: Buffer.alloc(51 * 1024 * 1024, 0)
    });
    await expect(page.getByText('サイズ上限')).toBeVisible();
  });
});
