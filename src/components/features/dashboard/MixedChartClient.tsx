'use client';

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Label,
} from 'recharts';

export interface ChartDataItem {
  monthYear: string; // "YYYY-MM" 形式
  lineValue: number | null; // 線グラフの値
  barValue: number | null;  // 棒グラフの値
}

interface MixedChartClientProps {
  data: ChartDataItem[];
  lineName: string;
  barName: string;
  yAxisLabelLeft: string;
  yAxisLabelRight: string;
}

export default function MixedChartClient({
  data,
  lineName,
  barName,
  yAxisLabelLeft,
  yAxisLabelRight,
}: MixedChartClientProps) {
  if (!data || data.length === 0) {
    return <p className="text-muted-foreground p-4 text-center">表示可能な時系列データがありません。フィルター条件を確認してください。</p>;
  }

  const validData = data.map(item => ({
    ...item,
    lineValue: typeof item.lineValue === 'number' ? item.lineValue : undefined,
    barValue: typeof item.barValue === 'number' ? item.barValue : undefined,
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart
        data={validData}
        margin={{
          top: 20,
          right: 30,
          left: 30,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="monthYear" />
        <YAxis 
          yAxisId="left" 
          orientation="left" 
          stroke="#8884d8"
        >
          <Label value={yAxisLabelLeft} angle={-90} position='insideLeft' style={{ textAnchor: 'middle' }} offset={-20} />
        </YAxis>
        <YAxis 
          yAxisId="right" 
          orientation="right" 
          stroke="#82ca9d"
        >
           <Label value={yAxisLabelRight} angle={-90} position='insideRight' style={{ textAnchor: 'middle' }} offset={-10}/>
        </YAxis>
        <Tooltip 
            formatter={(value: number | string | Array<number | string>, name: string) => {
                const formattedValue = typeof value === 'number' ? value.toLocaleString() : value;
                return [formattedValue, name];
            }}
        />
        <Legend />
        <Bar yAxisId="left" dataKey="barValue" name={barName} fill="#8884d8" barSize={20}/>
        <Line yAxisId="right" type="monotone" dataKey="lineValue" name={lineName} stroke="#82ca9d" activeDot={{ r: 8 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
} 