import { Suspense } from 'react';
// import KpiPanel from "@/components/features/dashboard/KpiPanel"; // 詳細分析へ移動
import MixedChart from "@/components/features/dashboard/MixedChart";
import ScatterPlotWithRegression from "@/components/features/dashboard/ScatterPlotWithRegression";
import DashboardFilters from "@/components/features/dashboard/DashboardFilters";
import SensitivityRanking from "@/components/features/dashboard/SensitivityRanking";
import { ScenarioSimulator } from "@/components/features/dashboard/ScenarioSimulator";
import { PrismaClient } from '@prisma/client';

// スケルトンコンポーネントのインポート
// import { KpiPanelSkeleton } from '@/components/features/dashboard/KpiPanelSkeleton'; // KeyMetricsHighlight 用を別途用意するか検討
import { ChartSkeleton } from '@/components/features/dashboard/ChartSkeleton';
import { TableSkeleton } from '@/components/features/dashboard/TableSkeleton';

// アコーディオンコンポーネントのインポート
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// KeyMetricsHighlightコンポーネントのインポート
import KeyMetricsHighlight from '@/components/features/dashboard/KeyMetricsHighlight';

const prisma = new PrismaClient();

interface DashboardPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

// データ取得関数
async function getLatestFxRate(currencyPair: string = 'USDJPY'): Promise<number | null> {
  try {
    const rate = await prisma.fxRate.findFirst({
      where: { currencyPair },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
    return rate?.fxRate ?? null;
  } catch (error) {
    console.error(`Error fetching latest FX rate for ${currencyPair}:`, error);
    return null;
  }
}

async function getLatestVisitorData(country: string = '総数'): Promise<{
  latestCount: number | null;
  previousMonthCount: number | null;
  previousYearCount: number | null;
  latestYear: number | null;
  latestMonth: number | null;
}> {
  try {
    const latestEntry = await prisma.visitor.findFirst({
      where: { country },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    if (!latestEntry) {
      return { latestCount: null, previousMonthCount: null, previousYearCount: null, latestYear: null, latestMonth: null };
    }

    const latestYear = latestEntry.year;
    const latestMonth = latestEntry.month;

    // 前月データ取得
    let prevMonth = latestMonth - 1;
    let prevMonthYear = latestYear;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevMonthYear -= 1;
    }
    const previousMonthEntry = await prisma.visitor.findFirst({
      where: { country, year: prevMonthYear, month: prevMonth },
    });

    // 前年同月データ取得
    const previousYearEntry = await prisma.visitor.findFirst({
      where: { country, year: latestYear - 1, month: latestMonth },
    });

    return {
      latestCount: latestEntry.visitors,
      previousMonthCount: previousMonthEntry?.visitors ?? null,
      previousYearCount: previousYearEntry?.visitors ?? null,
      latestYear: latestYear,
      latestMonth: latestMonth,
    };
  } catch (error) {
    console.error(`Error fetching visitor data for ${country}:`, error);
    return { latestCount: null, previousMonthCount: null, previousYearCount: null, latestYear: null, latestMonth: null };
  }
}

async function getAvailableCountries(): Promise<string[]> {
  try {
    const countries = await prisma.visitor.findMany({
      select: { country: true },
      distinct: ['country'],
      orderBy: { country: 'asc' },
    });
    return countries.map(c => c.country);
  } catch (error) {
    console.error("Error fetching countries:", error);
    return [];
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
}: DashboardPageProps ) {
  // searchParams処理 (変更なし)
  const params = await searchParams;
  const getStringParam = (key: string, defaultValue: string): string => {
    const value = params[key];
    if (!value) return defaultValue;
    return Array.isArray(value) ? value[0] : value;
  };
  console.log("searchParams on page load:", params);

  const availableCountries = await getAvailableCountries();
  const availableCurrencyPairs = await getAvailableCurrencyPairs();

  // フィルター値の取得と安全な値へのフォールバック (変更なし)
  const periodMonths = parseInt(getStringParam('periodMonths', '12'), 10);
  const currencyPair = getStringParam('currencyPair', availableCurrencyPairs.length > 0 ? availableCurrencyPairs[0] : 'USDJPY');
  const country = getStringParam('country', availableCountries.length > 0 ? availableCountries[0] : '総数');
  const safeCountry = availableCountries.includes(country) ? country : (availableCountries.length > 0 ? availableCountries[0] : '韓国'); // "総数"がない場合の代替
  const safeCurrencyPair = availableCurrencyPairs.includes(currencyPair) ? currencyPair : (availableCurrencyPairs.length > 0 ? availableCurrencyPairs[0] : 'USDJPY');

  // 主要指標データの取得
  const [latestFxRate, latestVisitorData] = await Promise.all([
    getLatestFxRate(safeCurrencyPair),
    getLatestVisitorData(safeCountry) // 国別フィルターも反映させる
  ]);

  return (
    <div className="space-y-8">
      {/* 1. 主要指標ハイライト */}
      <section>
        {/* <Suspense fallback={<div>Loading Key Metrics...</div>}> */}
          <KeyMetricsHighlight 
            latestFxRate={latestFxRate}
            latestVisitorCount={latestVisitorData.latestCount}
            previousMonthVisitorCount={latestVisitorData.previousMonthCount}
            previousYearVisitorCount={latestVisitorData.previousYearCount}
            latestYear={latestVisitorData.latestYear}
            latestMonth={latestVisitorData.latestMonth}
            currencyPair={safeCurrencyPair}
          />
        {/* </Suspense> */}
      </section>

      {/* 2. フィルター */}
      <DashboardFilters 
        availableCountries={availableCountries}
        availableCurrencyPairs={availableCurrencyPairs}
      />

      {/* 3. 主要グラフ: 混合グラフ */}
      <section>
        <Suspense fallback={<ChartSkeleton />}>
          <MixedChart 
            numberOfMonths={periodMonths}
            currencyPair={safeCurrencyPair}
            country={safeCountry}
          />
        </Suspense>
      </section>

      {/* 4. 詳細分析 (アコーディオン) */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="detailed-analysis">
          <AccordionTrigger className="text-lg font-semibold">詳細分析を開く</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-8 pt-4">
              {/* 感応度ランキング */}
              <section>
                <Suspense fallback={<TableSkeleton />}>
                  <SensitivityRanking 
                    numberOfMonths={periodMonths}
                    currencyPair={safeCurrencyPair}
                  />
                </Suspense>
              </section>

              {/* 散布図＋回帰分析 */}
              <section>
                <Suspense fallback={<ChartSkeleton />}>
                  <ScatterPlotWithRegression 
                    numberOfMonths={periodMonths}
                    currencyPair={safeCurrencyPair}
                    country={safeCountry}
                  />
                </Suspense>
              </section>

              {/* シナリオシミュレーター */}
              <section>
                 {/* シナリオシミュレーターはクライアント側で完結する部分が多いのでSuspenseは不要かも */}
                <ScenarioSimulator 
                  countries={availableCountries}
                  currencyPairs={availableCurrencyPairs}
                />
              </section>

              {/* 元のKPIパネルもここに配置 */}
              {/* <section>
                <Suspense fallback={<KpiPanelSkeleton />}>
                  <KpiPanel 
                    numberOfMonths={periodMonths}
                    currencyPair={safeCurrencyPair}
                    country={safeCountry}
                  />
                </Suspense>
              </section> */} 
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
} 