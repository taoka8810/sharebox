# sharebox

Personal multi-device sharing box. A single-owner web app for sending text,
files, and URLs between your own devices, built on Cloudflare Pages +
SvelteKit + D1 + R2 with Google OAuth (whitelist).

This is a private project — there is no multi-tenant story and no public
sharing. The constitution, technical plan, and runbook all live under
[`specs/001-sharebox-mvp/`](specs/001-sharebox-mvp/).

## Quick links

- **[Constitution](.specify/memory/constitution.md)** — non-negotiable
  principles and the fixed technology stack
- **[Specification](specs/001-sharebox-mvp/spec.md)** — what the MVP does
- **[Implementation plan](specs/001-sharebox-mvp/plan.md)** — how it is built
- **[Quickstart runbook](specs/001-sharebox-mvp/quickstart.md)** — local
  setup, Cloudflare resource provisioning, deploy procedure, smoke test

## Local development

```bash
pnpm install
pnpm dev          # Vite dev server (no Cloudflare bindings)
pnpm wrangler:dev # wrangler pages dev (D1 + R2 mirror, real OAuth flow)
```

## Quality gates

```bash
pnpm check        # TypeScript strict + svelte-check
pnpm lint         # Prettier check + ESLint
pnpm test:unit    # Vitest
pnpm test:e2e     # Playwright (Chromium + Mobile WebKit)
```

CI runs all four on every push to `main` and on every pull request.

## Deployment

Production runs on Cloudflare Pages at a `*.pages.dev` subdomain. See the
[quickstart runbook](specs/001-sharebox-mvp/quickstart.md) for the exact
binding, secret, and OAuth client setup.

> Production URL: _to be filled in after the first deploy._
