# Phase 0: Research — sharebox MVP

**Date**: 2026-04-12
**Branch**: `001-sharebox-mvp`

本文書は plan.md の Technical Context で挙げた技術選定について、各項目の決定・
根拠・代替案を整理する。Constitution で固定済みの大枠 (Cloudflare + SvelteKit +
D1 + R2 + Tailwind) は再検討対象外とし、その内側の具体的な選択を記録する。

---

## R1. 認証ライブラリ構成

**Decision**: `arctic` (OAuth 2.0 / OIDC クライアント) + `@oslojs/crypto`、
`@oslojs/encoding` を用いた自前セッション管理。Lucia ライブラリ本体は使用しない。

**Rationale**:

- Lucia v3 は 2025 年に作者 (pilcrowonpaper) によってメンテナンス終了が宣言され、
  代わりに「Arctic で OAuth フローを処理し、セッションは自前テーブルで管理する」
  パターンが `lucia-auth.com` の公式チュートリアルで推奨されている。
- 推奨パターンは Web Crypto API ベースで Cloudflare Workers ランタイムと完全互換
  であり、Node.js 固有 API に依存しない。
- セッション実装は ~100 行程度のコードで済み、ブラックボックス化を避けつつ
  Principle VI (シンプルさ) に合致する。
- セッショントークンの生成・ハッシュ・検証ロジックは `@oslojs/*` の薄いユーティリティ
  にラップされており、自前実装の落とし穴 (timing attack 等) を回避できる。

**Alternatives considered**:

- **Lucia v3 を使う**: メンテ終了済みのため将来的なセキュリティパッチが得られず、
  Principle V (品質) と将来の保守性に反する。
- **Auth.js (NextAuth) for SvelteKit**: 抽象が分厚く、Cloudflare Workers ランタイム
  での動作確認が公式には保証されておらず、バンドルサイズも大きい。Principle III
  (パフォーマンス) と VI (シンプルさ) に反する。
- **Clerk / Supabase Auth 等の SaaS**: 無料枠はあるが将来枠変更リスクがあり、外部
  SaaS への依存が Principle II (ゼロコスト永続性) と相性が悪い。

**Constitution drift**: Constitution の Technology Stack に「Arctic + Lucia」と
記載されているため、本決定は文言レベルの逸脱となる。`/speckit.implement` 開始前
に Constitution に PATCH 改訂を入れ、「Arctic + `@oslojs/crypto` 自前セッション
(Lucia 公式チュートリアル準拠)」に表現を更新する。

---

## R2. データベース ORM / マイグレーション

**Decision**: `drizzle-orm` + `drizzle-kit` を採用。D1 用の `drizzle-orm/d1`
アダプタを使用し、マイグレーションは `drizzle-kit generate` で SQL を出力して
`wrangler d1 migrations apply` で適用する。

**Rationale**:

- TypeScript の型から SQL スキーマを引けるため、テーブル変更時の影響範囲が
  コンパイル時に検出される。
- 軽量 (gzip 後のランタイム約 ~10KB) で、ORM とは言うが薄い SQL ビルダーに近い。
  Principle III (パフォーマンス) と VI (シンプルさ) と両立する。
- D1 の公式バインディングと統合済みで、Workers 環境で動作する。
- マイグレーションは生 SQL を出力するため、複雑な抽象化を介さず Wrangler の
  D1 マイグレーションツールに直接渡せる。

**Alternatives considered**:

- **生 SQL のみ**: 型安全性ゼロ。3 種類のエントリ用クエリを手書きで管理するのは
  ヒューマンエラーの温床。
- **Prisma**: スキーマ DSL は強力だが、Workers ランタイムでの D1 サポートが歴史的
  に不安定で、ランタイムサイズも大きい (Principle III に反する)。
- **Kysely**: Drizzle と並ぶ軽量選択肢。比較すると Drizzle の方が D1 アダプタが
  公式扱いで、SvelteKit + Cloudflare の事例が多い。

---

## R3. OGP 取得と HTML パース

**Decision**: Workers 内で `fetch()` した HTML を `node-html-parser` で軽量パース
し、`og:title` / `og:description` / `og:image` / `og:url` / `og:site_name` の
5 メタを抽出する。取得結果は `url_post` レコードに直接保存する (KV キャッシュは
当面導入しない)。

