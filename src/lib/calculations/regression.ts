import { linearRegression, rSquared } from 'simple-statistics';

export interface RegressionInputPoint {
  x: number; // fx_change
  y: number; // visitors_growth
}

export interface RegressionResult {
  slope: number; // 傾き (感応度係数)
  intercept: number; // 切片
  rSquared: number; // 決定係数 R²
  equation: (x: number) => number; // 回帰直線の方程式 y = mx + b
}

/**
 * 線形回帰分析を実行し、傾き、切片、決定係数、および回帰直線の方程式を返します。
 * @param points - {x, y} のペアの配列。xは為替変動率、yは訪日客数伸び率。
 * @returns 回帰分析の結果。計算不可能な場合は null を返します。
 */
export function calculateLinearRegression(
  points: RegressionInputPoint[]
): RegressionResult | null {
  // simple-statisticsは [x, y] の形式の配列を要求する
  const dataPairs: [number, number][] = points.map(p => [p.x, p.y]);

  if (dataPairs.length < 2) {
    // 回帰分析には少なくとも2点が必要
    return null;
  }

  try {
    const lr = linearRegression(dataPairs);
    const m = lr.m; // slope (傾き)
    const b = lr.b; // intercept (切片)

    // rSquaredの計算には、元のデータペアと回帰直線の方程式が必要
    const r2 = rSquared(dataPairs, (x) => m * x + b);

    return {
      slope: parseFloat(m.toFixed(3)), // 小数点以下3桁程度で丸める
      intercept: parseFloat(b.toFixed(3)),
      rSquared: parseFloat(r2.toFixed(3)),
      equation: (x: number) => m * x + b,
    };
  } catch (error) {
    console.error('Error during linear regression calculation:', error);
    return null;
  }
} 