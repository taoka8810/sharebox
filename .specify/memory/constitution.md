<!--
Sync Impact Report
==================
Version change: 1.0.1 → 1.1.0
Rationale: MINOR amendment that adds a mandatory two-phase split (UI implementation
plus a design-review checkpoint, then backend logic) to the Development Workflow
section. This materially expands the workflow guidance and applies to every
future feature that touches the UI, so it is treated as a MINOR bump rather than
a PATCH clarification. No existing principles are removed or redefined.

Principles defined (unchanged):
  I.   Personal Scope & Bounded Feature Set
  II.  Zero-Cost Operation
  III. Performance First
  IV.  Design System Fidelity
  V.   Quality & Testing Discipline
  VI.  Simplicity & YAGNI

Modified sections:
  - Development Workflow — added mandatory Phase A (UI) / design-review
    checkpoint / Phase B (backend logic) split for any UI-touching feature.

Added/removed sections: none

Templates requiring updates:
  ✅ .specify/templates/plan-template.md — no edits needed (placeholder gate).
  ✅ .specify/templates/spec-template.md — no edits needed.
  ⚠ .specify/templates/tasks-template.md — task generation must honor the
     Phase A / Phase B split when emitting task lists. The template itself does
     not need editing; the /speckit.tasks command must apply the split based on
     the constitution. Verify on next /speckit.tasks invocation.
  ✅ .specify/templates/checklist-template.md — no edits needed.
  ✅ specs/001-sharebox-mvp/plan.md — already aligned (no UI Phase split was
     hard-coded yet); the upcoming /speckit.tasks output will reflect the new
     workflow.

Follow-up TODOs: none.

Earlier history:
  v1.0.1 (2026-04-12): PATCH — clarified the auth stack wording (Arctic +
    @oslojs/crypto + @oslojs/encoding, Lucia v3 deprecated).
  v1.0.0 (2026-04-12): Initial ratification of the sharebox constitution.
-->

# sharebox Constitution

## Core Principles

### I. Personal Scope & Bounded Feature Set

sharebox は開発者本人のみが利用する個人用ツールである。マルチユーザー化・サービス
展開・公開共有機能は将来にわたって導入してはならない (MUST NOT)。

認証は Google OAuth によるシングルユーザー方式とし、特定メールアドレスのホワイト
リスト方式で実装しなければならない (MUST)。すべてのページおよび API エンドポイント
は認証必須であり、未認証アクセスを許容するページを作成してはならない (MUST NOT)。

機能範囲は memo.md で定義された「テキスト共有 / ファイル共有 / URL(OGP)共有」
の 3 つに厳密に限定する。これら以外の機能追加提案は、本憲法の改訂を伴わない限り
却下される (MUST)。

**Rationale**: スコープクリープは個人用ツール最大の失敗要因である。明確な境界線
を憲法レベルで固定することで、Claude Code を含む実装主体が新機能追加の誘惑に対し
一貫して "No" を返せるようにする。

### II. Zero-Cost Operation

本番運用の月額コストは常に 0 円でなければならない (MUST)。無料枠の超過が発生する
設計、および超過リスクを内包する設計は採用してはならない (MUST NOT)。

以下の制約を厳守する:

- ドメインは無料サブドメイン (例: `*.pages.dev`) のみを使用し、独自ドメインは
  取得しない (MUST NOT)。
- インフラは Cloudflare 無料枠 (Pages / Workers / D1 / R2 / KV) およびすでに
  契約済みの無料枠サービスのみを利用する。有料プラン・従量課金の発生するサービス
  および自宅サーバーは使用してはならない (MUST NOT)。
- ファイル 1 個あたりの上限は 50 MB、総ストレージ使用量の想定上限は約 1 GB とし、
  バリデーションおよび容量監視で強制する (MUST)。

**Rationale**: ゼロコストは本プロジェクトの存在条件である。コスト制約を緩める
判断を個別に行うと境界が崩壊するため、インフラ選定段階で経路そのものを断つ。

### III. Performance First

Core Web Vitals の "Good" 閾値を常に満たさなければならない (MUST):
LCP < 2.5s、INP < 200ms、CLS < 0.1。

以下を遵守する:

- 初期 JavaScript バンドルは可能な限り小さく保ち、追加依存はパフォーマンス予算
  への影響を評価した上でのみ採用する (MUST)。
