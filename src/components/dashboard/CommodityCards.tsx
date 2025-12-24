import { TrendingUp, TrendingDown, Coins } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { MarketSymbol } from '@/hooks/useMarketData';

interface CommodityCardsProps {
  commodities: MarketSymbol[];
  selectedSymbol: string;
  onSelectSymbol: (id: string) => void;
  className?: string;
}

const commodityIcons: Record<string, string> = {
  XAU: '🥇',
  XAG: '🥈',
};

export const CommodityCards = ({
  commodities,
  selectedSymbol,
  onSelectSymbol,
  className,
}: CommodityCardsProps) => {
  if (commodities.length === 0) return null;

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-3", className)}>
      {commodities.map((commodity) => {
        const isPositive = commodity.change >= 0;
        const isSelected = selectedSymbol === commodity.id;
        const icon = commodityIcons[commodity.id] || '💎';

        return (
          <Card
            key={commodity.id}
            className={cn(
              "cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg",
              isSelected
                ? "ring-2 ring-primary bg-primary/5"
                : "hover:bg-muted/50"
            )}
            onClick={() => onSelectSymbol(commodity.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <h3 className="font-semibold text-sm">{commodity.name}</h3>
                    <p className="text-xs text-muted-foreground">{commodity.id}</p>
                  </div>
                </div>
                <div className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                  isPositive 
                    ? "bg-chart-up/10 text-chart-up" 
                    : "bg-chart-down/10 text-chart-down"
                )}>
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {isPositive ? '+' : ''}{commodity.change.toFixed(2)}%
                </div>
              </div>

              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold">
                    ${commodity.price.toLocaleString(undefined, { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {commodity.unit || 'USD/oz'}
                  </p>
                </div>
                {commodity.high && commodity.low && (
                  <div className="text-right text-xs text-muted-foreground">
                    <p>H: ${commodity.high.toLocaleString()}</p>
                    <p>L: ${commodity.low.toLocaleString()}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
