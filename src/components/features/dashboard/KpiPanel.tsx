import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'; // Shadcn/uiのCardを想定 (パスを修正)
import { calculateFxChange } from '@/lib/calculations/fxMetrics';
import { calculateVisitorGrowth } from '@/lib/calculations/visitorMetrics';
import {
  subMonths,
  getYear,
  getMonth,
  startOfMonth,
  endOfMonth,
} from 'date-fns';

interface KpiPanelProps {
  // 期間をどのように指定するか (例: "last3months", "last6months", "last12months" や、開始日・終了日)
  // ここでは簡易的に過去Nヶ月を指定する想定
  numberOfMonths: number;
  currencyPair: string; // 例: "USDJPY"
  country: string; // 例: "韓国" (「総数」なども考慮する必要があるかも)
}

// 平均値を計算するヘルパー関数
function calculateAverage(numbers: (number | null)[]): number | null {
  const validNumbers = numbers.filter((n) => n !== null && !isNaN(n)) as number[];
  if (validNumbers.length === 0) return null;
  const sum = validNumbers.reduce((acc, val) => acc + val, 0);
  return parseFloat((sum / validNumbers.length).toFixed(2));
}

export default async function KpiPanel({ 
    numberOfMonths,
    currencyPair,
    country 
}: KpiPanelProps) {
  const today = new Date();
  const fxChanges: (number | null)[] = [];
  const visitorGrowths: (number | null)[] = [];

  for (let i = 0; i < numberOfMonths; i++) {
    const targetDateInitial = subMonths(today, i);
    // 実際のデータは前月までのものが最新と仮定する場合、さらに1ヶ月引くなどの調整が必要かも
    // ここでは単純にiヶ月前の月のデータを取得しようと試みる
    const year = getYear(targetDateInitial);
    const month = getMonth(targetDateInitial) + 1; // getMonthは0始まり

    // FX Change
    const fxChange = await calculateFxChange(currencyPair, year, month);
    fxChanges.push(fxChange);

    // Visitor Growth
    const visitorGrowth = await calculateVisitorGrowth(country, year, month);
    visitorGrowths.push(visitorGrowth);
  }

  const avgFxChange = calculateAverage(fxChanges);
  const avgVisitorGrowth = calculateAverage(visitorGrowths);

  const fxChangeText = avgFxChange !== null ? `${avgFxChange}%` : `データが見つかりません (${currencyPair})`;
  const visitorGrowthText = avgVisitorGrowth !== null ? `${avgVisitorGrowth}%` : `データが見つかりません (${country})`;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            平均為替変動率 ({currencyPair})
          </CardTitle>
          {/* <DollarSign className="h-4 w-4 text-muted-foreground" /> */}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {fxChangeText}
          </div>
          <p className="text-xs text-muted-foreground">
            過去{numberOfMonths}ヶ月平均
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            平均訪日客数伸び率 ({country})
          </CardTitle>
          {/* <Users className="h-4 w-4 text-muted-foreground" /> */}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {visitorGrowthText}
          </div>
          <p className="text-xs text-muted-foreground">
            過去{numberOfMonths}ヶ月平均
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 