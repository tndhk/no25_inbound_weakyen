'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { simulateScenarioAction, SimulateScenarioResult } from '@/actions/simulateScenarioAction'; // Server Action

const initialState: SimulateScenarioResult = {
  estimatedVisitorGrowth: null,
  estimatedVisitorCount: null,
  baseVisitorCount: null,
  baseYearMonth: null,
  sensitivity: null,
  intercept: null,
  rSquared: null,
  errorMessage: undefined,
};

interface ScenarioSimulatorProps {
  countries: string[];
  currencyPairs: string[];
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-disabled={pending}>
      {pending ? '試算中...' : '試算実行'}
    </Button>
  );
}

export function ScenarioSimulator({ countries, currencyPairs }: ScenarioSimulatorProps) {
  const [state, formAction] = useActionState(simulateScenarioAction, initialState);
  const [selectedCountry, setSelectedCountry] = useState<string>(countries[0] || '');
  const [selectedCurrencyPair, setSelectedCurrencyPair] = useState<string>(currencyPairs[0] || '');
  const [basePeriodMonths, setBasePeriodMonths] = useState<string>('12'); // 初期値を文字列で設定
  const [assumedFxChange, setAssumedFxChange] = useState<string>('');

  useEffect(() => {
    // フォーム送信後にエラーメッセージがあれば表示、なければ結果を表示
    if (state.errorMessage) {
      // alert(state.errorMessage); // もしくは適切なエラー表示コンポーネントを使用
      console.error("Scenario Error:", state.errorMessage);
    }
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>シナリオシミュレーター</CardTitle>
        <CardDescription>
          想定される為替変動が訪日外客数に与える影響を試算します。
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="country">国</Label>
              <Select name="country" value={selectedCountry} onValueChange={setSelectedCountry} required>
                <SelectTrigger id="country">
                  <SelectValue placeholder="国を選択" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="currencyPair">通貨ペア</Label>
              <Select
                name="currencyPair"
                value={selectedCurrencyPair}
                onValueChange={setSelectedCurrencyPair}
                required
              >
                <SelectTrigger id="currencyPair">
                  <SelectValue placeholder="通貨ペアを選択" />
                </SelectTrigger>
                <SelectContent>
                  {currencyPairs.map((pair) => (
                    <SelectItem key={pair} value={pair}>
                      {pair}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="basePeriodMonths">計算期間 (過去月数)</Label>
              <Input
                id="basePeriodMonths"
                name="basePeriodMonths"
                type="number"
                placeholder="例: 12"
                value={basePeriodMonths}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBasePeriodMonths(e.target.value)}
                min="3" // Zodスキーマと合わせる
                required
              />
            </div>
            <div>
              <Label htmlFor="assumedFxChange">想定為替変動率 (%)</Label>
              <Input
                id="assumedFxChange"
                name="assumedFxChange"
                type="number"
                step="0.1"
                placeholder="例: 2 (2%円安の場合)"
                value={assumedFxChange}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAssumedFxChange(e.target.value)}
                required
              />
            </div>
          </div>
          {state.errorMessage && (
            <p className="text-sm font-medium text-destructive">
              エラー: {state.errorMessage}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <SubmitButton />
        </CardFooter>
      </form>

      {/* 結果表示セクション */}
      {state.estimatedVisitorGrowth !== null && (
        <CardContent className="mt-4 border-t pt-4">
          <h3 className="text-lg font-semibold mb-2">試算結果</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <p>推定 訪日客数成長率:</p>
            <p className="font-medium">{state.estimatedVisitorGrowth?.toFixed(2)} %</p>

            <p>推定 訪日客数:</p>
            <p className="font-medium">
              {state.estimatedVisitorCount !== null ? state.estimatedVisitorCount.toLocaleString() + ' 人' : 'N/A'}
            </p>
            
            <p>基準年月:</p>
            <p className="font-medium">{state.baseYearMonth || 'N/A'}</p>

            <p>基準月 訪日客数:</p>
            <p className="font-medium">
                {state.baseVisitorCount !== null ? state.baseVisitorCount.toLocaleString() + ' 人' : 'N/A'}
            </p>

            <p>感応度 (傾き):</p>
            <p className="font-medium">{state.sensitivity?.toFixed(4)}</p>
            
            <p>切片:</p>
            <p className="font-medium">{state.intercept?.toFixed(4)}</p>

            <p>決定係数 (R²):</p>
            <p className="font-medium">{state.rSquared?.toFixed(3)}</p>
          </div>
        </CardContent>
      )}
    </Card>
  );
} 