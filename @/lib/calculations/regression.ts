import * as ss from 'simple-statistics';

export interface RegressionInputPoint {
  x: number; // 為替変動率 (%)
  y: number; // 訪日外客数成長率 (%)
}

export interface RegressionResult {
  slope: number;
  intercept: number;
  rSquared: number;
  // equation: (x: number) => number; // この行をコメントアウト
}

/**
 * 線形回帰分析を計算します。
 * @param points - { x: 為替変動率, y: 訪日外客数成長率 } の配列
 * @returns 回帰分析結果 (傾き、切片、決定係数) またはエラー時 null
 */
export function calculateLinearRegression(
  points: RegressionInputPoint[]
): RegressionResult | null {
  if (points.length < 2) {
    // 回帰分析には少なくとも2点が必要
    return null;
  }

  try {
    const dataForRegression = points.map(p => [p.x, p.y]);
    const result = ss.linearRegression(dataForRegression);

    if (result && typeof result.m === 'number' && typeof result.b === 'number') {
      const rSquared = ss.rSquared(dataForRegression, (x) => result.m * x + result.b);
      
      // 関数プロパティを含まない新しいオブジェクトを明示的に作成
      const cleanResult: RegressionResult = {
        slope: result.m,
        intercept: result.b,
        rSquared: rSquared,
      };
      
      return cleanResult;
    }
    return null;
  } catch (error) {
    console.error("Error in linear regression calculation:", error);
    return null;
  }
}