**Rationale**:

- `node-html-parser` は Workers 互換 (依存なし、~50KB)。CSS セレクタも限定的だが
  使え、`<meta property="og:*">` の抽出には十分。
- 取得結果を D1 の `url_post.ogp_*` カラムに直接保存することで、別途 KV を導入
  する複雑性を避ける。同一 URL の重複投稿は spec 上許容しているため、キャッシュ
  共有メリットも限定的。
- タイムアウトは `AbortController` で 5 秒に設定 (FR-029)。失敗時はフォールバック
  表示で UI 側を退避させる (FR-028)。
- レスポンスサイズが大きい場合 (>1MB) は最初の 256KB のみ読み取る (`Reader` API
  ベースの早期打ち切り) ことで Worker CPU 時間を保護する。

**Alternatives considered**:

- **`cheerio`**: 高機能だが Node.js 依存があり、Workers 互換性に難あり。
- **正規表現で抽出**: パース精度が低く、エンティティデコードや属性順序のばらつき
  に弱い。
- **外部 SaaS (LinkPreview API 等)**: 無料枠はあるがレート制限があり Principle II
  に抵触する可能性。

---

## R4. ファイルアップロード方式

**Decision**: クライアントから SvelteKit の `+server.ts` エンドポイントへ
`multipart/form-data` で直接 PUT し、Worker 内で R2 binding 経由で `R2Bucket.put()`
する。50MB 上限はサーバー側 (Worker) で `request.body` を読みながらバイト数
チェックして強制する。

**Rationale**:

- Cloudflare Workers の Request body サイズ上限は 100MB なので、50MB 制限は十分
  に収まる。
- R2 への直接アップロード (signed URL) は実装上のメリットが薄く、代わりに認証
  ガードと容量チェックをサーバー側で一元化する方がシンプル。
- アップロード進捗は `XMLHttpRequest.upload.onprogress` イベントを使うことで
  クライアント側で取得できる (`fetch` API は進捗イベント非対応)。

**Alternatives considered**:

- **R2 Pre-signed URL**: スケール時のサーバー負荷軽減には有効だが、本アプリは
  単一ユーザーで負荷無視できるため過剰。
- **Resumable upload (TUS 等)**: 50MB なので不要。
- **Cloudflare Direct Creator Upload (Stream)**: 動画 Stream は Cloudflare Stream
  の対象だが Stream は有料 (Principle II 違反)。

---

## R5. 画像/動画プレビュー戦略

**Decision**:

- 画像: ブラウザネイティブの `<img loading="lazy" decoding="async">` を使用し、
  `srcset` は使わない (生のオリジナル画像を返却)。AVIF / WebP 変換は Cloudflare
  Images が必要となり有料のため、MVP では行わない。
- 動画: `<video preload="metadata" controls>` で初期ロードをブロックしない。
  サムネイル画像生成は Workers 上では困難なため、初回再生時にブラウザがメタ
  情報からポスターフレームを使う。

**Rationale**:

- 単一ユーザー × 50MB 上限のため、画像最適化が無くても帯域・体感速度の問題は
  発生しない。Principle II (ゼロコスト) を優先。
- `loading="lazy"` と `preload="metadata"` で Performance Goals (LCP < 2.5s) を
  満たせる見込み。

**Alternatives considered**:

- **Cloudflare Images (有料)**: コスト発生のため不採用。
- **Workers 内で `wasm-image-resize` 等を使ったランタイム変換**: CPU 時間を消費
  し無料枠の CPU バーストを圧迫する可能性。
- **ffmpeg.wasm でサムネイル生成**: バンドルが巨大で Principle III に反する。

---

## R6. クライアント側の状態管理

**Decision**: Svelte 5 の runes (`$state`, `$derived`, `$effect`) のみで完結させ、
ストアライブラリを別途導入しない。フォーム送信は SvelteKit の `use:enhance`

- form actions で進捗管理し、サーバーレスポンスから返ってくるデータでローカル
  状態を更新する。

**Rationale**:

- Constitution Principle III で「クライアント側状態管理ライブラリは導入しない」
  と明記されている。
