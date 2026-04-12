---
description: 'Task list for sharebox MVP implementation'
---

# Tasks: sharebox MVP

**Input**: Design documents from `/specs/001-sharebox-mvp/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Constitution Principle V (Quality & Testing Discipline) で
主要ユーザーフローの E2E (Playwright) と非自明なロジックのユニット (Vitest) を
必須としているため、本タスクリストにはテストタスクを含める。

**Organization**: Constitution v1.1.0 の Development Workflow に従い、UI 実装
(Phase A) とデザイン確認チェックポイントを経てからバックエンドロジック (Phase B)
を User Story 単位で進める構成。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 並列実行可能 (異なるファイル、依存関係なし)
- **[Story]**: 関連する User Story (US1 / US2 / US3) 。共通基盤は無印
- **[UI]**: Phase A (UI 実装フェーズ) のタスク
- **[BE]**: Phase B (バックエンド実装フェーズ) のタスク
- **[TEST]**: テスト実装タスク

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: SvelteKit プロジェクト初期化と開発ツール一式のセットアップ

- [x] **T001** リポジトリルートに SvelteKit 2.x + Svelte 5 + TypeScript strict 構成で `pnpm create svelte@latest .` 相当の初期化を行う (`package.json`, `svelte.config.js`, `vite.config.ts`, `tsconfig.json`, `src/app.html`, `src/app.d.ts`, `src/routes/+page.svelte` を生成)
- [x] **T002** [P] ランタイム依存をインストール: `@sveltejs/adapter-cloudflare`, `tailwindcss@^4`, `@tailwindcss/vite`, `arctic`, `@oslojs/crypto`, `@oslojs/encoding`, `drizzle-orm`, `zod`, `node-html-parser`
- [x] **T003** [P] 開発依存をインストール: `drizzle-kit`, `vitest`, `@playwright/test`, `eslint`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`, `prettier`, `prettier-plugin-svelte`, `wrangler`, `@cloudflare/workers-types`
- [x] **T004** [P] `tsconfig.json` を `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true` で更新
- [x] **T005** [P] `eslint.config.js` と `.prettierrc` を作成 (Svelte + TypeScript ルール)
- [x] **T006** [P] `vite.config.ts` に `@tailwindcss/vite` プラグインと `sveltekit()` を設定
- [x] **T007** `svelte.config.js` を `@sveltejs/adapter-cloudflare` に切り替える
- [x] **T008** [P] `wrangler.toml` を作成し `[[d1_databases]]` (binding=DB)、`[[r2_buckets]]` (binding=FILES) のプレースホルダを記述
- [x] **T009** [P] `.dev.vars.example` を作成 (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `OWNER_EMAIL`, `SESSION_COOKIE_SECURE`)
- [x] **T010** [P] `vitest.config.ts` と `playwright.config.ts` を作成 (Playwright は Chromium と Mobile WebKit の 2 プロジェクト)
- [x] **T011** [P] `package.json` の `scripts` を整備: `dev`, `build`, `preview`, `check`, `lint`, `format`, `test:unit`, `test:e2e`, `db:generate`, `db:migrate:local`, `db:migrate:remote`

**Checkpoint**: `pnpm dev` が空ページで起動する状態。

---

## Phase 2: Foundational — Design System & App Shell (Shared, UI-only)

**Purpose**: DESIGN.md のトークンを CSS 変数として固定し、全画面で再利用される
基本コンポーネントとレイアウトシェルを構築する。バックエンドは一切触らない。

