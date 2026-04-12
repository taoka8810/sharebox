# Quickstart — sharebox MVP

**Date**: 2026-04-12
**Branch**: `001-sharebox-mvp`
**Audience**: 開発者本人 (実装フェーズで Claude Code が使用)

このドキュメントは sharebox の開発環境セットアップと、本番デプロイまでの最短
手順を記述する。`/speckit.implement` 完了後、本人がローカルで動作確認 → 本番
デプロイするまでの runbook として使う。

---

## 前提

- macOS / Linux / WSL2
- Node.js 22 LTS 以上 (Cloudflare Workers ランタイムと整合)
- pnpm 9.x (推奨パッケージマネージャ)
- Cloudflare アカウント (無料)
- Google Cloud アカウント (OAuth クライアント発行用)
- GitHub アカウント (Cloudflare Pages 連携用)

---

## 1. リポジトリ準備

```bash
git checkout 001-sharebox-mvp
pnpm install
```

---

## 2. Cloudflare リソース作成

```bash
# 1. Cloudflare にログイン (ブラウザが開く)
pnpm wrangler login

# 2. D1 データベース作成
pnpm wrangler d1 create sharebox-db
# 出力された database_id を wrangler.toml に貼り付ける

# 3. R2 バケット作成
pnpm wrangler r2 bucket create sharebox-files

# 4. 初期マイグレーション適用 (ローカル)
pnpm wrangler d1 migrations apply sharebox-db --local

# 5. 初期マイグレーション適用 (本番)
pnpm wrangler d1 migrations apply sharebox-db --remote
```

---

## 3. Google OAuth クライアント発行

1. <https://console.cloud.google.com/> にログイン
2. 新規プロジェクト「sharebox」作成
3. **APIs & Services → Credentials → Create OAuth client ID**
   - Application type: Web application
   - Name: `sharebox-dev` と `sharebox-prod` の 2 つを発行
4. 各クライアントの Authorized redirect URIs を設定:
   - dev: `http://localhost:8788/login/google/callback`
   - prod: `https://<your-pages-domain>.pages.dev/login/google/callback`
5. 各クライアントの `client_id` / `client_secret` を控える

---

## 4. シークレットと環境変数

ローカル開発用 `.dev.vars` (gitignore 済み):

```dotenv
GOOGLE_CLIENT_ID=xxx-dev.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
OWNER_EMAIL=you@example.com
SESSION_COOKIE_SECURE=false
```

本番用シークレット (Wrangler 経由で Cloudflare に登録):

```bash
pnpm wrangler pages secret put GOOGLE_CLIENT_ID
pnpm wrangler pages secret put GOOGLE_CLIENT_SECRET
pnpm wrangler pages secret put OWNER_EMAIL
```

`SESSION_COOKIE_SECURE` は本番で `true`、開発で `false`。

---

## 5. ローカル開発起動

```bash
# Vite 開発サーバー (HMR、Cloudflare バインディング無し)
pnpm dev

# Cloudflare Pages エミュレータ (D1 / R2 / secrets を本物に近い形で動かす)
pnpm wrangler pages dev .svelte-kit/cloudflare \
  --d1=DB=sharebox-db \
  --r2=FILES=sharebox-files
```

OAuth フロー含む完全な動作確認は `wrangler pages dev` で行う。

---

## 6. テスト実行

```bash
# 型チェック
pnpm check

# Lint
pnpm lint

# ユニットテスト
pnpm test:unit

# E2E (Chromium + Mobile WebKit)
pnpm test:e2e
```

CI では上記をすべて順次実行する (`.github/workflows/ci.yml`)。

---

## 7. 本番デプロイ

GitHub に push すると Cloudflare Pages が `main` ブランチを自動デプロイする。
初回のみ Cloudflare ダッシュボードで Pages プロジェクト作成と GitHub 連携を
行う必要がある:

1. Cloudflare ダッシュボード → **Workers & Pages → Create application → Pages**
2. Connect to Git → リポジトリを選択
3. ビルド設定:
   - Framework preset: `SvelteKit`
   - Build command: `pnpm build`
   - Build output directory: `.svelte-kit/cloudflare`
4. **Settings → Functions → D1 database bindings**: `DB` → `sharebox-db`
5. **Settings → Functions → R2 bucket bindings**: `FILES` → `sharebox-files`
6. 環境変数 / シークレットを設定 (前述の `pnpm wrangler pages secret put` で
   登録済みのものに加えて、`SESSION_COOKIE_SECURE=true` を環境変数として設定)
7. デプロイ実行

デプロイ完了後、`https://sharebox-***.pages.dev` でアクセスできる。Google OAuth
クライアントの redirect URI にこのドメインを登録するのを忘れないこと。

---

## 8. スモークテスト (本人がデプロイ後に手動で確認)

US1 (P1) を本人のメールアドレスで実施:

1. 未ログイン状態で `https://sharebox-***.pages.dev` にアクセス → `/login`
   へリダイレクトされる
2. 「Google でログイン」を押下 → Google OAuth → タイムライン画面に遷移
3. テキストを 1 件投稿 → タイムラインに即時表示
4. スマホで同じ URL にアクセス → 同じテキストが表示される
5. クリップボードアイコンをタップ → コピー成功フィードバック
6. 投稿を削除 → タイムラインから消える、リロードしても復活しない
7. 別の Google アカウント (ホワイトリスト外) でログイン試行 → `/denied`

US2 / US3 も同様に手動確認 (サイズ上限テスト用に 51MB のファイルを用意して
413 エラーが返ることも確認)。

---

## トラブルシューティング

| 症状                                      | 原因 / 対処                                                                       |
| ----------------------------------------- | --------------------------------------------------------------------------------- |
| OAuth コールバックで 400                  | redirect URI が Google Cloud Console と一致しているか確認                         |
| ホワイトリスト外で `/denied` に行かず 500 | `OWNER_EMAIL` シークレットが未登録                                                |
| ファイルアップロードで 500                | R2 バインディング (`FILES`) が Pages 側で設定されているか                         |
| ローカルでログイン後すぐログアウト状態    | `SESSION_COOKIE_SECURE=true` のまま `http://localhost` にアクセスしている         |
| `wrangler d1 migrations apply` が空       | マイグレーションファイルが `src/lib/server/db/migrations/` に commit されているか |