- クライアント側状態管理ライブラリ (Redux、Zustand、Jotai 等) を導入しては
  ならない。SvelteKit 標準の store / runes で不足する場合のみ個別に再評価する
  (MUST NOT by default)。
- 画像は最適フォーマットへの変換および遅延読み込みを行う (MUST)。動画プレビュー
  は初期ロードをブロックしてはならない (MUST NOT)。
- すべての動的処理はエッジ (Cloudflare Workers / Pages Functions) 上で完結させ、
  外部オリジンサーバーへの往復を発生させてはならない (MUST NOT)。

**Rationale**: 「パフォーマンス重視」を memo.md が明記しており、かつ個人のデバイス
間同期というユースケースは体感速度が直接 UX を決める。測定可能な閾値を憲法に
固定することで、後工程で判断基準がぶれない。

### IV. Design System Fidelity

UI 実装は `DESIGN.md` を単一の真実源 (single source of truth) とする。色・余白・
タイポグラフィ・角丸・影・コンポーネント仕様は DESIGN.md のトークンから逸脱して
はならない (MUST NOT)。

新しいデザイントークン・コンポーネント原則・レイアウトパターンが必要になった
場合、実装に先立って DESIGN.md を更新し、その後でコードに反映しなければならない
(MUST)。コードが DESIGN.md を先行して定義することを禁じる (MUST NOT)。

Tailwind CSS v4 を利用する場合、DESIGN.md のトークンは CSS 変数として定義し、
Tailwind 設定および個別コンポーネントから一貫して参照する (MUST)。

**Rationale**: デザインシステムを守ることで、Claude Code が生成する UI の一貫性
を担保する。ソース・オブ・トゥルースを一点に固定しないと、実装のたびにトークン
が微妙に揺らぐ。

### V. Quality & Testing Discipline

以下のユーザーフローは Playwright による E2E テストで保護しなければならない (MUST):

- Google OAuth によるログインフロー
- テキストの投稿・コピー (クリップボード連携)
- ファイルのアップロード・プレビュー表示・ダウンロード
- URL の投稿と OGP 表示

非自明なロジック (OGP パーサ、認証ガード、ファイルバリデーション、アクセス制御)
にはユニットテストを書かなければならない (MUST)。

CI は型チェック (TypeScript strict)、Lint、ユニットテスト、E2E テストを自動実行
する。これらが緑でないコードをデフォルトブランチにマージしてはならない
(MUST NOT)。

厳格な TDD (テスト先行) は必須としないが、機能追加時には「該当 E2E と必要な
ユニットテストを同じ PR に含める」ことを標準とする (SHOULD)。

**Rationale**: 個人用であっても、壊れたまま気づかない時間が長いと後から直すコスト
が跳ね上がる。CI を品質ゲートにすることで、Claude Code 主導の高速なイテレーション
を安全に保つ。

### VI. Simplicity & YAGNI

「個人用である」ことを理由にした雑な設計 (型の手抜き、責務の曖昧化、命名の怠慢
など) は許容しない (MUST NOT)。同時に、マルチテナント化・拡張性・将来の他ユーザー
想定といった "過剰な一般化" も禁じる (MUST NOT)。

抽象化は 2 回以上の具体的重複が実在してから導入する (Rule of Three)。投機的抽象化
・投機的設定項目・仮想の将来要件に備えたフックポイントは作ってはならない (MUST NOT)。

依存関係は最小限に保ち、新規追加時はその必要性を PR 説明またはコミットメッセージ
で明示的に正当化しなければならない (MUST)。

**Rationale**: シンプルさは個人プロジェクトが長生きする最大の条件である。抽象化
の過不足を両側から縛ることで、「足りない」「多すぎる」どちらの失敗モードにも
陥らないようにする。

## Technology Stack (Fixed Constraints)

以下のスタックは憲法レベルで固定される。変更には本憲法の改訂 (Section: Governance
参照) が必要である。

| レイヤ | 選定 |
|---|---|
| ホスティング | Cloudflare Pages |
| フレームワーク | SvelteKit (Cloudflare adapter) |
| 言語 | TypeScript (`strict: true` 必須) |
| メタデータ DB | Cloudflare D1 |
| ファイルストレージ | Cloudflare R2 (エグレス料金 0 円であることが採用根拠) |
| 認証 | Google OAuth を Arctic + `@oslojs/crypto` / `@oslojs/encoding` ベースの自前セッションで実装(`lucia-auth.com` の最新公式チュートリアル準拠)、ホワイトリスト 1 ユーザー |
| スタイリング | Tailwind CSS v4、DESIGN.md トークンを CSS 変数として定義 |
| フォント | Inter を self-host (DESIGN.md のフォールバック順に準拠) |
| OGP 取得 | Cloudflare Workers で HTML を fetch・パース、結果を D1 にキャッシュ |
| テスト | Playwright (E2E) + Vitest (ユニット) |
| CI | GitHub Actions |

