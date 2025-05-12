## タスク管理

### バックログ (優先度順)

#### P0: 🔴 緊急・最優先

- [x] 🔴 プロジェクト初期セットアップ
  - Next.js (v14.2.25), TypeScript (v5.2.2), Tailwind CSS (v3.4.1) (現状バージョンを正とする)
  - [x] Prisma (v5.11.0) セットアップ (初期化まで完了、モデル定義は次タスク)
  - [x] ESLint, Prettier 設定 (基本設定完了)
  - [x] `globals` ルールのディレクトリ構造に合わせた初期フォルダ作成 (app, components, lib, dal など)
- [x] 🔴 `schema.prisma` のモデル定義 (Visitor, FxRateモデル)
- [x] 🔴 `visitors.csv` のデータモデル定義とDBへの初期データ投入スクリプト作成・実行
  - `dal/visitors.ts` にデータアクセスロジックを配置 (配置済み、スクリプト内で直接Prisma Client使用)
- [x] 🔴 為替レート外部API連携の基礎実装
  - [x] APIクライアントの作成 (`lib/api/fxApi.ts`)
  - [x] 日次データを取得し、月次平均に集計するロジック (scripts/populateFxRates.ts に実装)
  - [x] 取得した為替レートをDBに保存する処理 (`dal/fxRates.ts` および scripts/populateFxRates.ts に実装)

#### P1: 🟡 重要

- [x] 🟡 派生指標計算ロジックの実装
  - [x] `visitors_growth` の計算 (`lib/calculations/visitorMetrics.ts`)
  - [x] `fx_change` の計算 (`lib/calculations/fxMetrics.ts`)
- [x] 🟡 KPIパネルコンポーネントの実装 (`components/features/dashboard/KpiPanel.tsx`)
  - [x] 選択期間の平均fx_change, 平均visitors_growth表示
  - [x] データ取得はServer Componentsで行う
- [x] 🟡 混合折れ線＋棒グラフコンポーネントの実装 (`components/features/dashboard/MixedChart.tsx`)
  - [x] 棒：月次fx_change(%)
  - [x] 線：月次visitors_growth(%)
  - [x] データ取得とグラフ描画 (Rechartsを使用)
- [x] 🟡 散布図＋回帰分析コンポーネントの実装 (`components/features/dashboard/ScatterPlotWithRegression.tsx`)
  - [x] X軸：fx_change(%)
  - [x] Y軸：visitors_growth(%)
  - [x] 回帰直線 & 感応度係数（傾き）・R²を注記 (simple-statisticsを使用)
- [x] 🟡 ダッシュボードページの基本レイアウト作成 (`app/(dashboard)/page.tsx`, `app/(dashboard)/layout.tsx`)
  - [x] 上記コンポーネントを配置 (KpiPanel, MixedChart, ScatterPlotWithRegression)
  - [x] グローバルフィルター (期間レンジ、通貨ペア、国/地域) のUI仮設置 (DashboardFilters.tsx導入)

#### P2: 🟢 通常

- [x] 🟢 国別感応度ランキングコンポーネントの実装 (`components/features/dashboard/SensitivityRanking.tsx`)
  - [x] visitors_sensitivity（回帰の傾き）を国別にソート表示
- [x] 🟢 シナリオ試算パネルコンポーネントの実装 (`components/features/dashboard/ScenarioSimulator.tsx`)
  - [x] Server Action (`src/actions/simulateScenarioAction.ts`) で計算ロジックを実装完了
  - [x] フロントエンドコンポーネント (`ScenarioSimulator.tsx`) でユーザー入力と結果表示を実装
  - ユーザー入力：想定fx_change(±%)
  - 推定visitors_growth & 推定訪日人数を表示
- [x] 🟢 グローバルフィルター機能の実装
  - [x] 期間レンジ選択 (date-fns利用)
  - [x] 通貨ペア切替
  - [x] 国／地域マルチセレクト
  - [x] フィルター変更時の各コンポーネントのデータ再取得と再描画 (URL Query Params経由で実現)
- [ ] 🟢 認証機能の導入 (Clerk)
  - `dev-rules/tech-stack` に基づきClerkをセットアップ
  - ダッシュボードページへのアクセス制御
- [x] 🟢 UI/UXの改善 (Shadcn/ui, Tailwind CSS)
  - [x] 全体的なデザイン調整、レスポンシブ対応 (基本対応、微調整はローカルテスト時)
  - [x] ローディング状態、エラーステートの表示 (Skeleton導入、メッセージ改善)

#### P3: ⚪ 低優先

- [ ] ⚪ テストコードの作成 (ユニットテスト、インテグレーションテスト)
- [ ] ⚪ デプロイ準備 (Vercel)
- [ ] ⚪ ドキュメント整備

### 完了済み

(なし)

### 注意事項
- `dev-rules/*` を常に意識して開発を進めること。
- 特に `dev-rules/nextjs` のディレクトリ構造、Server Components/Client Components の使い分け、API設計思想を遵守する。
- `dev-rules/tech-stack` に記載のライブラリを優先的に使用する。
  - 注意: 一部ライブラリのバージョンは `dev-rules/tech-stack` と異なりますが、現状のバージョンを正として進めます。
- 不明点は逐次確認し、認識齟齬がないようにする。
- 機能実装後は必ずこの `@todo.md` を更新する。 