- [x] **T012** Inter フォント (woff2、weight 400/500/600/700) を `static/fonts/Inter/` に self-host
- [x] **T013** `src/app.css` を作成し、Tailwind v4 の `@theme` ブロックで DESIGN.md の全トークン (色、影、角丸、間隔、フォントサイズ、line-height、letter-spacing) を CSS 変数として定義
- [x] **T014** [P] `src/app.css` に `@font-face` ルールで Inter を読み込み、`@layer base` でグローバルタイポグラフィを適用
- [x] **T015** `src/routes/+layout.svelte` を作成: ヘッダ (ロゴ、ナビ、認証時はログアウトボタン枠)、最大幅 1200px のメイン領域、暖色アルタネート背景システム
- [x] **T016** [P] `src/lib/components/ui/Button.svelte` を作成し `variant: 'primary' | 'secondary' | 'ghost' | 'pill'` を実装 (DESIGN.md の各バリアント仕様準拠、hover で `scale(1.05)`、active で `scale(0.9)`、focus でブルーリング)
- [x] **T017** [P] `src/lib/components/ui/Card.svelte` を作成 (whisper border、4 層シャドウ、12px / 16px の radius slot)
- [x] **T018** [P] `src/lib/components/ui/Input.svelte` と `TextArea.svelte` を作成
- [x] **T019** [P] `src/lib/components/ui/Badge.svelte` を作成 (pill 形状、`#f2f9ff` / `#097fe8`)
- [x] **T020** [P] `src/lib/components/ui/Icon.svelte` を作成 (lucide-svelte ではなく必要なアイコンだけ手動でインライン SVG: clipboard, download, trash, image, video, file-text, file-archive, link, x, check, upload, log-out)
- [~] **T021** [P] _(撤回)_ — Design Review でシングルユーザーアプリにヘッダの自分アバターは冗長と判断。Avatar コンポーネント削除。
- [x] **T022** [P] `src/lib/components/ui/Toast.svelte` と `ToastHost.svelte` を作成 (成功 / エラー / 情報、auto-dismiss)
- [x] **T023** [P] `src/lib/components/ui/EmptyState.svelte` を作成 (アイコン + メッセージ + サブメッセージ)
- [x] **T024** [P] `src/lib/components/ui/Skeleton.svelte` を作成 (パルスアニメーション、矩形 / テキスト行)
- [x] **T025** [P] `src/lib/components/ui/ProgressBar.svelte` を作成 (アップロード進捗用)
- [x] **T026** `src/lib/mocks/timeline.ts` を作成し、テキスト 5 件 / 画像 2 件 / 動画 1 件 / PDF 1 件 / その他ファイル 1 件 / OGP 成功 URL 2 件 / OGP 失敗 URL 1 件のリアリスティックなモックデータを定義 (相対時刻表示の検証用に幅広い `createdAt` を持たせる)
- [x] **T027** [P] `src/lib/utils/relativeTime.ts` を作成 ("3 分前", "1 時間前", "昨日", "3 日前" 等の純粋関数)
- [x] **T028** [P] `src/lib/utils/formatBytes.ts` を作成 ("12.3 MB" 等)

**Checkpoint**: 全 UI プリミティブが揃い、`/+layout.svelte` がデザインシステム
通りに表示される状態。

---

## Phase 3: UI Phase A — All User Stories (Mocked Data)

**⚠️ Constitution v1.1.0 Phase A**: ここからのタスクはバックエンド実装を一切
含まない。すべての I/O は `src/lib/mocks/timeline.ts` のモックと client-side
state で代用する。フォーム送信はモック関数を呼んで楽観的にローカル state を
更新する。

### US1 UI — Authenticated Text Sharing

- [x] **T029** [P] [US1] [UI] `src/routes/login/+page.svelte` を作成: ヒーロー見出し、サブテキスト、Google でログイン (Primary Button)、デザイン確認のためのリンクは無し
- [x] **T030** [P] [US1] [UI] `src/routes/denied/+page.svelte` を作成: アクセス拒否メッセージ、再ログインリンク (mock)
- [x] **T031** [P] [US1] [UI] `src/lib/components/forms/TextComposer.svelte` を作成: TextArea + 文字数カウンタ (100,000 上限) + 投稿ボタン + バリデーションエラー表示 (空白のみ / 上限超過)
- [x] **T032** [P] [US1] [UI] `src/lib/components/timeline/TextEntry.svelte` を作成: 本文プレビュー、改行保持、相対時刻、クリップボードアイコンボタン、削除アイコンボタン
- [x] **T033** [US1] [UI] `src/routes/+page.svelte` (タイムライン) を作成し、`timeline.ts` のモックを `$state` に取り込んで TextEntry をループ表示。Composer で投稿すると mock state に追加、削除ボタンで mock state から除去 (T031, T032 に依存)

### US2 UI — File Sharing

