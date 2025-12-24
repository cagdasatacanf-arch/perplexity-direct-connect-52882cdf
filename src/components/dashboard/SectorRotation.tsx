import { useMemo } from 'react';
import { PieChart, TrendingUp, TrendingDown, Layers, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { MarketSymbol } from '@/hooks/useMarketData';

interface SectorRotationProps {
  symbols: MarketSymbol[];
  onSelectSymbol?: (id: string) => void;
  className?: string;
}

interface Sector {
  id: string;
  name: string;
  symbols: string[];
  color: string;
}

const SECTORS: Sector[] = [
  { id: 'tech', name: 'Technology', symbols: ['AAPL', 'MSFT', 'GOOGL', 'NVDA'], color: 'bg-blue-500' },
  { id: 'consumer', name: 'Consumer', symbols: ['AMZN', 'TSLA'], color: 'bg-purple-500' },
  { id: 'commodities', name: 'Commodities', symbols: ['XAU', 'XAG'], color: 'bg-yellow-500' },
];

// Sector cycle phases
const CYCLE_PHASES = [
  { name: 'Early Cycle', sectors: ['Consumer', 'Technology'], description: 'Economic recovery phase' },
  { name: 'Mid Cycle', sectors: ['Technology', 'Commodities'], description: 'Economic expansion' },
  { name: 'Late Cycle', sectors: ['Commodities'], description: 'Economic peak' },
  { name: 'Recession', sectors: ['Commodities'], description: 'Economic contraction' },
];

export const SectorRotation = ({ symbols, onSelectSymbol, className }: SectorRotationProps) => {
  const sectorData = useMemo(() => {
    return SECTORS.map(sector => {
      const sectorSymbols = symbols.filter(s => sector.symbols.includes(s.id));
      
      if (sectorSymbols.length === 0) {
        return {
          ...sector,
          performance: 0,
          avgChange: 0,
          symbols: [],
          topPerformer: null,
          worstPerformer: null,
        };
      }

      const avgChange = sectorSymbols.reduce((sum, s) => sum + s.change, 0) / sectorSymbols.length;
      
      const sorted = [...sectorSymbols].sort((a, b) => b.change - a.change);
      const topPerformer = sorted[0];
      const worstPerformer = sorted[sorted.length - 1];

      return {
        ...sector,
        performance: avgChange,
        avgChange,
        symbols: sectorSymbols,
        topPerformer,
        worstPerformer,
      };
    }).sort((a, b) => b.performance - a.performance);
  }, [symbols]);

  // Determine current market phase based on sector performance
  const currentPhase = useMemo(() => {
    const techPerf = sectorData.find(s => s.id === 'tech')?.performance || 0;
    const commodPerf = sectorData.find(s => s.id === 'commodities')?.performance || 0;
    const consumerPerf = sectorData.find(s => s.id === 'consumer')?.performance || 0;

    if (techPerf > 2 && consumerPerf > 0) return 0; // Early Cycle
    if (techPerf > 0 && commodPerf > 0) return 1; // Mid Cycle
    if (commodPerf > techPerf && commodPerf > 0) return 2; // Late Cycle
    return 3; // Recession
  }, [sectorData]);

  const maxAbsChange = Math.max(...sectorData.map(s => Math.abs(s.avgChange)), 1);

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Layers className="h-5 w-5 text-primary" />
          Sector Rotation
          <Badge variant="outline" className="ml-auto font-normal text-xs">
            {CYCLE_PHASES[currentPhase].name}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Market Cycle Indicator */}
        <div className="p-3 rounded-lg bg-muted/50 border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Market Cycle Position</span>
            <span className="text-xs text-primary font-medium">{CYCLE_PHASES[currentPhase].description}</span>
          </div>
          <div className="flex gap-1">
            {CYCLE_PHASES.map((phase, i) => (
              <div
                key={phase.name}
                className={cn(
                  "flex-1 h-2 rounded-full transition-all",
                  i === currentPhase 
                    ? "bg-primary" 
                    : i < currentPhase 
                      ? "bg-primary/30" 
                      : "bg-muted"
                )}
                title={phase.name}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-muted-foreground">Early</span>
            <span className="text-[10px] text-muted-foreground">Late</span>
          </div>
        </div>

        {/* Sector Performance Bars */}
        <div className="space-y-4">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Sector Performance
          </h4>
          
          {sectorData.map((sector, index) => (
            <div key={sector.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn("w-3 h-3 rounded-full", sector.color)} />
                  <span className="font-medium text-sm">{sector.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {sector.symbols.length} {sector.symbols.length === 1 ? 'stock' : 'stocks'}
                  </Badge>
                </div>
                <div className={cn(
                  "flex items-center gap-1 text-sm font-medium",
                  sector.avgChange >= 0 ? "text-chart-up" : "text-chart-down"
                )}>
                  {sector.avgChange >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  {sector.avgChange >= 0 ? '+' : ''}{sector.avgChange.toFixed(2)}%
                </div>
              </div>

              {/* Performance bar */}
              <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "absolute h-full rounded-full transition-all",
                    sector.avgChange >= 0 ? "bg-chart-up" : "bg-chart-down",
                    sector.avgChange >= 0 ? "left-1/2" : "right-1/2"
                  )}
                  style={{
                    width: `${(Math.abs(sector.avgChange) / maxAbsChange) * 50}%`,
                  }}
                />
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border" />
              </div>

              {/* Top/Worst performers */}
              {sector.symbols.length > 0 && (
                <div className="flex gap-2 text-xs">
                  {sector.topPerformer && (
                    <button
                      onClick={() => onSelectSymbol?.(sector.topPerformer!.id)}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-chart-up/10 text-chart-up hover:bg-chart-up/20 transition-colors"
                    >
                      <TrendingUp className="h-3 w-3" />
                      {sector.topPerformer.id}
                      <span className="opacity-70">+{sector.topPerformer.change.toFixed(1)}%</span>
                    </button>
                  )}
                  {sector.worstPerformer && sector.worstPerformer.id !== sector.topPerformer?.id && (
                    <button
                      onClick={() => onSelectSymbol?.(sector.worstPerformer!.id)}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-chart-down/10 text-chart-down hover:bg-chart-down/20 transition-colors"
                    >
                      <TrendingDown className="h-3 w-3" />
                      {sector.worstPerformer.id}
                      <span className="opacity-70">{sector.worstPerformer.change.toFixed(1)}%</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Rotation Arrow Indicator */}
        <div className="p-3 rounded-lg bg-muted/30 border">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Money Flow</span>
            <div className="flex items-center gap-2">
              {sectorData.length >= 2 && (
                <>
                  <span className={cn(
                    "font-medium",
                    sectorData[sectorData.length - 1].avgChange < 0 ? "text-chart-down" : "text-muted-foreground"
                  )}>
                    {sectorData[sectorData.length - 1].name}
                  </span>
                  <ArrowRight className="h-3 w-3 text-primary" />
                  <span className={cn(
                    "font-medium",
                    sectorData[0].avgChange > 0 ? "text-chart-up" : "text-muted-foreground"
                  )}>
                    {sectorData[0].name}
                  </span>
                </>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Capital rotating from underperforming to outperforming sectors
          </p>
        </div>

        {/* Sector Allocation Suggestion */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Suggested Allocation
          </h4>
          <div className="flex gap-1 h-4 rounded-full overflow-hidden">
            {sectorData.map(sector => {
              const weight = Math.max(20, 33 + sector.avgChange * 5);
              return (
                <div
                  key={sector.id}
                  className={cn(sector.color, "transition-all")}
                  style={{ flex: weight }}
                  title={`${sector.name}: ${weight.toFixed(0)}%`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            {sectorData.map(sector => (
              <div key={sector.id} className="flex items-center gap-1">
                <div className={cn("w-2 h-2 rounded-full", sector.color)} />
                <span>{sector.name}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
