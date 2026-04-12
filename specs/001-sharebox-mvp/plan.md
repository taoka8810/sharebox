# Implementation Plan: sharebox MVP

**Branch**: `001-sharebox-mvp` | **Date**: 2026-04-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-sharebox-mvp/spec.md`

## Summary

sharebox MVP は、開発者本人のみが利用する個人用マルチデバイス共有 Web アプリで
ある。Google OAuth ホワイトリスト認証 (P1)、テキスト共有、ファイル共有 (画像/動画
プレビュー含む)、URL 共有 (OGP カード) の 4 機能を、統合タイムライン上で時系列管
理する。

技術アプローチは Constitution で固定済みのスタックに準拠する: SvelteKit (Cloudflare
adapter) を Cloudflare Pages にデプロイし、メタデータは D1、ファイル実体は R2
(エグレス無料) に保存する。認証は Arctic を用いた Google OAuth と、Web Crypto API
ベースの自前セッション管理 (lucia-auth.com の最新チュートリアル準拠) で実装する。
すべての動的処理は Cloudflare のエッジランタイム上で完結し、外部 API への依存を
持たない (OGP 取得は Worker 内で fetch + パース)。

## Technical Context

**Language/Version**: TypeScript 5.x (`strict: true`、`noUncheckedIndexedAccess: true`)
**Primary Dependencies**:
  - SvelteKit 2.x + Svelte 5 (runes) + `@sveltejs/adapter-cloudflare`
  - Tailwind CSS v4 (`@tailwindcss/vite`)
  - `arctic` (Google OAuth フロー)
  - `@oslojs/crypto` + `@oslojs/encoding` (セッショントークン生成・ハッシュ)
  - `drizzle-orm` + `drizzle-kit` (D1 用の型付き SQL ビルダーとマイグレーション管理)
  - `node-html-parser` または同等の軽量 HTML パーサ (Workers 互換、OGP 抽出用)
  - `zod` (入力バリデーション)
**Storage**:
  - メタデータ: Cloudflare D1 (SQLite)
  - ファイル実体: Cloudflare R2 (10GB 無料、エグレス料金 0)
  - セッション: D1 の `session` テーブル
**Testing**:
  - ユニット: Vitest (Vite ネイティブ統合、Workers 互換テスト)
  - E2E: Playwright (Chromium / Mobile Safari エミュレーション)
**Target Platform**:
  - 本番ランタイム: Cloudflare Workers (Pages Functions)
  - クライアント: 最新主要ブラウザ (Chrome / Safari / Edge / Firefox、モバイル含む)
**Project Type**: Web application — フロントエンドとサーバーサイドが SvelteKit 単一
  プロジェクト内に同居 (`src/routes/+page.svelte` と `+server.ts`/`+page.server.ts`
  の組み合わせ)。明示的な「frontend / backend」分離は行わない。
**Performance Goals**:
  - LCP < 2.5s, INP < 200ms, CLS < 0.1 (Core Web Vitals "Good")
  - 初期 JS バンドル: route あたり gzip 後 < 50KB を目標
  - タイムライン初回描画: 300ms 以内 (D1 クエリ + SSR)
**Constraints**:
  - 月額コスト 0 円 (Cloudflare 無料枠内)
  - ファイル 1 個あたり 50MB
  - 総ストレージ ~1GB
  - エッジランタイム互換 (Node.js 固有 API 使用不可)
  - 単一ユーザー (マルチテナント設計禁止)
**Scale/Scope**:
  - ユーザー数: 1 (永続的に)
  - 想定エントリ総数: 数千〜1 万件
  - 画面数: 4 (login、timeline、deny、error)
  - コンポーネント数: ~20

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I — Personal Scope & Bounded Feature Set

- ✅ Google OAuth + ホワイトリスト 1 メールで本人以外を排除 (FR-001〜002)
- ✅ 全ページ・全 API を `hooks.server.ts` のグローバルガードで認証必須化 (FR-003)
- ✅ 機能は memo.md 定義の 3 種 + 認証のみ。フォルダ・タグ・検索・共有リンクは
   spec の Scope Out / Assumptions セクションで明示的に除外
- **判定**: 通過

### Principle II — Zero-Cost Operation

- ✅ ホスティング: Cloudflare Pages 無料 (無制限帯域)
- ✅ DB: Cloudflare D1 無料枠 (5GB / 5M reads/day)
- ✅ ストレージ: Cloudflare R2 無料枠 (10GB) — エグレス料金 0
- ✅ ドメイン: `sharebox-***.pages.dev` を使用、独自ドメイン取得しない
- ✅ ファイル上限 50MB / 総量 ~1GB は無料枠内
- ✅ 外部 SaaS 依存なし (OGP 取得は Worker 内で実装)
- **判定**: 通過

### Principle III — Performance First

- ✅ Core Web Vitals 閾値を Performance Goals に明記
- ✅ クライアント側状態管理ライブラリ不採用 (Svelte 5 runes のみ)
- ✅ 全動的処理がエッジ (Workers) で完結、外部オリジンへの往復なし
- ✅ 画像最適化: Cloudflare Images は有料のため、R2 + `srcset` + `loading="lazy"`
   で対応。動画プレビューは `<video preload="metadata">` で初期ロードをブロック
   しない
- ✅ 初期 JS バンドル予算: route あたり 50KB gzip 目標
- **判定**: 通過

### Principle IV — Design System Fidelity

- ✅ Tailwind CSS v4 の `@theme` ブロックで DESIGN.md のトークンを CSS 変数として
   1:1 定義する (Phase 1 で `src/app.css` に集約)
- ✅ Inter フォントを `static/fonts/` で self-host し `@font-face` で読み込む
- ✅ 新規トークン追加が必要になった場合、実装前に DESIGN.md を更新する運用とする
- **判定**: 通過

### Principle V — Quality & Testing Discipline

- ✅ Playwright で US1〜US3 の主要シナリオを E2E 化
- ✅ Vitest でサーバー側ロジック (OGP パーサ、認証ガード、ファイルバリデーション)
   をユニットテスト
- ✅ GitHub Actions で型チェック (`tsc --noEmit`)、Lint (`eslint`)、Vitest、
   Playwright をすべて自動実行
- ✅ デフォルトブランチへのマージは CI 緑が前提
- **判定**: 通過

### Principle VI — Simplicity & YAGNI

- ✅ 抽象化最小: ORM は薄い Drizzle のみ、リポジトリパターン等は導入しない
- ✅ 将来の他ユーザー対応・権限管理・テナント分離の余地を作らない (`user_id`
   カラムも単一値前提だが、外部キー名は付けておく — Rule of Three 違反を避ける
   ため拡張性目的の汎化は行わない)
- ✅ 依存追加は本 plan の Primary Dependencies に列挙したもののみ。それ以外の
   追加は PR で justify が必要
- **判定**: 通過

### Technology Stack (Fixed Constraints)

- ✅ Constitution v1.0.1 で auth 行が「Arctic + `@oslojs/crypto` /
   `@oslojs/encoding` 自前セッション(`lucia-auth.com` 公式チュートリアル準拠)」
   に明示的に更新されたため、本 plan の採用構成と完全に整合する。
- **判定**: 通過

### 総合判定

**全ゲート通過。Phase 0 (Research) に進行可能。**

## Project Structure

### Documentation (this feature)

```text
specs/001-sharebox-mvp/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── http-api.md      # SvelteKit の +server.ts エンドポイント契約
│   └── d1-schema.sql    # D1 マイグレーション初期スキーマ
├── checklists/
│   └── requirements.md  # spec 品質チェックリスト
└── tasks.md             # Phase 2 output (/speckit.tasks で生成)
```

### Source Code (repository root)

```text
.
├── src/
│   ├── app.css                          # Tailwind v4 + DESIGN.md トークン CSS 変数
│   ├── app.html                         # ルート HTML テンプレート
│   ├── app.d.ts                         # SvelteKit/Cloudflare 型定義 (App.Locals 等)
│   ├── hooks.server.ts                  # 全リクエスト共通の認証ガード + セッション解決
│   ├── lib/
│   │   ├── server/
│   │   │   ├── db/
│   │   │   │   ├── client.ts            # Drizzle + D1 binding
│   │   │   │   ├── schema.ts            # users / sessions / share_entries / ...
│   │   │   │   └── migrations/          # drizzle-kit 出力 (D1 適用前提)
│   │   │   ├── auth/
│   │   │   │   ├── google.ts            # Arctic Google プロバイダ初期化
│   │   │   │   ├── session.ts           # generateSessionToken / createSession 等
│   │   │   │   └── whitelist.ts         # 許可メールアドレス照合
│   │   │   ├── storage/
│   │   │   │   └── r2.ts                # R2 binding 経由の put / get / delete
│   │   │   ├── ogp/
│   │   │   │   └── fetcher.ts           # OGP 取得 + パース + キャッシュ
│   │   │   └── validation/
│   │   │       └── schemas.ts           # zod スキーマ (text / file / url 入力)
│   │   └── components/
│   │       ├── timeline/
│   │       │   ├── Timeline.svelte
│   │       │   ├── TextEntry.svelte
│   │       │   ├── FileEntry.svelte
│   │       │   ├── UrlEntry.svelte
│   │       │   └── EntryFilter.svelte
│   │       ├── forms/
│   │       │   ├── TextComposer.svelte
│   │       │   ├── FileUploader.svelte
│   │       │   └── UrlComposer.svelte
│   │       └── ui/                       # Button / Card / Badge 等の DESIGN.md 準拠 UI
│   └── routes/
│       ├── +layout.svelte                # ナビ + DESIGN.md グローバルレイアウト
│       ├── +layout.server.ts             # locals.user の型付き受け渡し
│       ├── +page.svelte                  # タイムライン (認証必須)
│       ├── +page.server.ts               # タイムラインデータ取得 + 各種 form actions
│       ├── login/
│       │   ├── +page.svelte              # ログイン画面
│       │   └── google/
│       │       ├── +server.ts            # /login/google → Google にリダイレクト
│       │       └── callback/
│       │           └── +server.ts        # /login/google/callback OAuth コールバック
│       ├── logout/
│       │   └── +server.ts                # POST /logout
│       ├── denied/
│       │   └── +page.svelte              # ホワイトリスト外用拒否画面
│       └── api/
│           ├── files/
│           │   ├── +server.ts            # POST (アップロード) / DELETE
│           │   └── [id]/
│           │       └── +server.ts        # GET (ダウンロード)
│           ├── entries/
│           │   ├── +server.ts            # GET (一覧) / DELETE 共通
│           │   └── [id]/
│           │       └── +server.ts        # 個別 DELETE
│           └── ogp/
│               └── +server.ts            # POST URL → OGP 取得結果を返す (内部呼出)
├── static/
│   ├── fonts/
│   │   └── Inter/                        # self-host する Inter (woff2)
│   └── icons/                            # ファイルアイコン (lucide 等から事前抽出)
├── tests/
│   ├── unit/
│   │   ├── ogp.test.ts
│   │   ├── whitelist.test.ts
│   │   ├── validation.test.ts
│   │   └── session.test.ts
│   └── e2e/
│       ├── auth.spec.ts
│       ├── text-sharing.spec.ts          # US1
│       ├── file-sharing.spec.ts          # US2
│       └── url-sharing.spec.ts           # US3
├── drizzle.config.ts
├── playwright.config.ts
├── vite.config.ts
├── svelte.config.js
├── tailwind.config.ts                    # Tailwind v4 でも optional だが型補完用
├── tsconfig.json
├── wrangler.toml                         # Cloudflare bindings (D1 / R2 / KV) 定義
├── package.json
└── .github/
    └── workflows/
        └── ci.yml                         # 型チェック + Lint + Vitest + Playwright
```

**Structure Decision**: SvelteKit の標準モノレポ構造を採用 (frontend/backend の分離
なし)。`src/routes/api/` 配下に REST 風の `+server.ts` エンドポイントを置き、ページ
レベルの form actions と併用する。`src/lib/server/` に純粋なサーバーロジック
(DB アクセス、認証、OGP 取得、ストレージ操作) を集約し、E2E と単体テストの両方で
カバーしやすい構造とする。

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| Drizzle ORM 採用 | D1 のスキーマを TypeScript の型で表現し、`drizzle-kit` でマイグレーションを管理することで、生 SQL 文字列散在による実装ミスを防ぐ。依存追加は 2 つ (`drizzle-orm`, `drizzle-kit`) のみで軽量 | 生 SQL は型安全性が無く、テキスト/ファイル/URL の 3 種類のクエリを全て手書きすると Principle VI (シンプルさ) の "重複からの抽象化" 原則を逆に侵害する |

**注**: 当初記録していた「Arctic + Lucia」表記からの auth スタック逸脱は、
Constitution v1.0.1 の PATCH 改訂で表記が更新されたため、もはや逸脱ではない。
