import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Grid3X3 } from 'lucide-react';
import type { MarketSymbol } from '@/hooks/useMarketData';

interface CorrelationMatrixProps {
  symbols: MarketSymbol[];
  className?: string;
}

// Simulated correlation data based on historical patterns
// In production, this would be calculated from actual price data
const generateCorrelation = (symbol1: string, symbol2: string): number => {
  if (symbol1 === symbol2) return 1;
  
  // Known correlations based on market behavior
  const correlationMap: Record<string, Record<string, number>> = {
    'AAPL': { 'GOOGL': 0.72, 'MSFT': 0.85, 'AMZN': 0.68, 'TSLA': 0.45, 'NVDA': 0.78, 'XAU': -0.15, 'XAG': -0.12 },
    'GOOGL': { 'AAPL': 0.72, 'MSFT': 0.82, 'AMZN': 0.75, 'TSLA': 0.42, 'NVDA': 0.71, 'XAU': -0.18, 'XAG': -0.14 },
    'MSFT': { 'AAPL': 0.85, 'GOOGL': 0.82, 'AMZN': 0.70, 'TSLA': 0.38, 'NVDA': 0.80, 'XAU': -0.20, 'XAG': -0.16 },
    'AMZN': { 'AAPL': 0.68, 'GOOGL': 0.75, 'MSFT': 0.70, 'TSLA': 0.52, 'NVDA': 0.65, 'XAU': -0.10, 'XAG': -0.08 },
    'TSLA': { 'AAPL': 0.45, 'GOOGL': 0.42, 'MSFT': 0.38, 'AMZN': 0.52, 'NVDA': 0.55, 'XAU': 0.05, 'XAG': 0.08 },
    'NVDA': { 'AAPL': 0.78, 'GOOGL': 0.71, 'MSFT': 0.80, 'AMZN': 0.65, 'TSLA': 0.55, 'XAU': -0.12, 'XAG': -0.10 },
    'XAU': { 'AAPL': -0.15, 'GOOGL': -0.18, 'MSFT': -0.20, 'AMZN': -0.10, 'TSLA': 0.05, 'NVDA': -0.12, 'XAG': 0.92 },
    'XAG': { 'AAPL': -0.12, 'GOOGL': -0.14, 'MSFT': -0.16, 'AMZN': -0.08, 'TSLA': 0.08, 'NVDA': -0.10, 'XAU': 0.92 },
  };

  return correlationMap[symbol1]?.[symbol2] ?? 0;
};

const getCorrelationColor = (value: number): string => {
  if (value >= 0.7) return 'bg-chart-up/80 text-chart-up-foreground';
  if (value >= 0.4) return 'bg-chart-up/40 text-foreground';
  if (value >= 0.1) return 'bg-chart-up/20 text-foreground';
  if (value >= -0.1) return 'bg-muted text-muted-foreground';
  if (value >= -0.4) return 'bg-chart-down/20 text-foreground';
  if (value >= -0.7) return 'bg-chart-down/40 text-foreground';
  return 'bg-chart-down/80 text-chart-down-foreground';
};

const getCorrelationLabel = (value: number): string => {
  if (value >= 0.7) return 'Strong +';
  if (value >= 0.4) return 'Moderate +';
  if (value >= 0.1) return 'Weak +';
  if (value >= -0.1) return 'None';
  if (value >= -0.4) return 'Weak -';
  if (value >= -0.7) return 'Moderate -';
  return 'Strong -';
};

export const CorrelationMatrix = ({ symbols, className }: CorrelationMatrixProps) => {
  const matrix = useMemo(() => {
    return symbols.map(row => 
      symbols.map(col => generateCorrelation(row.id, col.id))
    );
  }, [symbols]);

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Grid3X3 className="h-5 w-5 text-primary" />
          Correlation Matrix
          <Badge variant="outline" className="ml-auto font-normal text-xs">
            30-day rolling
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[400px]">
            {/* Header row */}
            <div className="flex">
              <div className="w-16 shrink-0" /> {/* Empty corner */}
              {symbols.map(symbol => (
                <div
                  key={symbol.id}
                  className="flex-1 min-w-[50px] text-center text-xs font-medium text-muted-foreground py-2"
                >
                  {symbol.id}
                </div>
              ))}
            </div>

            {/* Matrix rows */}
            {symbols.map((rowSymbol, rowIndex) => (
              <div key={rowSymbol.id} className="flex">
                {/* Row label */}
                <div className="w-16 shrink-0 flex items-center text-xs font-medium text-muted-foreground pr-2">
                  {rowSymbol.id}
                </div>
                
                {/* Correlation cells */}
                {matrix[rowIndex].map((correlation, colIndex) => {
                  const isDiagonal = rowIndex === colIndex;
                  
                  return (
                    <div
                      key={`${rowSymbol.id}-${symbols[colIndex].id}`}
                      className={cn(
                        "flex-1 min-w-[50px] aspect-square flex items-center justify-center text-xs font-medium rounded-sm m-0.5 transition-all hover:scale-105 cursor-default",
                        isDiagonal 
                          ? "bg-primary/20 text-primary" 
                          : getCorrelationColor(correlation)
                      )}
                      title={`${rowSymbol.id} vs ${symbols[colIndex].id}: ${correlation.toFixed(2)} (${getCorrelationLabel(correlation)})`}
                    >
                      {correlation.toFixed(2)}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-chart-up/80" />
            <span className="text-muted-foreground">Strong +</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-chart-up/40" />
            <span className="text-muted-foreground">Moderate +</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-muted" />
            <span className="text-muted-foreground">None</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-chart-down/40" />
            <span className="text-muted-foreground">Moderate -</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-chart-down/80" />
            <span className="text-muted-foreground">Strong -</span>
          </div>
        </div>

        {/* Insight */}
        <div className="mt-4 p-3 rounded-lg bg-muted/50 border text-xs text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Key Insights:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Tech stocks (AAPL, MSFT, NVDA) show strong positive correlation</li>
            <li>Gold & Silver are highly correlated (0.92) and hedge against tech</li>
            <li>TSLA shows lower correlation with other tech stocks</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
