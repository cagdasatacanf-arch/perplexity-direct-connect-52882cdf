import { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { cn } from '@/lib/utils';

interface ChartDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ma20?: number;
  ma50?: number;
  ma200?: number;
}

interface PriceChartProps {
  data: ChartDataPoint[];
  chartType: 'candlestick' | 'line' | 'area';
  indicators: string[];
  className?: string;
}

export const PriceChart = ({ data, chartType, indicators, className }: PriceChartProps) => {
  const chartData = useMemo(() => {
    return data.map((d, i) => {
      const ma20 = indicators.includes('MA20') && i >= 19
        ? data.slice(i - 19, i + 1).reduce((sum, p) => sum + p.close, 0) / 20
        : undefined;
      const ma50 = indicators.includes('MA50') && i >= 49
        ? data.slice(i - 49, i + 1).reduce((sum, p) => sum + p.close, 0) / 50
        : undefined;
      const ma200 = indicators.includes('MA200') && i >= 199
        ? data.slice(i - 199, i + 1).reduce((sum, p) => sum + p.close, 0) / 200
        : undefined;

      return {
        ...d,
        ma20,
        ma50,
        ma200,
        // For candlestick visualization
        range: [d.low, d.high],
        body: [Math.min(d.open, d.close), Math.max(d.open, d.close)],
        isUp: d.close >= d.open,
      };
    });
  }, [data, indicators]);

  const minPrice = useMemo(() => 
    Math.min(...data.map(d => d.low)) * 0.995, 
    [data]
  );
  
  const maxPrice = useMemo(() => 
    Math.max(...data.map(d => d.high)) * 1.005, 
    [data]
  );

  const formatPrice = (value: number) => 
    `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.[0]) return null;
    
    const data = payload[0].payload;
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium mb-2">{label}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <span className="text-muted-foreground">Open:</span>
          <span className="font-mono">{formatPrice(data.open)}</span>
          <span className="text-muted-foreground">High:</span>
          <span className="font-mono">{formatPrice(data.high)}</span>
          <span className="text-muted-foreground">Low:</span>
          <span className="font-mono">{formatPrice(data.low)}</span>
          <span className="text-muted-foreground">Close:</span>
          <span className={cn(
            "font-mono font-medium",
            data.isUp ? "text-chart-up" : "text-chart-down"
          )}>
            {formatPrice(data.close)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className={cn("chart-container p-4", className)}>
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="hsl(var(--border))" 
            opacity={0.5}
          />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--border))' }}
          />
          <YAxis 
            domain={[minPrice, maxPrice]}
            tickFormatter={formatPrice}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            width={80}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Chart Type Rendering */}
          {chartType === 'area' && (
            <Area
              type="monotone"
              dataKey="close"
              stroke="hsl(var(--chart-line))"
              fill="hsl(var(--chart-line))"
              fillOpacity={0.1}
              strokeWidth={2}
            />
          )}

          {chartType === 'line' && (
            <Line
              type="monotone"
              dataKey="close"
              stroke="hsl(var(--chart-line))"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: 'hsl(var(--chart-line))' }}
            />
          )}

          {chartType === 'candlestick' && (
            <>
              <Line
                type="monotone"
                dataKey="high"
                stroke="transparent"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="close"
                stroke="hsl(var(--chart-line))"
                strokeWidth={1.5}
                dot={false}
              />
            </>
          )}

          {/* Moving Averages */}
          {indicators.includes('MA20') && (
            <Line
              type="monotone"
              dataKey="ma20"
              stroke="hsl(var(--chart-ma20))"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="4 2"
            />
          )}
          {indicators.includes('MA50') && (
            <Line
              type="monotone"
              dataKey="ma50"
              stroke="hsl(var(--chart-ma50))"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="4 2"
            />
          )}
          {indicators.includes('MA200') && (
            <Line
              type="monotone"
              dataKey="ma200"
              stroke="hsl(var(--chart-ma200))"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="4 2"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