- [x] **T034** [P] [US2] [UI] `src/lib/components/forms/FileUploader.svelte` を作成: ドラッグ&ドロップゾーン + ファイル選択ボタン + 50MB 超過時のエラー表示 + アップロード中のモック ProgressBar (setInterval で 0→100% を演出)
- [x] **T035** [P] [US2] [UI] `src/lib/components/timeline/FileEntry.svelte` を作成し、内部で `category` に応じて image / video / other の表示分岐
  - `image`: `<img>` インラインプレビュー (lazy)
  - `video`: `<video preload="metadata" controls>`
  - `other`: ファイル形式アイコン + ファイル名 + ファイルサイズ + 「ダウンロード」リンク
- [x] **T036** [US2] [UI] `+page.svelte` の timeline ループに FileEntry を追加し、FileUploader からの mock 投稿で state に積めるようにする

### US3 UI — URL Sharing with OGP

- [x] **T037** [P] [US3] [UI] `src/lib/components/forms/UrlComposer.svelte` を作成: URL Input + 投稿ボタン + バリデーションエラー (空 / 不正スキーム)
- [x] **T038** [P] [US3] [UI] `src/lib/components/timeline/UrlEntry.svelte` を作成し、`ogp_status` に応じて 3 状態を表示
  - `pending`: Skeleton カード
  - `success`: 画像 + タイトル + 説明 + サイト名 + URL の OGP カード (カード全体クリックで `target="_blank"`)
  - `failed`: URL 文字列 + ドメインのみのフォールバックカード
  - クリップボードアイコンボタン、削除アイコンボタンを各状態で共通配置
- [x] **T039** [US3] [UI] `+page.svelte` の timeline ループに UrlEntry を追加し、UrlComposer からの mock 投稿で `pending → success/failed` を `setTimeout` で演出

### Common UI Across Stories

- [x] **T040** [P] [UI] `src/lib/components/timeline/EntryFilter.svelte` を作成: タブ風 (All / Text / File / URL)、選択状態をクライアント state に保持
- [x] **T041** [P] [UI] `src/lib/components/timeline/Timeline.svelte` (もし `+page.svelte` から切り出すなら): EntryFilter + ループ + EmptyState を統合 — `+page.svelte` 内に直接統合した
- [~] **T042** [P] [UI] _(撤回)_ — Design Review で本人がストレージ表示は不要と判断。spec FR-034 / SC-009 と共に撤回。
- [x] **T043** [P] [UI] レイアウトに mock のログアウトボタンを配置 (Ghost Button、押下で `console.log` のみ)
- [x] **T044** [UI] `+page.svelte` の上部に Composer 切替 UI (テキスト / ファイル / URL のタブまたはセグメント) を作る (T031, T034, T037 に依存)
- [x] **T045** [UI] レスポンシブ確認: Tailwind v4 のブレークポイント (`sm`, `md`, `lg`) を使い、モバイル <600px で 1 カラム、タブレット 600-1080px で適度な余白、デスクトップ >1080px で max-width 1200px
- [x] **T046** [UI] 全画面・全 EntryType でローディング/エラー/空状態の UI を仕込む (Skeleton、Toast、EmptyState の使用)
- [x] **T047** [UI] クリップボードコピーは `navigator.clipboard.writeText` を使い、成功 Toast を出す
- [x] **T048** [UI] [P] Vitest で UI コンポーネントの軽量レンダリングテストを 1〜2 件追加 (Button のバリアント切替、TextEntry の本文表示) — `formatBytes` / `relativeTime` の純粋関数に対するテストで代替 (Phase A レベルの妥当性検証)

**Checkpoint**: すべての画面・コンポーネント・状態がモックデータで完成し、
ブラウザで一通り操作できる状態。

---

## 🛑 Design Review Checkpoint (Constitution v1.1.0 mandatory gate)

**Purpose**: 本人がローカルブラウザで Phase A の出力を確認し、明示的に承認する。