- 単一ユーザー × タイムライン 1 つというシンプルさで、複雑な状態同期は不要。
- 楽観的更新 (削除や投稿後の即時 UI 反映) は `use:enhance` の戻り値を runes に
  反映するだけで十分。

**Alternatives considered**: なし (Constitution で禁止)。

---

## R7. リアルタイム反映 (デバイス間同期)

**Decision**: MVP では明示的な手動リロード + Visibility API でのフォーカス時自動
リフェッチに留める。WebSocket / SSE / Durable Objects は導入しない。

**Rationale**:

- 本アプリは「自分のデバイス間で意識的に切り替えて参照する」ユースケースであり、
  ミリ秒単位のリアルタイム性は不要。
- 別デバイスでアプリを開いた瞬間や、タブをフォアグラウンドに戻した瞬間に最新
  化されれば spec の SC-001 (5 秒以内に他デバイスで反映) を満たせる。
- Durable Objects / WebSocket は無料枠の対象だが複雑性が増し、Principle VI に
  反する。

**Alternatives considered**:

- **Server-Sent Events (SSE) でタイムライン購読**: 一見シンプルだが Workers 上の
  長時間接続コストと複雑性が見合わない。
- **Polling (定期 fetch)**: 不要なリクエストを増やし、結果的に体感は変わらない。

---

## R8. CI / デプロイパイプライン

**Decision**: GitHub Actions で `lint → typecheck → vitest → playwright (Chromium

- Mobile WebKit)` を順に実行。`main` へのマージで Cloudflare Pages の Git
  インテグレーションが自動デプロイをトリガーする。Wrangler 経由のデプロイは行わない
  (Pages の Git 連携で完結)。

**Rationale**:

- Pages の Git インテグレーションはゼロ設定でデプロイでき、Principle II
  (ゼロコスト + シンプル運用) に合致する。
- Playwright は Chromium と Mobile WebKit の両方で実行することで、モバイル UI
  の主要シナリオを CI でカバーできる (Safari の挙動差異は実機確認で補完)。

**Alternatives considered**:

- **Wrangler でデプロイ**: シークレット管理 (`CLOUDFLARE_API_TOKEN`) が増え、
  Pages の自動連携と機能差がない。
- **Vercel デプロイ**: SvelteKit のサポートはあるが Workers ランタイムは
  Cloudflare 専用。

---

## R9. ホワイトリスト管理

**Decision**: 許可メールアドレスは `wrangler` の Secret として
`OWNER_EMAIL` 単一値で保持し、`auth/whitelist.ts` で単純比較する。複数登録は
構造として持たない。

**Rationale**:

- 「将来にわたって 1 ユーザー」という Constitution Principle I に沿う。
- DB に whitelist テーブルを作ると複数登録を許してしまい、原則違反の温床になる。
- Secret 1 つの管理は最も単純で誤設定リスクが低い。

**Alternatives considered**:

- **環境変数 (`.env`)**: 本番では Cloudflare Pages の環境変数として設定可能だが、
  Secret として扱うほうが意図 (機密) が明示的。
- **DB の `allowed_emails` テーブル**: 過剰汎化。Principle VI 違反。

---

## R10. ローカル開発環境

**Decision**: `wrangler pages dev` を使い、ローカルで D1 と R2 のミラーを立てる。
Google OAuth のリダイレクト URI は `http://localhost:8788/login/google/callback`
を Google Cloud Console に登録する (本番用とは別の OAuth クライアント)。

**Rationale**:

- Wrangler が D1 / R2 のローカルエミュレーションを公式サポートしており、本番と
  同じバインディング名で開発できる。
- OAuth の Dev / Prod 分離は Google 側で複数 redirect URI 登録するか、別クライアント
  を作る運用で対処する。本アプリは個人用なので運用負荷は許容範囲。

**Alternatives considered**:

- **本番 D1 / R2 を直接指して開発**: データ汚染リスクとレート消費。
- **モック実装**: テスト用には有効だが手動動作確認には実 binding が不可欠。

---

## オープンクエスチョン (Phase 1 で再評価)

すべて解決済み。`/speckit.plan` の Phase 1 (data-model / contracts / quickstart)
にそのまま進行可能。
