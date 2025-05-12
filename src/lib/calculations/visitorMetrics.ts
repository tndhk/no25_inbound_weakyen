import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 指定された国、年、月の前年同月比での訪問者数成長率を計算します。
 *
 * @param country - 国名
 * @param year - 対象年
 * @param month - 対象月 (1-12)
 * @returns 訪問者数成長率 (%)。データが不足している場合は null を返します。
 */
export async function calculateVisitorGrowth(
  country: string,
  year: number,
  month: number
): Promise<number | null> {
  try {
    // 当該月の訪問者数を取得
    const currentMonthVisitor = await prisma.visitor.findUnique({
      where: {
        year_month_country: {
          year,
          month,
          country,
        },
      },
    });

    if (!currentMonthVisitor || currentMonthVisitor.visitors === null) {
      // console.warn(`No visitor data for ${country}, ${year}-${month}`);
      return null;
    }

    // 前年同月の訪問者数を取得
    const previousYearMonthVisitor = await prisma.visitor.findUnique({
      where: {
        year_month_country: {
          year: year - 1,
          month,
          country,
        },
      },
    });

    if (!previousYearMonthVisitor || previousYearMonthVisitor.visitors === null || previousYearMonthVisitor.visitors === 0) {
      // console.warn(`No or zero visitor data for ${country}, ${year - 1}-${month} (previous year)`);
      // 前年データがない、または0の場合、成長率は計算不能 (または無限大) となるため null を返す
      return null;
    }

    const visitorsT = currentMonthVisitor.visitors;
    const visitorsTminus1y = previousYearMonthVisitor.visitors;

    const growth = ((visitorsT - visitorsTminus1y) / visitorsTminus1y) * 100;
    
    // 結果を小数点以下2桁に丸めるなど、必要に応じて調整
    return parseFloat(growth.toFixed(2));

  } catch (error) {
    console.error(`Error calculating visitor growth for ${country}, ${year}-${month}:`, error);
    return null;
  }
}

/*
// テスト用 (prismaインスタンスの接続・切断を考慮して実行する必要あり)
async function testGrowth() {
  // 事前にDBにテストデータがあることを想定
  // 例: (韓国, 2024, 1, 1000人) と (韓国, 2023, 1, 800人)
  const growthKorea = await calculateVisitorGrowth('韓国', 2024, 1);
  console.log('Visitor growth for 韓国 (2024-1 vs 2023-1):', growthKorea, '%');

  // データがない場合のテスト
  const growthNonExistent = await calculateVisitorGrowth('存在しない国', 2024, 1);
  console.log('Visitor growth for 存在しない国 (2024-1):', growthNonExistent);
  
  // 前年のデータがない場合のテスト (例: 2023年にデータがない場合)
  // const growthNoPrevYear = await calculateVisitorGrowth('韓国', 2022, 1); // 2021年のデータがないと仮定
  // console.log('Visitor growth for 韓国 (2022-1 vs 2021-1):', growthNoPrevYear, '%');
}

// testGrowth().finally(() => prisma.$disconnect());
*/

// このファイルが直接実行された場合 prismaインスタンスがdisconnectされないため注意
// 必要であれば、スクリプトとして実行する際にエントリーポイントで prisma.$disconnect() を呼び出す 