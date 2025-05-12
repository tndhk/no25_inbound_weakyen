'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button"; // Button をインポート
import { Card } from "@/components/ui/card";

interface DashboardFiltersProps {
  // 将来的に通貨ペアや国のリストをpropsで渡すことも検討
  availableCountries: string[]; // 例: ["韓国", "中国", "台湾", "総数"]
  availableCurrencyPairs: string[]; // 例: ["USDJPY", "CNYJPY"]
}

// 期間選択のオプション
const periodOptions = [
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
  const searchParams = useSearchParams();

  // 詳細フィルターの表示状態
  const [showDetailedFilters, setShowDetailedFilters] = useState(false);

  // 現在のフィルター値を取得 (URLクエリパラメータから)
  const currentPeriod = searchParams.get('periodMonths') || '12';
  const currentCurrencyPair = searchParams.get('currencyPair') || (availableCurrencyPairs.length > 0 ? availableCurrencyPairs[0] : 'USDJPY');
  const currentCountry = searchParams.get('country') || (availableCountries.length > 0 ? availableCountries[0] : '総数');

  // フィルターが変更されたときにURLを更新する関数
  const handleFilterChange = (type: 'periodMonths' | 'currencyPair' | 'country', value: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));

    // 新しい値を設定
    current.set(type, value);

    // 新しいURLにナビゲート
    const query = current.toString();
    router.push(`/?${query}`);
  };

  // 詳細フィルターの表示状態が変更されたときにローカルストレージに保存（任意）
  // useEffect(() => {
  //   const savedState = localStorage.getItem('showDetailedFilters');
  //   if (savedState) {
  //     setShowDetailedFilters(JSON.parse(savedState));
  //   }
  // }, []);
  // useEffect(() => {
  //   localStorage.setItem('showDetailedFilters', JSON.stringify(showDetailedFilters));
  // }, [showDetailedFilters]);

  return (
    <Card className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        {/* 期間選択 (常に表示) */}
        <div className="space-y-1">
          <Label htmlFor="periodMonths">分析期間</Label>
          <Select
            value={currentPeriod}
            onValueChange={(value) => handleFilterChange('periodMonths', value)}
          >
            <SelectTrigger id="periodMonths">
              <SelectValue placeholder="期間を選択" />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 詳細フィルターボタン (md以上で表示位置調整) */}
        <div className="md:col-start-4 flex justify-end">
          <Button 
            variant="outline" 
            onClick={() => setShowDetailedFilters(!showDetailedFilters)}
          >
            {showDetailedFilters ? '詳細フィルターを隠す' : '詳細フィルターを表示'}
          </Button>
        </div>

        {/* 詳細フィルター (表示状態に応じて表示) */}
        {showDetailedFilters && (
          <>
            <div className="space-y-1">
              <Label htmlFor="currencyPair">通貨ペア</Label>
              <Select
                value={currentCurrencyPair}
                onValueChange={(value) => handleFilterChange('currencyPair', value)}
              >
                <SelectTrigger id="currencyPair">
                  <SelectValue placeholder="通貨ペアを選択" />
                </SelectTrigger>
                <SelectContent>
                  {availableCurrencyPairs.map((pair) => (
                    <SelectItem key={pair} value={pair}>
                      {pair}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="country">国・地域</Label>
              <Select
                value={currentCountry}
                onValueChange={(value) => handleFilterChange('country', value)}
              >
                <SelectTrigger id="country">
                  <SelectValue placeholder="国・地域を選択" />
                </SelectTrigger>
                <SelectContent>
                  {availableCountries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>
    </Card>
  );
} 