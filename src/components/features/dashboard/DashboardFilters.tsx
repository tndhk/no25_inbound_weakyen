'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'; // Shadcn/uiのSelectを想定
import { Label } from '@/components/ui/label';

interface DashboardFiltersProps {
  // 将来的に通貨ペアや国のリストをpropsで渡すことも検討
  availableCountries: string[]; // 例: ["韓国", "中国", "台湾", "総数"]
  availableCurrencyPairs: string[]; // 例: ["USDJPY", "CNYJPY"]
}

const PERIOD_OPTIONS = [
  { value: '3', label: '過去3ヶ月' },
  { value: '6', label: '過去6ヶ月' },
  { value: '12', label: '過去12ヶ月' },
  { value: '24', label: '過去24ヶ月' },
  { value: '36', label: '過去36ヶ月' },
];

export default function DashboardFilters({
  availableCountries,
  availableCurrencyPairs,
}: DashboardFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPeriod = searchParams.get('periodMonths') || '12';
  const currentCurrencyPair = searchParams.get('currencyPair') || (availableCurrencyPairs.length > 0 ? availableCurrencyPairs[0] : 'USDJPY');
  const currentCountry = searchParams.get('country') || (availableCountries.length > 0 ? availableCountries[0] : '総数');

  // URLのクエリパラメータを更新する関数
  const createQueryString = useCallback(
    (paramsToUpdate: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(paramsToUpdate).forEach(([name, value]) => {
        params.set(name, value);
      });
      return params.toString();
    },
    [searchParams]
  );

  const handleFilterChange = (filterName: string, value: string) => {
    router.push(pathname + '?' + createQueryString({ [filterName]: value }));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 border rounded-lg">
      <div>
        <Label htmlFor="period-select" className="mb-2 block">表示期間</Label>
        <Select
          value={currentPeriod}
          onValueChange={(value: string) => handleFilterChange('periodMonths', value)}
        >
          <SelectTrigger id="period-select">
            <SelectValue placeholder="期間を選択" />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="currency-pair-select" className="mb-2 block">通貨ペア</Label>
        <Select
          value={currentCurrencyPair}
          onValueChange={(value: string) => handleFilterChange('currencyPair', value)}
          disabled={availableCurrencyPairs.length === 0}
        >
          <SelectTrigger id="currency-pair-select">
            <SelectValue placeholder="通貨ペアを選択" />
          </SelectTrigger>
          <SelectContent>
            {availableCurrencyPairs.map(pair => (
              <SelectItem key={pair} value={pair}>
                {pair}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="country-select" className="mb-2 block">国・地域</Label>
        <Select
          value={currentCountry}
          onValueChange={(value: string) => handleFilterChange('country', value)}
          disabled={availableCountries.length === 0}
        >
          <SelectTrigger id="country-select">
            <SelectValue placeholder="国・地域を選択" />
          </SelectTrigger>
          <SelectContent>
            {/* "総数" を最初に表示したい場合など、別途ソートや加工が必要かも */}
            {availableCountries.map(country => (
              <SelectItem key={country} value={country}>
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
} 