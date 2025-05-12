import { Suspense } from 'react';
import KpiPanel from "@/components/features/dashboard/KpiPanel";
import MixedChart from "@/components/features/dashboard/MixedChart";
import ScatterPlotWithRegression from "@/components/features/dashboard/ScatterPlotWithRegression";
import DashboardFilters from "@/components/features/dashboard/DashboardFilters";
import SensitivityRanking from "@/components/features/dashboard/SensitivityRanking";
import { ScenarioSimulator } from "@/components/features/dashboard/ScenarioSimulator";
import { PrismaClient } from '@prisma/client';

// スケルトンコンポーネントのインポート
import { KpiPanelSkeleton } from '@/components/features/dashboard/KpiPanelSkeleton';
import { ChartSkeleton } from '@/components/features/dashboard/ChartSkeleton';
import { TableSkeleton } from '@/components/features/dashboard/TableSkeleton';

const prisma = new PrismaClient();

interface DashboardPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

async function getAvailableCountries(): Promise<string[]> {
  try {
    const countries = await prisma.visitor.findMany({
      select: { country: true },
      distinct: ['country'],
      orderBy: { country: 'asc' },
    });
    // "総数" が含まれていれば先頭に移動、なければ追加することを検討
    // ここではDBから取得したものをそのまま返す
    return countries.map(c => c.country);
  } catch (error) {
    console.error("Error fetching countries:", error);
    return []; // エラー時は空配列
  }
}

async function getAvailableCurrencyPairs(): Promise<string[]> {
  try {
    const pairs = await prisma.fxRate.findMany({
      select: { currencyPair: true },
      distinct: ['currencyPair'],
      orderBy: { currencyPair: 'asc' },
    });
    return pairs.map(p => p.currencyPair);
  } catch (error) {
    console.error("Error fetching currency pairs:", error);
    return [];
  }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  // searchParamsを非同期で処理し、配列の場合は最初の値を使用
  const params = await searchParams;
  const getStringParam = (key: string, defaultValue: string): string => {
    const value = params[key];
    if (!value) return defaultValue;
    return Array.isArray(value) ? value[0] : value;
  };
  
  console.log("searchParams on page load:", params);

  const availableCountries = await getAvailableCountries();
  const availableCurrencyPairs = await getAvailableCurrencyPairs();

  // searchParamsから値を取得、なければデフォルト値を設定
  const periodMonths = parseInt(getStringParam('periodMonths', '12'), 10);
  const currencyPair = getStringParam('currencyPair', availableCurrencyPairs.length > 0 ? availableCurrencyPairs[0] : 'USDJPY');
  const country = getStringParam('country', availableCountries.length > 0 ? availableCountries[0] : '総数');

  // visitors.csvに「韓国」は存在するが、「総数」は存在しない場合があるため、デフォルト値を調整。
  // 実際には、availableCountriesに「総数」が含まれているか確認し、なければ最初の国を選択するなどのロジックが良い。
  const safeCountry = availableCountries.includes(country) ? country : (availableCountries.length > 0 ? availableCountries[0] : '韓国');
  const safeCurrencyPair = availableCurrencyPairs.includes(currencyPair) ? currencyPair : (availableCurrencyPairs.length > 0 ? availableCurrencyPairs[0] : 'USDJPY');

  return (
    <div className="space-y-8">
      <DashboardFilters 
        availableCountries={availableCountries}
        availableCurrencyPairs={availableCurrencyPairs}
      />

      {/* 1行目: KPIと感応度ランキング */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section>
          {/* <h2 className="text-xl font-semibold mb-3">主要KPI</h2> */}
          <Suspense fallback={<KpiPanelSkeleton />}>
            <KpiPanel 
              numberOfMonths={periodMonths}
              currencyPair={safeCurrencyPair}
              country={safeCountry}
            />
          </Suspense>
        </section>
        <section>
          {/* SensitivityRankingのタイトルはコンポーネント内部で表示 */}
          <Suspense fallback={<TableSkeleton />}>
            <SensitivityRanking 
              numberOfMonths={periodMonths}
              currencyPair={safeCurrencyPair}
            />
          </Suspense>
        </section>
      </div>

      {/* 2行目: 混合グラフと散布図 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section>
          {/* <h2 className="text-xl font-semibold mb-3">為替変動と訪日客数伸び率</h2> */}
          <Suspense fallback={<ChartSkeleton />}>
            <MixedChart 
              numberOfMonths={periodMonths}
              currencyPair={safeCurrencyPair}
              country={safeCountry}
            />
          </Suspense>
        </section>
        <section>
          {/* <h2 className="text-xl font-semibold mb-3">為替変動 vs 訪日客数伸び率 (散布図)</h2> */}
          <Suspense fallback={<ChartSkeleton />}>
            <ScatterPlotWithRegression 
              numberOfMonths={periodMonths}
              currencyPair={safeCurrencyPair}
              country={safeCountry}
            />
          </Suspense>
        </section>
      </div>

      {/* 3行目: シナリオシミュレーター */}
      <div className="grid grid-cols-1 gap-8">
        <section>
          {/* シナリオシミュレーターのタイトルはコンポーネント内部で表示 */}
          <ScenarioSimulator 
            countries={availableCountries}
            currencyPairs={availableCurrencyPairs}
          />
        </section>
      </div>
    </div>
  );
} 