'use client'; // クライアント側で計算するため use client

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface KeyMetricsHighlightProps {
  latestFxRate: number | null;
  latestVisitorCount: number | null;
  previousMonthVisitorCount: number | null;
  previousYearVisitorCount: number | null;
  latestYear: number | null;
  latestMonth: number | null;
  currencyPair?: string; // オプショナルで通貨ペアを受け取る
}

// 数値を読みやすい形式にフォーマット（例: 1,234,567）
const formatNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return '-';
  return num.toLocaleString();
};

// 変化率を計算し、アイコンとテキストを返すヘルパー関数
const calculateChange = (current: number | null, previous: number | null): { text: string; icon: React.ReactNode; color: string } => {
  if (current === null || previous === null || previous === 0) {
    return { text: '-', icon: <Minus className="h-4 w-4 text-muted-foreground" />, color: 'text-muted-foreground' };
  }

  const change = ((current - previous) / previous) * 100;
  const absChange = Math.abs(change);

  if (change > 0) {
    return { text: `+${change.toFixed(1)}%`, icon: <ArrowUp className="h-4 w-4 text-green-600" />, color: 'text-green-600' };
  } else if (change < 0) {
    return { text: `${change.toFixed(1)}%`, icon: <ArrowDown className="h-4 w-4 text-red-600" />, color: 'text-red-600' };
  } else {
    return { text: '0.0%', icon: <Minus className="h-4 w-4 text-muted-foreground" />, color: 'text-muted-foreground' };
  }
};

export default function KeyMetricsHighlight({
  latestFxRate,
  latestVisitorCount,
  previousMonthVisitorCount,
  previousYearVisitorCount,
  latestYear,
  latestMonth,
  currencyPair = 'USD/JPY', // デフォルト
}: KeyMetricsHighlightProps) {

  const monthOverMonthChange = calculateChange(latestVisitorCount, previousMonthVisitorCount);
  const yearOverYearChange = calculateChange(latestVisitorCount, previousYearVisitorCount);

  const latestPeriodStr = latestYear && latestMonth ? `${latestYear}年${latestMonth}月` : '最新月';

  return (
    <Card>
      <CardHeader>
        <CardTitle>主要指標サマリー</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center md:text-left">
          {/* 為替レート */}
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">為替レート ({currencyPair.replace('JPY', '/JPY')})</p>
            <p className="text-2xl font-bold">
              {latestFxRate ? `${latestFxRate.toFixed(2)} 円` : '-'}
            </p>
            <p className="text-xs text-muted-foreground">最新の月次平均</p>
          </div>

          {/* 最新訪日客数 */}
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">訪日外客数 (総数)</p>
            <p className="text-2xl font-bold">
              {formatNumber(latestVisitorCount)} 人
            </p>
            <p className="text-xs text-muted-foreground">{latestPeriodStr}</p>
          </div>

          {/* 変化率 */}
          <div className="p-4 border rounded-lg space-y-2">
            <div className="flex items-center justify-center md:justify-start space-x-1">
              <span className="text-sm text-muted-foreground">前月比:</span>
              {monthOverMonthChange.icon}
              <span className={`font-semibold ${monthOverMonthChange.color}`}>{monthOverMonthChange.text}</span>
            </div>
            <div className="flex items-center justify-center md:justify-start space-x-1">
              <span className="text-sm text-muted-foreground">前年同月比:</span>
              {yearOverYearChange.icon}
              <span className={`font-semibold ${yearOverYearChange.color}`}>{yearOverYearChange.text}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 