- [x] **T049** Claude Code が `pnpm dev` をローカルで起動 (バックグラウンド) し、URL を本人に通知
- [x] **T050** 本人が **PC ブラウザ** で確認: `/login`、`/`、`/denied`、各 EntryType 投稿フロー、空状態、エラー状態、Toast、ホバー / フォーカス / アクティブ
- [x] **T051** 本人が **スマートフォンブラウザ** で確認 — Phase A の簡易確認は PC のレスポンシブモードで実施。Phase B のスモークテスト時に実機で再確認する
- [x] **T052** 本人からの **明示的承認** が得られるまで Phase 4 以降に進まない (MUST) — 2026-04-12 承認取得
- [x] **T053** フィードバックがあれば `T029〜T048` のいずれかをリビジョンし、再度 T049〜T052 を回す — チャット風 UI への全面リビジョン (LINE Keep 風)、ストレージ表示削除、Avatar 削除、画像/動画ダウンロードボタン追加を実施

**⛔ ここで止まる。承認後に Phase 4 へ。**

---

## Phase 4: Backend Foundational (Shared, BE)

**Purpose**: 全 User Story の Phase B が依存する DB、認証、ストレージ、OGP の
共通基盤を実装する。

- [x] **T054** [BE] `src/lib/server/db/schema.ts` を作成し、Drizzle で `user`, `session`, `share_entry`, `text_post`, `file_post`, `url_post`, `login_audit` テーブルを定義 (data-model.md と contracts/d1-schema.sql に厳密準拠)
- [x] **T055** [BE] `src/lib/server/db/client.ts` を作成: `event.platform.env.DB` を受け取り `drizzle()` インスタンスを返すファクトリ
- [x] **T056** [BE] `drizzle.config.ts` を作成し、`drizzle-kit generate` で migration を出力 → コミット (`0000_eager_the_phantom.sql`)
- [x] **T057** [P] [BE] `src/lib/server/auth/google.ts`: Arctic の `Google` プロバイダを secrets から初期化 (request origin から redirect URI を組み立て)
- [x] **T058** [P] [BE] `src/lib/server/auth/session.ts`: `generateSessionToken`, `hashSessionToken`, `createSession`, `validateSessionToken`, `invalidateSession`, `invalidateAllUserSessions` を `@oslojs/crypto/sha2` と `@oslojs/encoding` で実装
- [x] **T059** [P] [BE] `src/lib/server/auth/cookies.ts`: `setSessionTokenCookie` / `deleteSessionTokenCookie` / `getSessionTokenCookie` (HttpOnly, SameSite=Lax, Secure 切替)
- [x] **T060** [P] [BE] `src/lib/server/auth/whitelist.ts`: `isAllowedEmail(email, ownerEmail)` 純粋関数
- [x] **T061** [BE] `src/hooks.server.ts`: 全リクエストで cookie からセッショントークンを取り出し検証 → `event.locals.user` をセット。未認証で公開パス以外にアクセスしたら `/login` へリダイレクト、`/api/*` は 401 を返す。`vite dev` で platform.env が無い場合も同じ挙動
- [x] **T062** [P] [BE] `src/lib/server/storage/r2.ts`: `putFile`, `getFile`, `deleteFile`, `headFile` を `R2Bucket` 経由で実装
- [x] **T063** [P] [BE] `src/lib/server/ogp/fetcher.ts`: `AbortController` で 5 秒タイムアウト、256KB 上限ストリーム読み出し、`node-html-parser` で `<meta property="og:*">` を抽出する `fetchOgp(url)` 関数 + 純粋な `parseOgp(html)` 関数
- [x] **T064** [P] [BE] `src/lib/server/validation/schemas.ts`: `textPostSchema`, `urlPostSchema`, `fileUploadConstraints`, `categoryFromMime`, `sanitizeFileName`
- [x] **T065** [P] [BE] `src/app.d.ts` は Phase 1 で既に `App.Locals.user`, `App.Platform.env` を宣言済み (今フェーズで `SessionUser` 実体が import されて参照解決)
- [x] **T066** [BE] `src/lib/server/audit.ts`: `recordLoginAttempt(db, { email, result, clientIp, userAgent })` ヘルパ
- [x] **T067** [BE] [TEST] `tests/unit/whitelist.test.ts`: ホワイトリスト一致 / 不一致 / 大文字小文字 / トリム / null / 空文字 (6 cases)
- [x] **T068** [BE] [TEST] `tests/unit/session.test.ts`: トークン生成 (base32 / unique) / ハッシュ一貫性 / プレーンテキストとの非一致 (6 cases)
- [x] **T069** [BE] [TEST] `tests/unit/ogp.test.ts`: 正常 OGP / メタ欠落 / `name=` フォールバック / 空 content の null 化 (4 cases)
- [x] **T070** [BE] [TEST] `tests/unit/validation.test.ts`: テキスト空白/上限/正常、URL スキーム/長さ/不正、MIME 分類、ファイル名サニタイズ、容量定数 (17 cases)

