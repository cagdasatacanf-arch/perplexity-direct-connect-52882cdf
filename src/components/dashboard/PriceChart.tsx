import { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceArea,
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

// Custom Candlestick shape for recharts
const CandlestickBar = (props: any) => {
  const { x, y, width, height, payload } = props;
  
  if (!payload) return null;
  
  const { open, high, low, close } = payload;
  const isUp = close >= open;
  const color = isUp ? 'hsl(var(--chart-up))' : 'hsl(var(--chart-down))';
  
  const candleWidth = Math.max(width * 0.6, 2);
  const wickWidth = Math.max(width * 0.1, 1);
  const centerX = x + width / 2;
  
  // Calculate positions based on price scale
  const priceRange = props.yAxisDomain?.[1] - props.yAxisDomain?.[0] || 1;
  const chartHeight = props.chartHeight || 400;
  const priceToY = (price: number) => {
    const ratio = (props.yAxisDomain?.[1] - price) / priceRange;
    return ratio * chartHeight;
  };
  
  const highY = priceToY(high);
  const lowY = priceToY(low);
  const openY = priceToY(open);
  const closeY = priceToY(close);
  
  const bodyTop = Math.min(openY, closeY);
  const bodyHeight = Math.abs(closeY - openY) || 1;

  return (
    <g>
      {/* Wick (high to low) */}
      <line
        x1={centerX}
        y1={highY}
        x2={centerX}
        y2={lowY}
        stroke={color}
        strokeWidth={wickWidth}
      />
      {/* Body (open to close) */}
      <rect
        x={centerX - candleWidth / 2}
        y={bodyTop}
        width={candleWidth}
        height={bodyHeight}
        fill={isUp ? color : color}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  );
};

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
        isUp: d.close >= d.open,
        // For bar chart representation of candles
        candleBody: Math.abs(d.close - d.open),
        candleBase: Math.min(d.open, d.close),
        wickHigh: d.high - Math.max(d.open, d.close),
        wickLow: Math.min(d.open, d.close) - d.low,
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
    
    const d = payload[0].payload;
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium mb-2">{label}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <span className="text-muted-foreground">Open:</span>
          <span className="font-mono">{formatPrice(d.open)}</span>
          <span className="text-muted-foreground">High:</span>
          <span className="font-mono text-chart-up">{formatPrice(d.high)}</span>
          <span className="text-muted-foreground">Low:</span>
          <span className="font-mono text-chart-down">{formatPrice(d.low)}</span>
          <span className="text-muted-foreground">Close:</span>
          <span className={cn(
            "font-mono font-medium",
            d.isUp ? "text-chart-up" : "text-chart-down"
          )}>
            {formatPrice(d.close)}
          </span>
          <span className="text-muted-foreground">Change:</span>
          <span className={cn(
            "font-mono font-medium",
            d.isUp ? "text-chart-up" : "text-chart-down"
          )}>
            {d.isUp ? '+' : ''}{((d.close - d.open) / d.open * 100).toFixed(2)}%
          </span>
        </div>
      </div>
    );
  };

  // Custom bar shape for candlestick wicks
  const WickShape = (props: any) => {
    const { x, y, width, height, payload } = props;
    if (!payload || chartType !== 'candlestick') return null;
    
    const centerX = x + width / 2;
    const isUp = payload.close >= payload.open;
    const color = isUp ? 'hsl(var(--chart-up))' : 'hsl(var(--chart-down))';
    
    return (
      <line
        x1={centerX}
        y1={y}
        x2={centerX}
        y2={y + height}
        stroke={color}
        strokeWidth={1}
      />
    );
  };

  return (
    <div className={cn("chart-container p-4", className)}>
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart 
          data={chartData} 
          margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
          barGap={0}
          barCategoryGap="10%"
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="hsl(var(--border))" 
            opacity={0.5}
            vertical={false}
          />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            interval="preserveStartEnd"
          />
          <YAxis 
            domain={[minPrice, maxPrice]}
            tickFormatter={formatPrice}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            width={80}
            orientation="right"
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Candlestick Chart */}
          {chartType === 'candlestick' && (
            <>
              {/* Wicks - rendered as thin bars from low to high */}
              <Bar
                dataKey="high"
                fill="transparent"
                shape={(props: any) => {
                  const { x, width, payload } = props;
                  if (!payload) return null;
                  
                  const centerX = x + width / 2;
                  const isUp = payload.close >= payload.open;
                  const color = isUp ? 'hsl(var(--chart-up))' : 'hsl(var(--chart-down))';
                  
                  // Get y positions from the chart's scale
                  const yScale = props.background?.height / (maxPrice - minPrice);
                  const highY = (maxPrice - payload.high) * yScale;
                  const lowY = (maxPrice - payload.low) * yScale;
                  
                  return (
                    <line
                      x1={centerX}
                      y1={highY}
                      x2={centerX}
                      y2={lowY}
                      stroke={color}
                      strokeWidth={1}
                    />
                  );
                }}
              />
              
              {/* Candle Bodies */}
              <Bar
                dataKey="candleBody"
                stackId="candle"
                fill="hsl(var(--chart-up))"
                radius={[1, 1, 1, 1]}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.isUp ? 'hsl(var(--chart-up))' : 'hsl(var(--chart-down))'}
                    stroke={entry.isUp ? 'hsl(var(--chart-up))' : 'hsl(var(--chart-down))'}
                  />
                ))}
              </Bar>
              
              {/* Invisible bar to set the base position */}
              <Bar
                dataKey="candleBase"
                stackId="candle"
                fill="transparent"
                stroke="transparent"
              />
            </>
          )}

          {/* Area Chart */}
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

          {/* Line Chart */}
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

          {/* Moving Averages - always show on top */}
          {indicators.includes('MA20') && (
            <Line
              type="monotone"
              dataKey="ma20"
              stroke="hsl(var(--chart-ma20))"
              strokeWidth={1.5}
              dot={false}
              connectNulls
            />
          )}
          {indicators.includes('MA50') && (
            <Line
              type="monotone"
              dataKey="ma50"
              stroke="hsl(var(--chart-ma50))"
              strokeWidth={1.5}
              dot={false}
              connectNulls
            />
          )}
          {indicators.includes('MA200') && (
            <Line
              type="monotone"
              dataKey="ma200"
              stroke="hsl(var(--chart-ma200))"
              strokeWidth={1.5}
              dot={false}
              connectNulls
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-3 text-xs text-muted-foreground">
        {chartType === 'candlestick' && (
          <>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-chart-up" />
              <span>Up (Close ≥ Open)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-chart-down" />
              <span>Down (Close &lt; Open)</span>
            </div>
          </>
        )}
        {indicators.includes('MA20') && (
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-chart-ma20 rounded" />
            <span>MA-20</span>
          </div>
        )}
        {indicators.includes('MA50') && (
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-chart-ma50 rounded" />
            <span>MA-50</span>
          </div>
        )}
        {indicators.includes('MA200') && (
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-chart-ma200 rounded" />
            <span>MA-200</span>
          </div>
        )}
      </div>
    </div>
  );
};
