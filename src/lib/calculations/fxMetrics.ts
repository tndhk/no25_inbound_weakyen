import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 指定された通貨ペア、年、月の前年同月比での為替レート変化率を計算します。
 *
 * @param currencyPair - 通貨ペア名 (例: "USDJPY")
 * @param year - 対象年
 * @param month - 対象月 (1-12)
 * @returns 為替レート変化率 (%)。データが不足している場合は null を返します。
 */
export async function calculateFxChange(
  currencyPair: string,
  year: number,
  month: number
): Promise<number | null> {
  try {
    // 当該月の為替レートを取得
    const currentMonthFxRate = await prisma.fxRate.findUnique({
      where: {
        currencyPair_year_month: {
          currencyPair,
          year,
          month,
        },
      },
    });

    if (!currentMonthFxRate || currentMonthFxRate.fxRate === null) {
      // console.warn(`No FX rate data for ${currencyPair}, ${year}-${month}`);
      return null;
    }

    // 前年同月の為替レートを取得
    const previousYearMonthFxRate = await prisma.fxRate.findUnique({
      where: {
        currencyPair_year_month: {
          currencyPair,
          year: year - 1,
          month,
        },
      },
    });

    if (!previousYearMonthFxRate || previousYearMonthFxRate.fxRate === null || previousYearMonthFxRate.fxRate === 0) {
      // console.warn(`No or zero FX rate data for ${currencyPair}, ${year - 1}-${month} (previous year)`);
      return null;
    }

    const fxRateT = currentMonthFxRate.fxRate;
    const fxRateTminus1y = previousYearMonthFxRate.fxRate;

    const change = ((fxRateT - fxRateTminus1y) / fxRateTminus1y) * 100;

    return parseFloat(change.toFixed(2));
    
  } catch (error) {
    console.error(`Error calculating FX rate change for ${currencyPair}, ${year}-${month}:`, error);
    return null;
  }
}

/*
// テスト用 (prismaインスタンスの接続・切断を考慮して実行する必要あり)
async function testFxChange() {
  // 事前にDBにテストデータがあることを想定
  // 例: (USDJPY, 2024, 1, 150.00) と (USDJPY, 2023, 1, 130.00)
  const changeUSDJPY = await calculateFxChange('USDJPY', 2024, 1);
  console.log('FX change for USDJPY (2024-1 vs 2023-1):', changeUSDJPY, '%');
}
// testFxChange().finally(() => prisma.$disconnect());
*/ 