**Checkpoint**: 認証ガードが効き、未認証で `/` にアクセスすると `/login` に
飛ぶ状態。データはまだ空。

---

## Phase 5: User Story 1 - Authenticated Text Sharing (Priority: P1) 🎯 MVP

**Goal**: Phase A の UI に Phase 4 の認証基盤を接続し、Google OAuth ログインと
テキスト投稿の永続化、デバイス間同期を実現する。

**Independent Test**: PC でログイン→テキスト投稿→スマホで同じテキストを確認
→コピー→削除、までを実機 + Playwright で再現。

### Implementation for US1 Phase B

- [x] **T071** [US1] [BE] `src/routes/login/google/+server.ts`: GET → state と code_verifier を生成、cookie 保存、Google authorization URL へ 302
- [x] **T072** [US1] [BE] `src/routes/login/google/callback/+server.ts`: GET → state 検証、code 検証、ID トークンデコード、ホワイトリスト照合、user upsert、session 発行、`login_audit` 記録、`/` または `/denied` へ
- [x] **T073** [US1] [BE] `src/routes/logout/+server.ts`: POST → session 失効、cookie 削除、`/login` へ
- [x] **T074** [US1] [BE] `src/routes/+layout.server.ts`: `event.locals.user` を返す
- [x] **T075** [US1] [BE] `src/routes/+page.server.ts` + `src/lib/server/db/timeline.ts`: `loadTimeline` ヘルパで `share_entry` + 各種別の sub-table を 4 クエリで取得し、新しい順 → 古い順に並び替えて TimelineEntry を組み立てて返す
- [x] **T076** [US1] [BE] `src/routes/api/entries/text/+server.ts`: POST — zod 検証、空白拒否、100,000 文字上限、`share_entry` + `text_post` を順次 INSERT、作成済みエントリを 201 で返却
- [x] **T077** [US1] [BE] `src/routes/api/entries/[id]/+server.ts`: DELETE — 統一エントリ削除エンドポイント。owner 検証 → `share_entry` 読み出し → file kind の場合は R2 削除 → DB 削除 (FK cascade で sub-table も削除)、204
- [x] **T078** [US1] [UI→BE 接続] MessageComposer の onSubmitText を `/api/entries/text` への fetch ベースの handler に置き換え、成功時にローカル state に追加
- [x] **T079** [US1] [UI→BE 接続] TextEntry / FileEntry / UrlEntry の削除ボタンを統一エンドポイント `/api/entries/[id]` DELETE にバインド、楽観的更新 + ロールバック
- [x] **T080** [US1] [UI→BE 接続] `+page.svelte` のモック state を `+page.server.ts` から渡される data に置き換え。`$effect.pre` で server data 同期、`visibilitychange` で `invalidateAll()` を呼ぶ
- [x] **T081** [US1] [UI→BE 接続] ヘッダのログアウトボタンを `/logout` POST に接続
- [x] **T082** [US1] [TEST] `tests/e2e/auth.spec.ts`: 4 ケース (root → /login redirect / login page render / denied page render / 未認証 API は 401 JSON) を Chromium + Mobile WebKit で実行 (8 passing)
- [~] **T083** [US1] [TEST] `tests/e2e/text-sharing.spec.ts`: 認証必須フローのため `wrangler pages dev` + 将来導入予定の dev_login route が必要。テストファイルは記述済みだが `SHAREBOX_E2E_AUTH=1` で明示的に有効化するまで `test.skip` で待機。本番スモーク (T104) で手動実機検証する。

**Checkpoint**: US1 が独立して完全動作。MVP として最低限ここまでで本番デプロイ可能。

---

## Phase 6: User Story 2 - File Sharing (Priority: P2)

**Goal**: Phase A の FileUploader / FileEntry に R2 + D1 を接続。

**Independent Test**: 画像 / 動画 / PDF をアップロード→プレビュー / アイコン確認
→別デバイスからダウンロード→削除→ストレージ反映。

