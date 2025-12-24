import { TrendingUp, TrendingDown, Download, Image, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface ChartToolbarProps {
  symbol: {
    id: string;
    name: string;
    price: number;
    change: number;
  };
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
  chartType: string;
  onChartTypeChange: (type: string) => void;
  indicators: string[];
  onIndicatorToggle: (indicator: string) => void;
  onExportPNG?: () => void;
  onExportCSV?: () => void;
  alertsCount?: number;
  onOpenAlerts?: () => void;
  alertButton?: React.ReactNode;
}

const periods = ['1D', '1W', '1M', '3M', '6M', '1Y', '5Y', 'MAX'];

const indicatorOptions = [
  { id: 'MA20', label: 'MA-20', color: 'bg-chart-ma20' },
  { id: 'MA50', label: 'MA-50', color: 'bg-chart-ma50' },
  { id: 'MA200', label: 'MA-200', color: 'bg-chart-ma200' },
  { id: 'RSI', label: 'RSI', color: 'bg-chart-rsi' },
  { id: 'MACD', label: 'MACD', color: 'bg-chart-macd' },
  { id: 'BB', label: 'Bollinger', color: 'bg-chart-bb' },
];

export const ChartToolbar = ({
  symbol,
  selectedPeriod,
  onPeriodChange,
  chartType,
  onChartTypeChange,
  indicators,
  onIndicatorToggle,
  onExportPNG,
  onExportCSV,
  alertsCount = 0,
  onOpenAlerts,
  alertButton,
}: ChartToolbarProps) => {
  return (
    <div className="border-b border-border bg-card p-4 space-y-4">
      {/* Symbol Info Row */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold">{symbol.id}</h2>
            <p className="text-sm text-muted-foreground">{symbol.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-semibold font-mono">
              ${symbol.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium",
              symbol.change >= 0 
                ? "bg-success/10 text-success" 
                : "bg-destructive/10 text-destructive"
            )}>
              {symbol.change >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {symbol.change >= 0 ? '+' : ''}{symbol.change.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Alert & Export Buttons */}
        <div className="flex items-center gap-2">
          {alertButton}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onOpenAlerts}
            className="relative"
          >
            <Bell className="h-4 w-4 mr-1" />
            Alerts
            {alertsCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                {alertsCount}
              </span>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={onExportPNG}>
            <Image className="h-4 w-4 mr-1" />
            PNG
          </Button>
          <Button variant="outline" size="sm" onClick={onExportCSV}>
            <Download className="h-4 w-4 mr-1" />
            CSV
          </Button>
        </div>
      </div>

      {/* Controls Row */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Time Periods */}
        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
          {periods.map((period) => (
            <button
              key={period}
              onClick={() => onPeriodChange(period)}
              className={cn(
                "time-btn",
                selectedPeriod === period && "active"
              )}
            >
              {period}
            </button>
          ))}
        </div>

        {/* Chart Type */}
        <Select value={chartType} onValueChange={onChartTypeChange}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="candlestick">Candlestick</SelectItem>
            <SelectItem value="line">Line</SelectItem>
            <SelectItem value="area">Area</SelectItem>
          </SelectContent>
        </Select>

        {/* Indicators */}
        <div className="flex items-center gap-2 flex-wrap">
          {indicatorOptions.map((ind) => (
            <button
              key={ind.id}
              onClick={() => onIndicatorToggle(ind.id)}
              className={cn(
                "indicator-toggle",
                indicators.includes(ind.id) && "active"
              )}
            >
              <span className={cn("w-2 h-2 rounded-full", ind.color)} />
              {ind.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
