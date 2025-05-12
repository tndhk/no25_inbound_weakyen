import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import path from 'path';
import iconv from 'iconv-lite';

const prisma = new PrismaClient();

interface DailyRate {
  date: Date;
  baseCurrency: string;
  rate: number;
}

interface MonthlyAverage {
  currencyPair: string;
  year: number;
  month: number;
  fxRate: number;
}

async function main() {
  console.log('Populating FxRate data from quote.csv...');

  const csvFilePath = path.resolve(__dirname, '../quote.csv');
  if (!fs.existsSync(csvFilePath)) {
    console.error(`Error: quote.csv not found at ${csvFilePath}`);
    process.exit(1);
  }
  const fileBuffer = fs.readFileSync(csvFilePath);
  const fileContent = iconv.decode(fileBuffer, 'shiftjis');

  const records: string[][] = parse(fileContent, {
    skip_empty_lines: true,
    relax_column_count: true, // 列数が異なる行を許容 (ヘッダー部分など)
  });

  if (records.length < 3) {
    console.error('CSV file does not contain enough data (header + data rows).');
    return;
  }

  // 通貨コードのヘッダー行を動的に探す (USD, EUR, GBPなどが含まれる行を想定)
  let currencyCodesRowIndex = -1;
  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    // 複数の主要通貨コードが含まれているかで判断（より堅牢な判定が必要な場合あり）
    if (row.includes('USD') && row.includes('EUR') && row.includes('GBP') && row.includes('CAD')) {
      currencyCodesRowIndex = i;
      break;
    }
  }

  if (currencyCodesRowIndex === -1) {
    console.error('Could not find currency codes header row in CSV. Please check CSV format.');
    return;
  }
  
  const currencyCodesRow = records[currencyCodesRowIndex];
  const dateColumnIndex = 0; 
  const currencyCodeMap: { [columnIndex: number]: string } = {};
  currencyCodesRow.forEach((code, index) => {
    if (index > dateColumnIndex && code && code.trim() !== '') {
        currencyCodeMap[index] = code.trim();
    }
  });

  const dataStartIndex = currencyCodesRowIndex + 1;
  const dailyRates: DailyRate[] = [];

  console.log(`Found currency codes at row ${currencyCodesRowIndex + 1}. Data starts from row ${dataStartIndex + 1}.`);
  console.log('Mapped currency codes:', currencyCodeMap);


  for (let i = dataStartIndex; i < records.length; i++) {
    const row = records[i];
    // 行の最初の要素が日付形式 (YYYY/MM/DD or YYYY-MM-DD) かどうかでデータ行を判定
    const dateStr = row[dateColumnIndex];
    if (!dateStr || !/^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(dateStr.trim())) {
        // console.warn(`Skipping row ${i + 1} as it does not start with a valid date: ${dateStr}`);
        continue; 
    }

    const dateParts = dateStr.trim().split(/[\/\-]/);
    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10);
    const day = parseInt(dateParts[2], 10);

    if (isNaN(year) || isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31) {
        console.warn(`Skipping row ${i + 1} with invalid date components: ${dateStr}`);
        continue;
    }
    const recordDate = new Date(year, month - 1, day);

    for (const colIndexStr in currencyCodeMap) {
      const colIndex = parseInt(colIndexStr, 10);
      if (colIndex >= row.length) continue; // 行の列数が足りない場合はスキップ

      let currencyCode = currencyCodeMap[colIndex];
      const rateStr = row[colIndex];

      if (rateStr && rateStr.trim() !== '' && rateStr.trim() !== '*****') {
        let rate = parseFloat(rateStr.trim());
        if (isNaN(rate)) {
            // console.warn(`Invalid rate value "${rateStr}" for ${currencyCode} on ${dateStr}. Skipping.`);
            continue;
        }

        let actualCurrencyCode = currencyCode;
        if (currencyCode.includes('(100)')) {
          actualCurrencyCode = currencyCode.replace('(100)', '').trim();
          rate /= 100;
        }
        
        dailyRates.push({
          date: recordDate,
          baseCurrency: actualCurrencyCode,
          rate: rate,
        });
      }
    }
  }
  console.log(`Processed ${dailyRates.length} daily rate entries.`);

  const monthlyAggregates: { [key: string]: { sum: number; count: number; year: number; month: number; currencyPair: string } } = {};

  for (const dr of dailyRates) {
    const year = dr.date.getFullYear();
    const month = dr.date.getMonth() + 1; 
    const currencyPair = `${dr.baseCurrency}JPY`;
    const key = `${currencyPair}-${year}-${month}`;

    if (!monthlyAggregates[key]) {
      monthlyAggregates[key] = { sum: 0, count: 0, year, month, currencyPair };
    }
    monthlyAggregates[key].sum += dr.rate;
    monthlyAggregates[key].count++;
  }

  const monthlyAverages: MonthlyAverage[] = Object.values(monthlyAggregates).map(agg => ({
    currencyPair: agg.currencyPair,
    year: agg.year,
    month: agg.month,
    fxRate: parseFloat((agg.sum / agg.count).toFixed(6)), // 有効数字を考慮して丸める
  }));
  console.log(`Calculated ${monthlyAverages.length} monthly average entries.`);

  let createdCount = 0;
  let updatedCount = 0;
  for (const avg of monthlyAverages) {
    try {
      const result = await prisma.fxRate.upsert({
        where: {
          currencyPair_year_month: {
            currencyPair: avg.currencyPair,
            year: avg.year,
            month: avg.month,
          },
        },
        update: {
          fxRate: avg.fxRate,
        },
        create: {
          currencyPair: avg.currencyPair,
          year: avg.year,
          month: avg.month,
          fxRate: avg.fxRate,
        },
      });
      // createdAtとupdatedAtが同じミリ秒まで一致するかで新規作成かを判断 (厳密ではないがおおよその目安)
      if (Math.abs(result.createdAt.getTime() - result.updatedAt.getTime()) < 1000) { 
        createdCount++;
      } else {
        updatedCount++;
      }
    } catch (error) {
      console.error(`Error upserting FxRate for ${avg.currencyPair} ${avg.year}-${avg.month}:`, error);
    }
  }

  console.log(`Successfully populated FxRate data. Created: ${createdCount}, Updated: ${updatedCount}`);
}

main()
  .catch(e => {
    console.error('An error occurred during FxRate population:');
    console.error(e instanceof Error ? e.message : String(e));
    if (e instanceof Error && e.stack) {
        console.error(e.stack);
    }
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 