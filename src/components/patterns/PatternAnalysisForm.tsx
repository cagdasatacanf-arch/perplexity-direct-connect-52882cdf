import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, Search, TrendingUp } from 'lucide-react';
import { PatternType, PatternRequest, patternDisplayNames } from '@/lib/patternTypes';
import { availableSymbols } from '@/lib/mockPatternData';

interface PatternAnalysisFormProps {
  onSubmit: (request: PatternRequest) => void;
  isLoading: boolean;
}

const allPatterns: PatternType[] = [
  'head_and_shoulders',
  'double_top',
  'double_bottom',
  'triangle_ascending',
  'triangle_descending',
  'wedge_rising',
  'wedge_falling',
  'cup_and_handle',
  'flag',
  'pennant',
];

const timeframes = [
  { value: '1D', label: '1 Day' },
  { value: '1W', label: '1 Week' },
  { value: '1M', label: '1 Month' },
  { value: '3M', label: '3 Months' },
  { value: '1Y', label: '1 Year' },
];

const sensitivities = [
  { value: 'low', label: 'Low (fewer, higher quality)' },
  { value: 'medium', label: 'Medium (balanced)' },
  { value: 'high', label: 'High (more patterns)' },
];

export const PatternAnalysisForm = ({ onSubmit, isLoading }: PatternAnalysisFormProps) => {
  const [symbol, setSymbol] = useState<string>('');
  const [selectedPatterns, setSelectedPatterns] = useState<PatternType[]>([]);
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '3M' | '1Y'>('1M');
  const [sensitivity, setSensitivity] = useState<'low' | 'medium' | 'high'>('medium');

  const togglePattern = (pattern: PatternType) => {
    setSelectedPatterns(prev =>
      prev.includes(pattern)
        ? prev.filter(p => p !== pattern)
        : [...prev, pattern]
    );
  };

  const selectAllPatterns = () => {
    setSelectedPatterns(allPatterns);
  };

  const clearPatterns = () => {
    setSelectedPatterns([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || selectedPatterns.length === 0) return;

    onSubmit({
      symbol,
      patterns: selectedPatterns,
      timeframe,
      sensitivity,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Pattern Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Symbol Selection */}
          <div className="space-y-2">
            <Label>Symbol</Label>
            <Select value={symbol} onValueChange={setSymbol}>
              <SelectTrigger>
                <SelectValue placeholder="Select a symbol..." />
              </SelectTrigger>
              <SelectContent>
                {availableSymbols.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="font-medium">{s.id}</span>
                    <span className="text-muted-foreground ml-2">- {s.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pattern Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Patterns to Detect</Label>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={selectAllPatterns}>
                  Select All
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={clearPatterns}>
                  Clear
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {allPatterns.map(pattern => (
                <div key={pattern} className="flex items-center space-x-2">
                  <Checkbox
                    id={pattern}
                    checked={selectedPatterns.includes(pattern)}
                    onCheckedChange={() => togglePattern(pattern)}
                  />
                  <Label htmlFor={pattern} className="text-sm cursor-pointer">
                    {patternDisplayNames[pattern]}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Timeframe & Sensitivity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Timeframe</Label>
              <Select value={timeframe} onValueChange={(v) => setTimeframe(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeframes.map(tf => (
                    <SelectItem key={tf.value} value={tf.value}>
                      {tf.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sensitivity</Label>
              <Select value={sensitivity} onValueChange={(v) => setSensitivity(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sensitivities.map(s => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={!symbol || selectedPatterns.length === 0 || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Run Analysis
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