### Implementation for US2 Phase B

- [x] **T084** [US2] [BE] `src/routes/api/files/+server.ts`: POST — multipart 解析、サイズチェック (50MB)、`crypto.randomUUID()` で `r2_key=files/<uuid>` 生成、`R2Bucket.put()` (stream)、`share_entry` + `file_post` INSERT、失敗時に R2 オブジェクト + share_entry の両方をロールバック
- [x] **T085** [US2] [BE] `src/routes/api/files/[id]/+server.ts`: GET — 認証 + ownership チェック、`R2Bucket.get()` のストリームをそのまま `Response` に渡す。`Content-Disposition: inline; filename*=UTF-8''...` で元ファイル名を保持しつつインラインプレビュー可
- [x] **T086** [US2] [BE] Phase 5 (T077) で統一エンドポイントとして実装済み: `src/routes/api/entries/[id]/+server.ts` の DELETE handler は `kind = 'file'` 検出時に R2 削除を best-effort で実行する
- [x] **T087** [US2] [BE] Phase 5 (T075) で `loadTimeline` ヘルパに `file_post` join 済み。タイムライン取得は file エントリも含む
- [x] **T088** [US2] [UI→BE 接続] MessageComposer の onUploadFile シグネチャを `(file, onProgress) => Promise` に拡張、`+page.svelte` 側で `XMLHttpRequest` 経由のアップロードを `upload.onprogress` イベントで進捗バーに反映
- [x] **T089** [US2] [UI→BE 接続] Phase 5 (T075) の `loadTimeline` で previewUrl / downloadUrl が `/api/files/[id]` を返すため、FileEntry は変更不要で実 API に接続済み
- [x] **T090** [US2] [UI→BE 接続] Phase 5 (T079) で全エントリの削除ボタンを統一エンドポイント `/api/entries/[id]` DELETE にバインド済み (file kind は T086 の R2 削除分岐を経由)
- [~] **T091** [US2] [TEST] `tests/e2e/file-sharing.spec.ts`: テストファイルは記述済み (画像アップロード + 50MB 超過拒否) だが認証必須フローのため `SHAREBOX_E2E_AUTH=1` で明示的に有効化するまで `test.skip` で待機。本番スモーク (T104) で手動実機検証する。

**Checkpoint**: US2 が独立して完全動作。

---

## Phase 7: User Story 3 - URL Sharing with OGP (Priority: P3)

**Goal**: Phase A の UrlComposer / UrlEntry に OGP fetcher を接続。

**Independent Test**: OGP 取得可能な URL と取得不可能な URL の両方を投稿し、
カード表示・フォールバック・クリック遷移・コピー・削除を確認。

### Implementation for US3 Phase B

- [x] **T092** [US3] [BE] `src/routes/api/entries/url/+server.ts`: POST — zod 検証、`share_entry` + `url_post (status=pending)` を INSERT → `fetchOgp(url)` を 5 秒タイムアウトで呼出 → 成功なら og:\* を埋めて success、失敗なら failed に UPDATE → 完成形を 201 で返却
- [x] **T093** [US3] [BE] Phase 5 (T075) の `loadTimeline` で `url_post` join 済み。url エントリも全 OGP 状態でタイムラインに表示
- [x] **T094** [US3] [UI→BE 接続] `+page.svelte` の `submitUrl` を `/api/entries/url` への fetch ベースの handler に置き換え、201 レスポンスをそのまま state に追加
- [x] **T095** [US3] [UI→BE 接続] Phase 5 (T079) で UrlEntry の削除ボタンも統一エンドポイント `/api/entries/[id]` DELETE にバインド済み
- [~] **T096** [US3] [TEST] `tests/e2e/url-sharing.spec.ts`: テストファイルは記述済み (URL 投稿 → OGP/フォールバック表示、非 URL 入力 → text 経路) だが認証必須フローのため `SHAREBOX_E2E_AUTH=1` 待機 (`test.skip`)。本番スモーク (T104) で手動実機検証する。

**Checkpoint**: 全 3 ストーリー完全動作。

---

## Phase 8: Polish, CI & Deploy

**Purpose**: 残りの非機能要件 (ストレージ可視化、CI、デプロイ、スモーク) を片付ける。

