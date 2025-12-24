import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Grid3X3 } from 'lucide-react';
import type { MarketSymbol } from '@/hooks/useMarketData';
import { generateSeededOHLCData, calculateReturns, calculateCorrelation } from '@/lib/sampleData';

interface CorrelationMatrixProps {
  symbols: MarketSymbol[];
  className?: string;
}

// Seed values for consistent data generation per symbol
const SYMBOL_SEEDS: Record<string, number> = {
  'AAPL': 1001,
  'GOOGL': 2002,
  'MSFT': 3003,
  'AMZN': 4004,
  'TSLA': 5005,
  'NVDA': 6006,
  'XAU': 7007,
  'XAG': 8008,
};

// Market factor coefficients - how much each symbol follows the market
const MARKET_BETA: Record<string, number> = {
  'AAPL': 0.85,
  'GOOGL': 0.80,
  'MSFT': 0.88,
  'AMZN': 0.75,
  'TSLA': 0.45,  // More volatile, less correlated
  'NVDA': 0.82,
  'XAU': -0.15,  // Negative correlation - hedge asset
  'XAG': -0.12,  // Negative correlation - hedge asset
};

const getCorrelationColor = (value: number): string => {
  if (value >= 0.7) return 'bg-chart-up/80 text-white dark:text-white';
  if (value >= 0.4) return 'bg-chart-up/50 text-foreground';
  if (value >= 0.1) return 'bg-chart-up/20 text-foreground';
  if (value >= -0.1) return 'bg-muted text-muted-foreground';
  if (value >= -0.4) return 'bg-chart-down/20 text-foreground';
  if (value >= -0.7) return 'bg-chart-down/50 text-foreground';
  return 'bg-chart-down/80 text-white dark:text-white';
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
  // Generate OHLC data and calculate returns for each symbol
  const symbolReturns = useMemo(() => {
    const days = 90;
    const returns: Record<string, number[]> = {};
    
    // First, generate a market factor
    const marketData = generateSeededOHLCData(100, days, 9999);
    const marketReturns = calculateReturns(marketData);
    
    // Generate data for each symbol with market influence
    symbols.forEach(symbol => {
      const seed = SYMBOL_SEEDS[symbol.id] || Math.random() * 10000;
      const beta = MARKET_BETA[symbol.id] || 0.5;
      
      // Create influenced returns based on market and individual behavior
      const symbolData = generateSeededOHLCData(symbol.price, days, seed);
      const baseReturns = calculateReturns(symbolData);
      
      // Blend symbol returns with market returns based on beta
      const blendedReturns = baseReturns.map((r, i) => {
        const marketR = marketReturns[i] || 0;
        return r * (1 - Math.abs(beta)) + marketR * beta;
      });
      
      returns[symbol.id] = blendedReturns;
    });
    
    return returns;
  }, [symbols]);

  // Calculate correlation matrix
  const { matrix, insights } = useMemo(() => {
    const correlationMatrix = symbols.map(row => 
      symbols.map(col => {
        if (row.id === col.id) return 1;
        
        const returns1 = symbolReturns[row.id] || [];
        const returns2 = symbolReturns[col.id] || [];
        
        return calculateCorrelation(returns1, returns2);
      })
    );

    // Generate dynamic insights
    const allCorrelations: { pair: string; value: number }[] = [];
    for (let i = 0; i < symbols.length; i++) {
      for (let j = i + 1; j < symbols.length; j++) {
        allCorrelations.push({
          pair: `${symbols[i].id}-${symbols[j].id}`,
          value: correlationMatrix[i][j],
        });
      }
    }

    const sorted = [...allCorrelations].sort((a, b) => b.value - a.value);
    const strongest = sorted[0];
    const weakest = sorted[sorted.length - 1];
    
    const techStocks = symbols.filter(s => s.category === 'stock').map(s => s.id);
    const commodities = symbols.filter(s => s.category === 'metal').map(s => s.id);
    
    let avgTechCorr = 0;
    let techCount = 0;
    for (let i = 0; i < symbols.length; i++) {
      for (let j = i + 1; j < symbols.length; j++) {
        if (techStocks.includes(symbols[i].id) && techStocks.includes(symbols[j].id)) {
          avgTechCorr += correlationMatrix[i][j];
          techCount++;
        }
      }
    }
    avgTechCorr = techCount > 0 ? avgTechCorr / techCount : 0;

    const insightList: string[] = [];
    
    if (strongest) {
      insightList.push(
        `Strongest correlation: ${strongest.pair.replace('-', ' & ')} (${strongest.value.toFixed(2)})`
      );
    }
    
    if (techCount > 0) {
      insightList.push(
        `Average tech stock correlation: ${avgTechCorr.toFixed(2)}`
      );
    }
    
    if (commodities.length > 0 && weakest && weakest.value < 0) {
      insightList.push(
        `Commodities provide diversification with negative correlation to tech`
      );
    }

    return { matrix: correlationMatrix, insights: insightList };
  }, [symbols, symbolReturns]);

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Grid3X3 className="h-5 w-5 text-primary" />
          Correlation Matrix
          <Badge variant="outline" className="ml-auto font-normal text-xs">
            90-day returns
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[400px]">
            {/* Header row */}
            <div className="flex">
              <div className="w-16 shrink-0" />
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
                <div className="w-16 shrink-0 flex items-center text-xs font-medium text-muted-foreground pr-2">
                  {rowSymbol.id}
                </div>
                
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

        {/* Dynamic Insights */}
        {insights.length > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-muted/50 border text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Calculated Insights:</p>
            <ul className="space-y-1 list-disc list-inside">
              {insights.map((insight, i) => (
                <li key={i}>{insight}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
