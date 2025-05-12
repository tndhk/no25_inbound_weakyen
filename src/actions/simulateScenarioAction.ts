'use server';

import { z } from 'zod';
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
  isValid,
  parseISO, // もし日付文字列を扱う場合
} from 'date-fns';

const prisma = new PrismaClient();

// Zodスキーマ定義
// dev-rules/nextjs: Server Action: フォームデータの受け取りとバリデーションにおいて、null, undefined, 空文字列の扱いを明確にし、Zod スキーマで適切に処理すること。
// Zod の preprocess を活用して入力値を期待する型に変換・検証する。
const SimulateScenarioSchema = z.object({
  country: z.string().min(1, { message: "国を選択してください。" }),
  currencyPair: z.string().min(1, { message: "通貨ペアを選択してください。" }),
  basePeriodMonths: z.number().int().positive({ message: "計算期間（月数）は正の整数である必要があります。" }).min(3, {message: "回帰分析のため、計算期間は最低3ヶ月必要です。"}), // 回帰分析に使う期間
  assumedFxChange: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : parseFloat(String(val))),
    z.number({ invalid_type_error: "想定為替変動率は数値で入力してください。" })
     .nullable()
     .refine(val => val !== null, { message: "想定為替変動率を入力してください。" })
  ),
  // 基準となる月を特定するための情報。ここでは簡易に「最新の利用可能な月」の前年同月を基準とする想定。
  // より柔軟にするには、基準年月をユーザーに選択させるか、明確なロジックで決定する必要がある。
});

export interface SimulateScenarioResult {
  estimatedVisitorGrowth: number | null;
  estimatedVisitorCount: number | null;
  baseVisitorCount: number | null; // 参考: 計算の基準となった訪問者数
  baseYearMonth: string | null; // 参考: 計算の基準となった年月 (YYYY-MM)
  sensitivity: number | null;
  intercept: number | null;
  rSquared: number | null;
  errorMessage?: string;
}

export async function simulateScenarioAction(
  prevState: SimulateScenarioResult,
  formData: FormData
): Promise<SimulateScenarioResult> {
  const rawFormData = {
    country: formData.get('country'),
    currencyPair: formData.get('currencyPair'),
    basePeriodMonths: formData.get('basePeriodMonths') ? parseInt(String(formData.get('basePeriodMonths')), 10) : null,
    assumedFxChange: formData.get('assumedFxChange'),
  };

  const validationResult = SimulateScenarioSchema.safeParse(rawFormData);

  if (!validationResult.success) {
    // console.error("Validation errors:", validationResult.error.flatten().fieldErrors);
    // 実際にはエラーメッセージを整形して返すのが良い
    return {
      estimatedVisitorGrowth: null,
      estimatedVisitorCount: null,
      baseVisitorCount: null,
      baseYearMonth: null,
      sensitivity: null,
      intercept: null,
      rSquared: null,
      errorMessage: Object.values(validationResult.error.flatten().fieldErrors).flat().join(' '),
    };
  }

  const {
    country,
    currencyPair,
    basePeriodMonths,
    assumedFxChange,
  } = validationResult.data;

  if (assumedFxChange === null) { // refineでnullを許容しないようにしたが、念のため
    return { /* ... エラー処理 ... */ estimatedVisitorGrowth: null, estimatedVisitorCount: null, baseVisitorCount: null, baseYearMonth: null, sensitivity: null, intercept:null, rSquared: null, errorMessage: "想定為替変動率が不正です。"};
  }

  // 1. 回帰分析のためのデータ収集
  const today = new Date();
  const dataPoints: RegressionInputPoint[] = [];
  for (let i = 0; i < basePeriodMonths; i++) {
    const targetDateInitial = subMonths(today, i + 1); // 最新月を含めず、その前の月から遡る (i+1)
    const year = getYear(targetDateInitial);
    const month = getMonth(targetDateInitial) + 1;
    const fxChange = await calculateFxChange(currencyPair, year, month);
    const visitorGrowth = await calculateVisitorGrowth(country, year, month);
    if (fxChange !== null && visitorGrowth !== null) {
      dataPoints.push({ x: fxChange, y: visitorGrowth });
    }
  }

  if (dataPoints.length < 3) {
    return { /* ... */ estimatedVisitorGrowth: null, estimatedVisitorCount: null, baseVisitorCount: null, baseYearMonth: null, sensitivity: null, intercept:null, rSquared: null,  errorMessage: `回帰分析のためのデータが不足しています (${dataPoints.length}点)。計算期間を長くしてください。` };
  }

  const regressionResult = calculateLinearRegression(dataPoints);
  if (!regressionResult) {
    return { /* ... */ estimatedVisitorGrowth: null, estimatedVisitorCount: null, baseVisitorCount: null, baseYearMonth: null, sensitivity: null, intercept:null, rSquared: null, errorMessage: "回帰分析に失敗しました。" };
  }

  const { slope, intercept, rSquared } = regressionResult;

  // 2. 推定 visitors_growth を計算
  const estimatedGrowth = slope * assumedFxChange + intercept;

  // 3. 推定訪日人数を計算するための基準値を取得
  //    例: 回帰分析に使った期間の「最新月」の前年同月の実績値
  //    より正確には、利用可能な最新の実績月を探し、その前年同月とする
  let latestAvailableYear: number | null = null;
  let latestAvailableMonth: number | null = null;
  let baseVisitors: number | null = null;

  // Visitorテーブルから最新の実績年月を取得 (国指定)
  const latestVisitorRecord = await prisma.visitor.findFirst({
    where: { country: country },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  });

  if (latestVisitorRecord) {
    const prevYearForLatest = latestVisitorRecord.year - 1;
    const monthForLatest = latestVisitorRecord.month;
    const baseVisitorRecord = await prisma.visitor.findUnique({
        where: { year_month_country: { year: prevYearForLatest, month: monthForLatest, country: country } }
    });
    if (baseVisitorRecord && baseVisitorRecord.visitors !== null) {
        baseVisitors = baseVisitorRecord.visitors;
        latestAvailableYear = prevYearForLatest;
        latestAvailableMonth = monthForLatest;
    }
  }
  
  if (baseVisitors === null) {
      // もし上記で見つからなければ、回帰分析に使った期間の最初の月の前年同月を探す、などのフォールバックが必要だが、ここでは簡略化
      console.warn(`Base visitor count not found for ${country} to estimate absolute numbers.`);
      // return { /* ... */ errorMessage: "推定人数の計算に必要な基準訪問者数が見つかりませんでした。" };
  }

  const estimatedCount = baseVisitors !== null ? baseVisitors * (1 + estimatedGrowth / 100) : null;

  return {
    estimatedVisitorGrowth: parseFloat(estimatedGrowth.toFixed(2)),
    estimatedVisitorCount: estimatedCount !== null ? Math.round(estimatedCount) : null,
    baseVisitorCount: baseVisitors,
    baseYearMonth: latestAvailableYear && latestAvailableMonth ? `${latestAvailableYear}-${String(latestAvailableMonth).padStart(2,'0')}` : null,
    sensitivity: slope,
    intercept: intercept,
    rSquared: rSquared,
  };
} 