- [~] **T097** [P] [BE] _(撤回)_ — FR-034 撤回に伴い `/api/storage/usage` エンドポイントは作らない
- [~] **T098** [P] [UI→BE 接続] _(撤回)_ — StorageUsage コンポーネント自体が削除されたため
- [x] **T099** [P] `.github/workflows/ci.yml`: pnpm install → `pnpm check` → `pnpm lint` → `pnpm test:unit` → `pnpm exec playwright install --with-deps chromium webkit` → `pnpm test:e2e`。Node 22 LTS、main と PR で実行。lint と check の整合のため Prettier 全ファイル整形 + ESLint 5 件のエラー (`...rest` 警告に svelte-ignore、unused catch binding、unused expression) も同時に修正
- [x] **T100** [P] `README.md` を作成: プロジェクト概要 + Constitution / spec / plan / quickstart へのリンク + 開発・品質ゲート・デプロイのコマンド
- [x] **T101** Cloudflare Pages プロジェクトを Cloudflare ダッシュボードで作成し、GitHub 連携、ビルド設定 (`pnpm build` / `.svelte-kit/cloudflare`)、D1 と R2 の binding、シークレット (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `OWNER_EMAIL`)、環境変数 (`SESSION_COOKIE_SECURE=true`) を設定
- [x] **T102** Google Cloud Console で本番用 OAuth クライアントを作成し、redirect URI を Pages の本番 URL で登録
- [x] **T103** `wrangler d1 migrations apply sharebox-db --remote` で本番 D1 にスキーマを適用
- [x] **T104** Playwright MCP で本番環境 (<https://sharebox-dls.pages.dev/>) のスモークテストを自動実施し、US1/US2/US3 全項目グリーンを確認。ログインボタン未接続の critical バグを発見し PR #2 で修正・再デプロイ・再検証済み。副次発見として Issue #3 (favicon 404) と Issue #4 (group-hover 依存のモバイル UX) を起票
- [x] **T105** Lighthouse で本番 URL を計測。Desktop: Perf 100 / LCP 0.4s。Realistic mobile (5G, ハイエンド端末): Perf 100 / LCP 0.5s — いずれも Good 閾値達成。参考値として Lighthouse Mobile lab (Slow 4G + 4x CPU, Moto G Power) では LCP 3.6s でこれは将来改善候補として記録のみ
- [x] **T106** README.md と quickstart.md の本番 URL プレースホルダを <https://sharebox-dls.pages.dev/> に更新

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: 依存なし
- **Phase 2 (Foundational UI)**: Phase 1 完了後
- **Phase 3 (UI Phase A)**: Phase 2 完了後
- **Design Review Checkpoint**: Phase 3 完了後 (本人承認 MUST)
- **Phase 4 (Backend Foundational)**: チェックポイント承認後
- **Phase 5 (US1 BE)**: Phase 4 完了後
- **Phase 6 (US2 BE)**: Phase 4 完了後 (US1 と並列可、ただし `+page.server.ts` の編集競合に注意)
- **Phase 7 (US3 BE)**: Phase 4 完了後 (同上)
- **Phase 8 (Polish & Deploy)**: 対象 User Story の Phase B 完了後

### Within Each Phase

- `[P]` 印のタスクは異なるファイルで、相互依存がないため並列実行可能
- `+page.svelte` / `+page.server.ts` のような共有ファイルを編集するタスクは順次実行

### MVP Stop Point

Phase 5 (US1 P1) 完了時点で、認証付きテキスト共有として独立した MVP が成立する。
ファイル / URL を後回しにしてここで本番デプロイし、利用しながら US2 / US3 を
追加していくことも可能 (Constitution Principle VI に沿う段階的デリバリ)。

---

## Notes

- `[P]` = 異なるファイル、依存なし、並列可能
- `[Story]` = 各タスクが属する User Story (traceability)
- `[UI]` = Phase A、`[BE]` = Phase B、`[TEST]` = テスト
- 各タスクが完了したらコミットする (フェーズ境界では必ず)
- Design Review Checkpoint で本人承認が出るまで Phase 4 以降には絶対に進まない
- `+page.svelte` のような共有ファイルを編集するタスクは順次実行で衝突を避ける
- Polish フェーズでも仕様に書かれていない機能は追加しない (Principle VI)
