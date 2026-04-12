# HTTP API Contract — sharebox MVP

**Date**: 2026-04-12
**Branch**: `001-sharebox-mvp`

SvelteKit の `+server.ts` および form actions が公開するエンドポイントの契約。
すべてのエンドポイントは `hooks.server.ts` のセッション検証を通過した状態で
呼ばれる前提 (`/login/google/*` を除く)。未認証アクセスは 302 で `/login` へ
リダイレクトする。

---

## 共通

- ベース URL: `https://<sharebox-host>` (本番は `*.pages.dev`)
- 認証: `session` cookie (HttpOnly Secure SameSite=Lax)
- リクエスト/レスポンス Content-Type: 特記なき場合 `application/json`
- 日時: UNIX epoch (ms) の整数
- エラー形式: 全エンドポイント共通で

```json
{
  "error": {
    "code": "validation_failed",
    "message": "human readable message"
  }
}
```

エラーコード一覧:
- `unauthorized` (401)
- `forbidden` (403) — ホワイトリスト外
- `validation_failed` (400)
- `not_found` (404)
- `payload_too_large` (413)
- `internal` (500)

---

## 認証

### `GET /login/google`

Google OAuth 認可エンドポイントへリダイレクトする。`state` と `code_verifier`
を生成し、HttpOnly cookie に保存する。

- **Auth required**: No
- **Response**: `302 Found` with `Location: https://accounts.google.com/...`
- **Set-Cookie**: `google_oauth_state`, `google_code_verifier` (10 分 TTL)

---

### `GET /login/google/callback?code&state`

Google からのコールバック。`state` と `code_verifier` を検証し、ID トークンを
デコードしてホワイトリストと照合する。

- **Auth required**: No
- **Query**: `code: string`, `state: string`
- **Success**: `302 Found` → `/`、`session` cookie 発行、`login_audit` に
  `result=success` 記録
- **Whitelist 拒否**: `302 Found` → `/denied`、`login_audit` に
  `result=denied_whitelist` 記録
- **State 不一致 / Code 不正**: `400 Bad Request`、`login_audit` に
  `result=denied_invalid_state` または `denied_oauth_failed` 記録

---

### `POST /logout`

セッション破棄。

- **Auth required**: Yes
- **Request body**: なし (CSRF はオリジンヘッダ + SameSite Cookie で防御)
- **Response**: `302 Found` → `/login`、`Set-Cookie: session=; Max-Age=0`

---

## エントリ API

### `GET /api/entries?kind=all|text|file|url&before=<ms>&limit=<n>`

タイムラインを新しい順で取得する。

- **Auth required**: Yes
- **Query**:
  - `kind` (省略時 `all`): フィルタ。`text` / `file` / `url` / `all`
  - `before` (省略時 now): UNIX epoch (ms)。これより**古い**エントリを返す
  - `limit` (省略時 30、最大 100): 件数
- **Response 200**:

```json
{
  "entries": [
    {
      "id": "uuid",
      "kind": "text",
      "createdAt": 1745000000000,
      "text": { "body": "..." }
    },
    {
      "id": "uuid",
      "kind": "file",
      "createdAt": 1745000000000,
      "file": {
        "originalName": "photo.jpg",
        "mimeType": "image/jpeg",
        "byteSize": 12345,
        "category": "image",
        "downloadUrl": "/api/files/<id>"
      }
    },
    {
      "id": "uuid",
      "kind": "url",
      "createdAt": 1745000000000,
      "url": {
        "url": "https://example.com/article",
        "domain": "example.com",
        "ogp": {
          "status": "success",
          "title": "Example",
          "description": "...",
          "imageUrl": "https://...",
          "siteName": "Example"
        }
      }
    }
  ],
  "nextBefore": 1744990000000
}
```

`nextBefore` は次ページがある場合のみ存在 (ページネーションカーソル)。

---

### `DELETE /api/entries/[id]`

エントリ削除。`file` の場合は R2 オブジェクトも削除する。

