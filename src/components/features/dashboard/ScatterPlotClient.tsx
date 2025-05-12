'use client';

import {
  ScatterChart,
  Scatter,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Label,
} from 'recharts';
import { RegressionInputPoint } from '@/lib/calculations/regression';

// RegressionResultの型を直接定義し直す（equation プロパティなし）
interface ScatterPlotRegressionResult {
  slope: number;
  intercept: number;
  rSquared: number;
}

interface ScatterPlotClientProps {
  data: RegressionInputPoint[];
  regressionResult: ScatterPlotRegressionResult | null;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

export default function ScatterPlotClient({
  data,
  regressionResult,
  xAxisLabel = 'FX Change (%)',
  yAxisLabel = 'Visitor Growth (%)',
}: ScatterPlotClientProps) {
  if (!data || data.length === 0) {
    return <p className="text-muted-foreground p-4 text-center">表示可能な散布図データがありません。フィルター条件を確認してください。</p>;
  }

  // 回帰直線用のデータを準備 (X軸の最小値と最大値から2点を生成)
  let regressionLineData: { x: number; y: number }[] = [];
  if (regressionResult && data.length > 0) {
    const xValues = data.map(p => p.x);
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    regressionLineData = [
      // { x: minX, y: regressionResult.equation(minX) },
      // { x: maxX, y: regressionResult.equation(maxX) },
      { x: minX, y: regressionResult.slope * minX + regressionResult.intercept },
      { x: maxX, y: regressionResult.slope * maxX + regressionResult.intercept },
    ];
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart
          margin={{
            top: 20,
            right: 30,
            bottom: 20, // X軸ラベルスペース確保
            left: 30,  // Y軸ラベルスペース確保
          }}
        >
          <CartesianGrid />
          <XAxis type="number" dataKey="x" name={xAxisLabel} unit="%">
            <Label value={xAxisLabel} offset={-15} position="insideBottom" />
          </XAxis>
          <YAxis type="number" dataKey="y" name={yAxisLabel} unit="%">
            <Label value={yAxisLabel} angle={-90} offset={-20} position="insideLeft" style={{ textAnchor: 'middle' }} />
          </YAxis>
          <Tooltip cursor={{ strokeDasharray: '3 3' }} 
            formatter={(value, name, props) => {
                // props.payload は { x: number, y: number } の形式
                if (props.dataKey === 'x') return [`${value}%`, xAxisLabel];
                if (props.dataKey === 'y') return [`${value}%`, yAxisLabel];
                return [value, name];
            }}
            labelFormatter={(label) => ``} // ツールチップのラベルは非表示
          />
          <Scatter name="データポイント" data={data} fill="#8884d8" />
          {regressionResult && regressionLineData.length > 0 && (
            <Line
              type="linear" // "linear" を指定して点を結ぶ
              dataKey="y"
              data={regressionLineData}
              stroke="#ff7300"
              dot={false}
              activeDot={false}
              name="回帰直線"
              legendType="none"
            />
          )}
        </ScatterChart>
      </ResponsiveContainer>
      {regressionResult && (
        <div className="mt-4 text-sm text-muted-foreground">
          <p>回帰分析結果:</p>
          <ul className="list-disc list-inside">
            <li>傾き (感応度係数): {regressionResult.slope.toFixed(3)}</li>
            <li>切片: {regressionResult.intercept.toFixed(3)}</li>
            <li>決定係数 (R²): {regressionResult.rSquared.toFixed(3)}</li>
            <li>回帰式: y = {regressionResult.slope.toFixed(3)}x + {regressionResult.intercept.toFixed(3)}</li>
          </ul>
        </div>
      )}
    </div>
  );
} 