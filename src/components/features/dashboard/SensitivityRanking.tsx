import { PrismaClient } from '@prisma/client';
import {
  calculateLinearRegression,
  RegressionInputPoint,
} from '@/lib/calculations/regression';
import { calculateFxChange } from '@/lib/calculations/fxMetrics';
import { calculateVisitorGrowth } from '@/lib/calculations/visitorMetrics';
import {
  subMonths,
  getYear,
  getMonth,
} from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; // Shadcn/uiのTableを想定
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";

const prisma = new PrismaClient();

interface SensitivityData {
  country: string;
  influence: number | null; // "感応度" を "影響度" に変更
  rSquared: number | null; // 決定係数も参考情報として表示
}

// 主要国リスト (必要に応じて調整)
const MAJOR_COUNTRIES = [
  '韓国', '台湾', '香港', '中国', 'タイ', 'シンガポール', 'マレーシア', 
  'フィリピン', 'ベトナム', 'インドネシア', 'インド', '豪州', '米国', 
  'カナダ', 'メキシコ', '英国', 'ドイツ', 'フランス', 'イタリア', 'スペイン', 'ロシア'
];

async function calculateCountrySensitivity(
  country: string, 
  currencyPair: string, 
  numberOfMonths: number
): Promise<SensitivityData | null> {
  const today = new Date();
  const dataPoints: RegressionInputPoint[] = [];

  for (let i = 0; i < numberOfMonths; i++) {
    const targetDateInitial = subMonths(today, i);
    const year = getYear(targetDateInitial);
    const month = getMonth(targetDateInitial) + 1;

    const fxChange = await calculateFxChange(currencyPair, year, month);
    const visitorGrowth = await calculateVisitorGrowth(country, year, month);

    // データがない場合はスキップ
    if (fxChange === null || visitorGrowth === null) continue;

    dataPoints.push({ x: fxChange, y: visitorGrowth });
  }

  // データが不足している場合は計算不可
  if (dataPoints.length < 5) { // 信頼性のため最低5点必要とする（要調整）
    return { country, influence: null, rSquared: null };
  }

  const regressionResult = calculateLinearRegression(dataPoints);

  return {
    country,
    influence: regressionResult?.slope ?? null, // slope を influence として返す
    rSquared: regressionResult?.rSquared ?? null,
  };
}

interface SensitivityRankingProps {
  numberOfMonths: number;
  currencyPair: string;
}

export default async function SensitivityRanking({
  numberOfMonths,
  currencyPair,
}: SensitivityRankingProps) {

  const sensitivityResults = await Promise.all(
    MAJOR_COUNTRIES.map(country => 
      calculateCountrySensitivity(country, currencyPair, numberOfMonths)
    )
  );

  // 計算結果があり、influence が null でないものだけをフィルタリングし、influence で降順ソート
  const validResults = sensitivityResults
    .filter((result): result is SensitivityData & { influence: number } => result !== null && result.influence !== null)
    .sort((a, b) => a.influence - b.influence); // 傾きがマイナス（円安で増加）の方が影響度大と解釈し、昇順ソート？ → いや、係数の絶対値の大きさで判断すべき？ ここでは係数そのものでソート

  // R^2 が低いものは参考程度とする注意書きが必要か？

  return (
    <Card>
      <CardHeader>
        <CardTitle>国別 為替レート影響度ランキング</CardTitle>
        <CardDescription>
          為替レート(1%の変化)が各国の訪日客数伸び率に与える影響度の大きさを示します。
          係数がマイナスの場合、円安が進むと訪日客数が増加する傾向を示します。
          (通貨ペア: {currencyPair}, 過去{numberOfMonths}ヶ月データで算出)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">順位</TableHead>
              <TableHead>国・地域</TableHead>
              <TableHead className="text-right">影響度係数</TableHead>
              <TableHead className="text-right">決定係数(R²)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {validResults.length > 0 ? (
              validResults.map((result, index) => (
                <TableRow key={result.country}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>{result.country}</TableCell>
                  <TableCell className="text-right">{result.influence.toFixed(3)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{result.rSquared !== null ? result.rSquared.toFixed(3) : '-'}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">ランキングデータを計算できませんでした。データ期間や通貨ペアを確認してください。</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 