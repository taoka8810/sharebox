# sharebox アイコン生成プロンプト集

GPT-image-2 (gpt-image-1 系) 向けの app icon 生成プロンプト。
1024×1024 で生成 → favicon / Apple touch / PWA 各サイズへリサイズして使用。

---

## アプリ概要

**sharebox** は「個人用マルチデバイス共有 Web アプリ」。本人 1 人が所有する複数
デバイス (PC ⇄ スマホ) 間で **テキスト / ファイル / URL** を素早く安全にやり取り
するための、**シングルユーザー専用** ツール。

- **位置づけ**: 「Slack 自分用 DM」「iCloud 共有メモ」の代替となる、ミニマルな
  個人スクラップボックス
- **認証**: Google OAuth + メールアドレス・ホワイトリスト (本人以外は完全拒否)
- **コア体験**: 統合タイムラインに 3 種類 (テキスト / ファイル / URL) の投稿を時系列
  で並べ、別デバイスから即座に参照・コピー・ダウンロード可能
- **インスピレーション**: LINE Keep / Apple Notes / Slack Saved Items の "自分用
  メモ箱" 体験
- **技術**: SvelteKit 2 + Svelte 5 + TypeScript strict + Cloudflare Pages /
  D1 / R2

## デザイン的な特徴

- **トーン**: ミニマル、暖かみのあるニュートラル、控えめな色彩、信頼感
- **アクセントカラー**: Notion Blue (`#0075de`) を **唯一の彩度の高い色** として
  CTA・リンク・インタラクションに限定使用
- **背景**: 純白 (`#ffffff`) と暖色オフホワイト (`#f6f5f4`) を交互に配置する
  "warm alternation" で視覚的リズムを作る (硬い区切り線は使わない)
- **タイポグラフィ**: NotionInter / Inter (geometric sans-serif、丸みのある終端)
- **形状言語**: ソフトな角丸 (12px / 16px)、whisper border、4 層のごく淡い
  シャドウ、過剰な装飾なし
- **UI パターン**: LINE Keep 風のチャットライクなカードスタック表示
  (時系列の "投稿" が縦に積まれていく)
- **避けるもの**: 派手なグラデーション、ネオン、高彩度の多色構成、3D・スキューモーフィズム、
  ロゴタイプ、過剰なディテール

## ブランドカラー参照

- **Notion Blue (Primary)**: `#0075de` ― CTA / アクセント / リンク
- **Deep Navy (Secondary)**: `#213183` ― 強調・ダーク領域
- **Warm Cream (背景アルタネート)**: `#f6f5f4`
- **Off-white (ベース背景)**: `#faf9f7`
- **Pure White (カード)**: `#ffffff`

---

## Pattern A: シンプルレターマーク "S"

A minimalist app icon, square 1024x1024, flat design. A bold rounded sans-serif lowercase letter "s" in pure white, centered on a solid Notion Blue (#0075de) background with subtly rounded corners (iOS-style squircle). The letter has slightly thick strokes with friendly rounded terminals, geometric and modern. No gradients, no shadows, no text other than the letter. Clean vector style, high contrast, suitable for both light and dark home screens. Centered composition with generous padding (~18%). Inspired by Notion and Linear app icons.

---

## Pattern B: 共有ボックス (アプリ名直訳)

A minimalist app icon, square 1024x1024, flat geometric design. An open-top cardboard box icon viewed from a slight 3/4 angle, drawn in pure white line art with 8% stroke weight and rounded line caps. Inside the box, a small chat bubble, a tiny image rectangle, and a link chain icon peek out, suggesting "things stored together". Background: solid Notion Blue (#0075de) with iOS-squircle rounded corners. No text, no shadows, no gradients. Centered composition with 15% padding. Clean, friendly, modern — inspired by Notion, Things 3, and Bear app icons.

---

## Pattern C: チャット風スタック (LINE Keep オマージュ) ★推奨

A minimalist app icon, square 1024x1024, flat design. Three overlapping rounded chat-bubble cards stacked diagonally from bottom-left to top-right, suggesting a personal scrapbook of saved messages. The back card is warm cream (#f6f5f4), the middle card is pure white, the front card is bright Notion Blue (#0075de) with a tiny white bookmark/pin shape on it. Background: soft warm off-white (#faf9f7) with iOS-squircle rounded corners. Subtle soft drop shadows between cards for depth. No text. Centered composition with 12% padding. Inspired by Apple Notes, Bear, and Things 3 app icons.

---

## Pattern D: ピン留め / ブックマーク

A minimalist app icon, square 1024x1024, flat design. A single bold geometric pushpin or bookmark ribbon icon centered on the canvas, drawn in pure white with crisp clean edges and slightly rounded corners. The pin/bookmark casts a very subtle warm shadow to the bottom-right. Background: vibrant Notion Blue (#0075de) gradient (subtle, top-left lighter to bottom-right slightly deeper) with iOS-squircle rounded corners. No text, no decorative elements. Centered composition with 22% padding. Bold and confident, inspired by Pocket, Raindrop, and Pinboard app icons.

---

## Pattern E: アブストラクト幾何 (3 種別を抽象化)

A minimalist app icon, square 1024x1024, flat geometric design. Three simple shapes arranged in a tight triangular composition: a small white rounded square (representing text), a white circle (representing a file), and a white rounded rectangle outline (representing a URL/link). The three shapes overlap slightly with subtle transparency where they intersect, creating a sense of unity. Background: solid Notion Blue (#0075de) with iOS-squircle rounded corners. No text, no shadows, no gradients. Centered composition with 18% padding. Clean, abstract, brand-forward — inspired by Linear, Vercel, and Things 3 app icons.

---

## 運用 Tips

- **生成サイズ**: 1024×1024 で生成 → 512 / 192 / 180 / 32 / 16 へリサイズ
- **角丸**: プロンプト上では「iOS-squircle rounded corners」を指定しているが、Apple Touch Icon の書き出しは **角丸なしの正方形** が正解 (iOS が自動でマスクする)
- **Android (PWA)**: `purpose: "maskable"` 用に主要素は中央 80% の safe zone に収める (padding 18% 以上を指定済み)
- **複数案の検証**: 同じプロンプトを seed 違いで 3〜4 枚生成して選定するのが無難
- **プロンプト先頭への文脈注入**: 必要に応じて各プロンプトの冒頭に「アプリ概要」
  と「デザイン的な特徴」セクションを丸ごとコピーして与えると、ブランドの一貫性
  が保たれやすい (GPT-image-2 はコンテキストへの追従性が高い)
