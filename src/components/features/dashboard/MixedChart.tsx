import { calculateFxChange } from '@/lib/calculations/fxMetrics';
import { calculateVisitorGrowth } from '@/lib/calculations/visitorMetrics';
import {
  subMonths,
  getYear,
  getMonth,
  format
} from 'date-fns';
import MixedChartClient, { ChartDataItem } from './MixedChartClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface MixedChartProps {
  numberOfMonths: number;
  currencyPair: string;
  country: string;
}

export default async function MixedChart({ 
    numberOfMonths,
    currencyPair,
    country 
}: MixedChartProps) {
  const today = new Date();
  const chartData: ChartDataItem[] = [];

  for (let i = numberOfMonths - 1; i >= 0; i--) {
    const targetDateInitial = subMonths(today, i);
    const year = getYear(targetDateInitial);
    const month = getMonth(targetDateInitial) + 1;
    const monthYearLabel = format(targetDateInitial, 'yyyy-MM');

    const fxChange = await calculateFxChange(currencyPair, year, month);
    const visitorGrowth = await calculateVisitorGrowth(country, year, month);

    chartData.push({
      monthYear: monthYearLabel,
      fxChange: fxChange,
      visitorGrowth: visitorGrowth,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>為替変動と訪日客数伸び率 ({country}, {currencyPair})</CardTitle>
        <CardDescription>過去{numberOfMonths}ヶ月間の推移</CardDescription>
      </CardHeader>
      <CardContent>
        <MixedChartClient data={chartData} />
      </CardContent>
    </Card>
  );
} 