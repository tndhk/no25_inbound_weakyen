## 【改訂版】円安ショック・ダッシュボード要件定義

### 1. 概要

主要通貨（USD/JPY、CNY/JPY など）の為替変動と、訪日外国人の人数伸び率を同時に可視化し、“為替1%変動” が訪日客数に与えるインパクト（感応度）を把握するダッシュボード。

### 2. データソース

* **訪日外国人入国者数**（year, month, country, visitors）
  → 既に整形済みの `visitors.csv` を利用
* **為替レート**（currency\_pair, year, month, fx\_rate）
  → 外部API（日次取得し月次平均に集計）

### 3. 派生指標

```text
visitors_growthₜ = (visitorsₜ − visitorsₜ₋₁y) / visitorsₜ₋₁y × 100%
fx_changeₜ       = (fx_rateₜ − fx_rateₜ₋₁y) / fx_rateₜ₋₁y × 100%
```

### 4. 機能要件

1. **KPIパネル**

   * 選択期間の平均fx\_change, 平均visitors\_growth

2. **混合折れ線＋棒グラフ**

   * 棒：月次fx\_change(%)
   * 線：月次visitors\_growth(%)

3. **散布図＋回帰分析**

   * X軸：fx\_change(%)
   * Y軸：visitors\_growth(%)
   * 回帰直線 & 感応度係数（傾き）・R²を注記

4. **国別感応度ランキング**

   * visitors\_sensitivity（回帰の傾き）を国別にソート表示

5. **シナリオ試算パネル**

   * ユーザー入力：想定fx\_change(±%)
   * 推定visitors\_growth & 推定訪日人数を表示

### 5. インタラクション

* 期間レンジ選択
* 通貨ペア切替
* 国／地域マルチセレクト
* シナリオ変動スライダー（±%）

