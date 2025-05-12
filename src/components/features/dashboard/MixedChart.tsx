// import { getMonthlyFxRates } from "@/lib/data/fxData"; // 不要
// import { getMonthlyVisitorCounts } from "@/lib/data/visitorData"; // 不要
import { PrismaClient } from '@prisma/client';
import { subMonths, getYear, getMonth, format } from 'date-fns';
import MixedChartClient, { ChartDataItem } from './MixedChartClient'; // ChartDataItem をインポート
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const prisma = new PrismaClient();

// データ取得関数をコンポーネント内に移動し、戻り値の型を定義
async function getMonthlyData(
  country: string, 
  currencyPair: string, 
  numberOfMonths: number
): Promise<ChartDataItem[]> { // 戻り値の型を ChartDataItem[] に指定
  const today = new Date();
  const data: ChartDataItem[] = [];

  for (let i = numberOfMonths - 1; i >= 0; i--) {
    const targetDate = subMonths(today, i);
    const year = getYear(targetDate);
    const month = getMonth(targetDate) + 1;

    const fxRateEntry = await prisma.fxRate.findFirst({
      where: { currencyPair, year, month },
    });

    const visitorEntry = await prisma.visitor.findFirst({
      where: { country, year, month },
    });

    // MixedChartClient が期待するデータ形式に合わせる
    data.push({
      monthYear: format(targetDate, 'yyyy-MM'), 
      lineValue: fxRateEntry?.fxRate ?? null, // lineValue として為替レートを渡す
      barValue: visitorEntry?.visitors ?? null, // barValue として訪日客数を渡す
    });
  }
  return data;
}


interface MixedChartProps {
  numberOfMonths: number;
  currencyPair: string;
  country: string;
}

export default async function MixedChart({
  numberOfMonths,
  currencyPair,
  country,
}: MixedChartProps) {
  const monthlyData = await getMonthlyData(country, currencyPair, numberOfMonths);

  return (
    <Card>
      <CardHeader>
        {/* <CardTitle>為替変動と訪日客数伸び率</CardTitle> */}
        <CardTitle>為替レートと訪日客数の推移 ({country}, {currencyPair})</CardTitle>
        <CardDescription>
          過去{numberOfMonths}ヶ月間の月次データ。
          左軸: 訪日客数(棒)、右軸: 為替レート(線)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <MixedChartClient 
          data={monthlyData} 
          // lineDataKey, barDataKey, xAxisDataKey は MixedChartClient 内部で固定されている想定
          lineName={`為替レート (${currencyPair})`}
          barName={`訪日客数 (${country})`}
          yAxisLabelLeft="訪日客数 (人)"
          yAxisLabelRight="為替レート (円)"
        />
      </CardContent>
    </Card>
  );
} 