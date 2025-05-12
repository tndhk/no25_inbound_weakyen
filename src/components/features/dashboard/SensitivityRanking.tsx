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
import { Card, CardHeader, CardContent } from "@/components/ui/card";

const prisma = new PrismaClient();

interface SensitivityRankingProps {
  numberOfMonths: number;
  currencyPair: string;
  // allCountries: string[]; // 表示する国のリスト。propsで渡すか、コンポーネント内で取得するか検討。
                       // ここでは主要国を固定で定義するが、将来的には動的に。
}

interface CountrySensitivity {
  country: string;
  sensitivity: number | null; // 回帰の傾き
  rSquared: number | null; // 参考情報として
  dataPointsCount: number;
}

// 主要国リスト (visitors.csvに存在する国をベースに選定、または別途定義)
// ここでは仮でいくつかリストアップ。実際にはDBから取得や、より多くの国を対象にできる
const TARGET_COUNTRIES_FOR_RANKING = [
  '韓国', '台湾', '香港', 'タイ', 'シンガポール', 'マレーシア', 
  'インドネシア', 'フィリピン', 'ベトナム', 'インド', '豪州', '米国', 
  'カナダ', '英国', 'ドイツ', 'フランス', 'イタリア', 'ロシア', 'スペイン', '中国'
  // 「総数」は国別ではないので除外
];

async function calculateSensitivityForCountry(
  country: string,
  currencyPair: string,
  numberOfMonths: number
): Promise<CountrySensitivity | null> {
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

  if (dataPoints.length < 5) { // 十分なデータポイントがない場合は計算しない (閾値は調整可能)
    // console.log(`Skipping sensitivity for ${country} due to insufficient data points: ${dataPoints.length}`);
    return {
        country,
        sensitivity: null,
        rSquared: null,
        dataPointsCount: dataPoints.length
    };
  }

  const regressionResult = calculateLinearRegression(dataPoints);

  return {
    country,
    sensitivity: regressionResult ? regressionResult.slope : null,
    rSquared: regressionResult ? regressionResult.rSquared : null,
    dataPointsCount: dataPoints.length,
  };
}

export default async function SensitivityRanking({
  numberOfMonths,
  currencyPair,
}: SensitivityRankingProps) {
  const sensitivities: CountrySensitivity[] = [];

  // ここで実際にDBに存在する国の一覧を取得する方が望ましい
  // const allDbCountries = await prisma.visitor.findMany({ select: {country: true}, distinct: ['country']}).then(res => res.map(c=>c.country));
  // const countriesToProcess = TARGET_COUNTRIES_FOR_RANKING.filter(c => allDbCountries.includes(c));
  const countriesToProcess = TARGET_COUNTRIES_FOR_RANKING; // 今回は固定リストを使用

  for (const country of countriesToProcess) {
    if (country === '総数') continue; // 「総数」は個別の国ではないためスキップ
    const result = await calculateSensitivityForCountry(country, currencyPair, numberOfMonths);
    if (result) {
      sensitivities.push(result);
    }
  }

  // 感応度(sensitivity)の降順でソート (nullの場合は最後に)
  const sortedSensitivities = sensitivities.sort((a, b) => {
    if (a.sensitivity === null) return 1;
    if (b.sensitivity === null) return -1;
    return b.sensitivity - a.sensitivity; 
  });

  if (sortedSensitivities.filter(s => s.sensitivity !== null).length === 0) { // 有効な感応度データがない場合
    return (
      <Card>
        <CardHeader>
            <h3 className="text-lg font-semibold">国別 為替感応度ランキング ({currencyPair}, 過去{numberOfMonths}ヶ月)</h3>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground p-4 text-center">ランキングを表示するための十分なデータがありません。計算期間や通貨ペアを変更してみてください。</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
        <CardHeader>
            <h3 className="text-lg font-semibold">国別 為替感応度ランキング ({currencyPair}, 過去{numberOfMonths}ヶ月)</h3>
        </CardHeader>
        <CardContent className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]">順位</TableHead>
                        <TableHead>国・地域</TableHead>
                        <TableHead className="text-right">為替感応度 (傾き)</TableHead>
                        <TableHead className="text-right">決定係数 (R²)</TableHead>
                        <TableHead className="text-right">データ点数</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedSensitivities.map((item, index) => (
                        <TableRow key={item.country}>
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell>{item.country}</TableCell>
                            <TableCell className="text-right">
                                {item.sensitivity !== null ? item.sensitivity.toFixed(3) : 'N/A'}
                            </TableCell>
                            <TableCell className="text-right">
                                {item.rSquared !== null ? item.rSquared.toFixed(3) : 'N/A'}
                            </TableCell>
                            <TableCell className="text-right">{item.dataPointsCount}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <p className="text-xs text-muted-foreground mt-2">
                為替感応度: 為替変動率(%)が1%変化した際の、訪日客数伸び率(%)の変化量を示します。絶対値が大きいほど影響を受けやすいことを意味します。<br/>
                決定係数 (R²): 回帰式の当てはまりの良さを示します (0〜1)。1に近いほど、為替変動率で訪日客数伸び率の変動をよく説明できることを意味します。<br/>
                データ点数が少ない場合、結果の信頼性は低くなります。
            </p>
        </CardContent>
    </Card>
  );
} 