外部 API・サードパーティ SaaS への依存は原則追加しない (MUST NOT by default)。
やむを得ず追加する場合は Principle II (ゼロコスト) と Principle III (パフォー
マンス) を両方満たすことを PR で証明する必要がある。

## Development Workflow

実装は Claude Code (AI コーディングエージェント) 主導で行う。人間は仕様策定・
レビュー・意思決定に集中する。

機能追加および変更は必ず Spec Kit のワークフローに従わなければならない (MUST):

1. `/speckit.specify` — 仕様の作成
2. `/speckit.plan` — 技術計画の策定 (本憲法の Constitution Check を通過すること)
3. `/speckit.tasks` — タスク分解
4. `/speckit.implement` — 実装とテスト

`/speckit.tasks` で生成するタスクリストは、UI 変更を伴うすべての機能において
必ず以下の 2 段階に分割しなければならない (MUST):

- **Phase A: UI 実装(デザイン確認フェーズ)** — DESIGN.md に準拠した UI を、
  バックエンドロジックなしのモックデータで実装する。対象に含めるもの:
  全画面のレイアウト、コンポーネントの見た目、ホバー / フォーカス /
  アクティブ等のインタラクション、レスポンシブ表示、ローディング状態、
  空状態、エラー状態の表示。API 呼び出しはモック関数で代替する。
- **デザイン確認チェックポイント (MUST)**: Phase A 完了時点で、本人がローカル
  開発サーバー (`pnpm dev` 等) を立ち上げ、PC とスマートフォンの実機ブラウザで
  全画面・全状態を確認する。本人の明示的な承認が得られるまで Phase B に進んでは
  ならない (MUST NOT)。
- **Phase B: バックエンドロジック実装** — DB アクセス、認証、ストレージ、外部
  通信などのロジックを Phase A で作成した UI に接続する。Phase A の UI は
  原則として手を加えない(整合上必要な微修正を除く)。

UI を含まない純粋なバックエンド変更については、本 2 段階分割は適用されない。

仕様・計画・タスクに反する実装を行ってはならない (MUST NOT)。乖離が必要になった
場合は、実装に先立って該当ドキュメントを更新する (MUST)。

PR マージ前には以下を満たす (MUST):

- CI (型チェック / Lint / ユニット / E2E) がすべてグリーン
- 関連する spec / plan / tasks ドキュメントが実装と整合している
- DESIGN.md との整合性が確認されている (UI 変更を含む場合)

## Governance

本憲法はプロジェクト内のすべてのドキュメント・コードレビュー・実装判断に優先
する最高位の規範である。本憲法と他のドキュメントが矛盾した場合、本憲法が優先
する (MUST)。

**改訂手順**:

1. 改訂提案は Pull Request として提出し、変更点と根拠を明記する。
2. 版数は Semantic Versioning に従って更新する:
   - MAJOR: 既存原則の削除・後方非互換な再定義
   - MINOR: 新規原則・セクションの追加、またはガイダンスの実質的拡張
   - PATCH: 文言の明確化、誤字修正、非意味的なリファクタ
3. 改訂がマージされた時点で `Last Amended` を ISO 8601 日付で更新する。
4. 原則または固定スタックを変更する場合、影響を受ける既存の spec / plan / tasks
   を同一 PR 内で同期させなければならない (MUST)。

**コンプライアンスレビュー**:

- すべての PR は本憲法との整合性を確認しなければならない (MUST)。
- `/speckit.plan` 実行時の Constitution Check では本ファイルを参照し、違反が
  ある場合は計画を却下または是正する。
- 複雑性の追加 (新規依存、新規抽象、新規サービス連携) は PR 説明で正当化しな
  ければならない。

本憲法に記載のない判断については、Principle VI (Simplicity & YAGNI) を既定の
指針として採用する。

**Version**: 1.1.0 | **Ratified**: 2026-04-12 | **Last Amended**: 2026-04-12
