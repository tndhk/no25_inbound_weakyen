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
} from 'recharts';

export interface ChartDataItem {
  monthYear: string; // "YYYY-MM" 形式
  fxChange: number | null;
  visitorGrowth: number | null;
}

interface MixedChartClientProps {
  data: ChartDataItem[];
}

export default function MixedChartClient({ data }: MixedChartClientProps) {
  if (!data || data.length === 0) {
    return <p className="text-muted-foreground p-4 text-center">表示可能な時系列データがありません。フィルター条件を確認してください。</p>;
  }

  const validData = data.map(item => ({
    ...item,
    fxChange: typeof item.fxChange === 'number' ? item.fxChange : undefined,
    visitorGrowth: typeof item.visitorGrowth === 'number' ? item.visitorGrowth : undefined,
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart
        data={validData}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="monthYear" />
        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" label={{ value: '為替変動率 (%)', angle: -90, position: 'insideLeft' }} />
        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" label={{ value: '訪日客数伸び率 (%)', angle: -90, position: 'insideRight' }}/>
        <Tooltip 
            formatter={(value, name, props) => {
                if (name === '為替変動率') return [`${value}%`, name];
                if (name === '訪日客数伸び率') return [`${value}%`, name];
                return [value, name];
            }}
        />
        <Legend />
        <Bar yAxisId="left" dataKey="fxChange" name="為替変動率" fill="#8884d8" barSize={20}/>
        <Line yAxisId="right" type="monotone" dataKey="visitorGrowth" name="訪日客数伸び率" stroke="#82ca9d" activeDot={{ r: 8 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
} 