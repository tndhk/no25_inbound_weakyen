import { calculateFxChange } from '@/lib/calculations/fxMetrics';
import { calculateVisitorGrowth } from '@/lib/calculations/visitorMetrics';
import {
  calculateLinearRegression,
  RegressionInputPoint,
} from '@/lib/calculations/regression';
import {
  subMonths,
  getYear,
  getMonth,
} from 'date-fns';
import ScatterPlotClient from './ScatterPlotClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface ScatterPlotWithRegressionProps {
  numberOfMonths: number;
  currencyPair: string;
  country: string;
}

export default async function ScatterPlotWithRegression({
  numberOfMonths,
  currencyPair,
  country,
}: ScatterPlotWithRegressionProps) {
  const today = new Date();
  const dataPoints: RegressionInputPoint[] = [];

  for (let i = 0; i < numberOfMonths; i++) {
    const targetDateInitial = subMonths(today, i);
    const year = getYear(targetDateInitial);
    const month = getMonth(targetDateInitial) + 1;

    const fxChange = await calculateFxChange(currencyPair, year, month);
    const visitorGrowth = await calculateVisitorGrowth(country, year, month);

    if (fxChange !== null && visitorGrowth !== null) {
      dataPoints.push({ x: fxChange, y: visitorGrowth });
    }
  }

  // データを新しいものから古いものへ並び替える (calculateLinearRegression に渡す順序は影響しないが、表示上の一貫性のため)
  // dataPoints.reverse(); // 必要であれば。今回は取得順 (新しい月から古い月へ)

  const regressionResult = calculateLinearRegression(dataPoints);
  
  // 安全のため: 明示的に必要なプロパティのみを持つオブジェクトを作成
  const safeRegressionResult = regressionResult ? {
    slope: regressionResult.slope,
    intercept: regressionResult.intercept,
    rSquared: regressionResult.rSquared
  } : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>為替変動と訪日客数伸び率の相関 ({country}, {currencyPair})</CardTitle>
        <CardDescription>
          過去{numberOfMonths}ヶ月間の月次データを使用。
          横軸: 為替変動率(%)、縦軸: 訪日客数伸び率(%)。
          オレンジの線は回帰直線を示します。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScatterPlotClient
          data={dataPoints}
          regressionResult={safeRegressionResult}
          // xAxisLabelとyAxisLabelはScatterPlotClient側でデフォルトがあるので、ここでは設定しない
          // 必要であれば詳細なラベルをここで上書きも可能
        />
      </CardContent>
    </Card>
  );
} 