- **Auth required**: Yes
- **Response**:
  - `204 No Content` 成功
  - `404 Not Found` 該当エントリなし (他人のエントリは存在しないので同じ扱い)

---

## テキスト投稿

### `POST /api/entries/text`

- **Auth required**: Yes
- **Request body**:

```json
{ "body": "投稿テキスト" }
```

- **Validation**:
  - `body` 必須、空白のみ禁止
  - UTF-8 で 100,000 文字 (= 約 400KB) 以下
- **Response 201**:

```json
{
  "id": "uuid",
  "kind": "text",
  "createdAt": 1745000000000,
  "text": { "body": "投稿テキスト" }
}
```

- **Errors**: `400 validation_failed`

---

## ファイル投稿

### `POST /api/files` (multipart/form-data)

- **Auth required**: Yes
- **Request**: `multipart/form-data` with single `file` field
- **Limits**:
  - 1 ファイルあたり 50 × 1024 × 1024 bytes
  - 超過は `413 payload_too_large`
- **Response 201**:

```json
{
  "id": "uuid",
  "kind": "file",
  "createdAt": 1745000000000,
  "file": {
    "originalName": "video.mp4",
    "mimeType": "video/mp4",
    "byteSize": 49000000,
    "category": "video",
    "downloadUrl": "/api/files/<id>"
  }
}
```

- **Errors**:
  - `400 validation_failed` (空ファイル / 名前なし / MIME 不明)
  - `413 payload_too_large` (50MB 超過)
  - `500 internal` (R2 アップロード失敗)

R2 アップロード失敗時はトランザクションをロールバックし、`share_entry`
レコードも作成しない。

---

### `GET /api/files/[id]`

ファイルダウンロード。

- **Auth required**: Yes
- **Response 200**:
  - `Content-Type`: 該当 MIME
  - `Content-Disposition`: `attachment; filename="<original_name>"`
  - `Content-Length`: 該当バイト数
  - Body: R2 から streaming で返却
- **Errors**:
  - `404 not_found`

---

## URL 投稿

### `POST /api/entries/url`

- **Auth required**: Yes
- **Request body**:

```json
{ "url": "https://example.com/article" }
```

- **Validation**:
  - `url` 必須
  - スキーム `http` / `https` のみ
  - URL の長さ 2048 文字以下
- **Processing**:
  1. `share_entry` + `url_post` (status=`pending`) を INSERT
  2. 同一リクエスト内で OGP fetcher を 5 秒タイムアウトで呼び出す
  3. 結果に応じて `success` / `failed` に UPDATE
  4. 完成形のレスポンスを返す
- **Response 201**:

```json
{
  "id": "uuid",
  "kind": "url",
  "createdAt": 1745000000000,
  "url": {
    "url": "https://example.com/article",
    "domain": "example.com",
    "ogp": {
      "status": "success",
      "title": "...",
      "description": "...",
      "imageUrl": "https://...",
      "siteName": "..."
    }
  }
}
```

- **Errors**: `400 validation_failed`

---

## ストレージ容量 (任意)

### `GET /api/storage/usage`

ストレージ使用量を取得 (FR-034 のための表示用)。

- **Auth required**: Yes
- **Response 200**:

```json
{
  "totalBytes": 524288000,
  "limitBytes": 1073741824,
  "ratio": 0.488
}
```

- **算出**: `SUM(file_post.byte_size) + SUM(text_post.byte_length)` の合計と
  想定上限 1GB の比率。

---

## 設計上の注記

- すべてのエンドポイントは `hooks.server.ts` の `handle` で `event.locals.user`
  を解決する。`user` が無い場合 `/api/*` は 401 を返し、ページは `/login` へ
  リダイレクトする。
- form actions と REST 風 API を併用するが、フォーム送信は `use:enhance` を
  使ってクライアント JS から `application/json` リクエストにアップグレードし、
  ノー JS 環境でもフォールバックで動くようにする (Progressive Enhancement)。
- レート制限は MVP では実装しない (単一ユーザー前提)。`hooks.server.ts` の
  whitelist チェックが事実上のレート制限となる。
