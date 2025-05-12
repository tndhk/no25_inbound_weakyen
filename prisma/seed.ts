import { PrismaClient, Prisma } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding Visitor table...');
  const filePath = path.join(process.cwd(), 'visitors.csv');
  const fileContent = fs.readFileSync(filePath, { encoding: 'utf-8' });

  const parser = parse(fileContent, {
    delimiter: ',',
    columns: true,
    skip_empty_lines: true,
    trim: true,
    cast: (value, context) => {
      if (context.column === 'year') {
        return parseInt(value, 10);
      }
      if (context.column === 'month') {
        return parseInt(value.replace('月', ''), 10);
      }
      if (context.column === 'visitors') {
        const num = parseFloat(value);
        return isNaN(num) ? null : Math.round(num);
      }
      return value;
    },
  });

  let createdCount = 0;
  let skippedCount = 0;

  for await (const record of parser) {
    if (!record.country || record.country.startsWith('注') || record.visitors === null) {
      skippedCount++;
      continue;
    }
    if (isNaN(record.year) || isNaN(record.month) || isNaN(record.visitors)) {
      console.warn('Skipping invalid record:', record);
      skippedCount++;
      continue;
    }

    try {
      await prisma.visitor.create({
        data: {
          year: record.year,
          month: record.month,
          country: record.country,
          visitors: record.visitors,
        },
      });
      createdCount++;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // P2002はユニーク制約違反のエラーコード
        if (e.code === 'P2002') {
          // console.log(`Record already exists, skipping: ${record.year}-${record.month} ${record.country}`);
          skippedCount++;
        } else {
          console.error('Error creating record:', record, e);
          skippedCount++;
        }
      } else {
        console.error('Unknown error creating record:', record, e);
        skippedCount++;
      }
    }
    // 定期的に進捗を表示 (例: 1000件ごと)
    if ((createdCount + skippedCount) % 1000 === 0) {
      console.log(`Processed ${createdCount + skippedCount} records (Created: ${createdCount}, Skipped: ${skippedCount})...`);
    }
  }

  console.log(
    `Seeding finished. Total records processed: ${createdCount + skippedCount}. New records created: ${createdCount}. Records skipped: ${skippedCount}.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 