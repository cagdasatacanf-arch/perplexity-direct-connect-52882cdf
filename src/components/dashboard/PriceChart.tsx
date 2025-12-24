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
  // Calculate EMA helper
  const calculateEMA = (prices: number[], period: number): number[] => {
    const k = 2 / (period + 1);
    const ema: number[] = [];
    let prevEma = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
    
    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        ema.push(NaN);
      } else if (i === period - 1) {
        ema.push(prevEma);
      } else {
        prevEma = prices[i] * k + prevEma * (1 - k);
        ema.push(prevEma);
      }
    }
    return ema;
  };

  // Calculate RSI
  const rsiData = useMemo(() => {
    if (!indicators.includes('RSI')) return [];
    
    const period = 14;
    const changes = data.map((d, i) => i > 0 ? d.close - data[i - 1].close : 0);
    const gains = changes.map(c => c > 0 ? c : 0);
    const losses = changes.map(c => c < 0 ? Math.abs(c) : 0);
    
    const rsi: (number | undefined)[] = [];
    let avgGain = gains.slice(1, period + 1).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(1, period + 1).reduce((a, b) => a + b, 0) / period;
    
    for (let i = 0; i < data.length; i++) {
      if (i < period) {
        rsi.push(undefined);
      } else if (i === period) {
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsi.push(100 - (100 / (1 + rs)));
      } else {
        avgGain = (avgGain * (period - 1) + gains[i]) / period;
        avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsi.push(100 - (100 / (1 + rs)));
      }
    }
    return rsi;
  }, [data, indicators]);

  // Calculate MACD
  const macdData = useMemo(() => {
    if (!indicators.includes('MACD')) return { macd: [], signal: [], histogram: [] };
    
    const closes = data.map(d => d.close);
    const ema12 = calculateEMA(closes, 12);
    const ema26 = calculateEMA(closes, 26);
    
    const macdLine = ema12.map((v, i) => isNaN(v) || isNaN(ema26[i]) ? NaN : v - ema26[i]);
    const validMacd = macdLine.filter(v => !isNaN(v));
    const signalLine = calculateEMA(validMacd, 9);
    
    // Pad signal line to match data length
    const paddedSignal: number[] = [];
    let signalIndex = 0;
    for (let i = 0; i < macdLine.length; i++) {
      if (isNaN(macdLine[i])) {
        paddedSignal.push(NaN);
      } else {
        paddedSignal.push(signalLine[signalIndex] || NaN);
        signalIndex++;
      }
    }
    
    const histogram = macdLine.map((v, i) => 
      isNaN(v) || isNaN(paddedSignal[i]) ? NaN : v - paddedSignal[i]
    );
    
    return { macd: macdLine, signal: paddedSignal, histogram };
  }, [data, indicators]);

  // Calculate Bollinger Bands
  const bollingerData = useMemo(() => {
    if (!indicators.includes('BB')) return { upper: [], middle: [], lower: [] };
    
    const period = 20;
    const multiplier = 2;
    const upper: (number | undefined)[] = [];
    const middle: (number | undefined)[] = [];
    const lower: (number | undefined)[] = [];
    
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        upper.push(undefined);
        middle.push(undefined);
        lower.push(undefined);
      } else {
        const slice = data.slice(i - period + 1, i + 1);
        const sma = slice.reduce((sum, p) => sum + p.close, 0) / period;
        const squaredDiffs = slice.map(p => Math.pow(p.close - sma, 2));
        const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / period;
        const stdDev = Math.sqrt(variance);
        
        middle.push(sma);
        upper.push(sma + multiplier * stdDev);
        lower.push(sma - multiplier * stdDev);
      }
    }
    
    return { upper, middle, lower };
  }, [data, indicators]);

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
        candleBody: Math.abs(d.close - d.open),
        candleBase: Math.min(d.open, d.close),
        wickHigh: d.high - Math.max(d.open, d.close),
        wickLow: Math.min(d.open, d.close) - d.low,
        rsi: rsiData[i],
        macd: isNaN(macdData.macd[i]) ? undefined : macdData.macd[i],
        macdSignal: isNaN(macdData.signal[i]) ? undefined : macdData.signal[i],
        macdHistogram: isNaN(macdData.histogram[i]) ? undefined : macdData.histogram[i],
        bbUpper: bollingerData.upper[i],
        bbMiddle: bollingerData.middle[i],
        bbLower: bollingerData.lower[i],
      };
    });
  }, [data, indicators, rsiData, macdData, bollingerData]);

  const minPrice = useMemo(() => 
    Math.min(...data.map(d => d.low)) * 0.995, 
    [data]
  );
  
  const maxPrice = useMemo(() => 
    Math.max(...data.map(d => d.high)) * 1.005, 
    [data]
  );

  const maxVolume = useMemo(() => 
    Math.max(...data.map(d => d.volume)), 
    [data]
  );

  const formatPrice = (value: number) => 
    `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatVolume = (value: number) => {
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
    return value.toString();
  };

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
          <span className="text-muted-foreground">Volume:</span>
          <span className="font-mono">{formatVolume(d.volume)}</span>
        </div>
      </div>
    );
  };

  const VolumeTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.[0]) return null;
    
    const d = payload[0].payload;
    return (
      <div className="bg-popover border border-border rounded-lg p-2 shadow-lg">
        <p className="text-xs font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">
          Volume: <span className="font-mono">{formatVolume(d.volume)}</span>
        </p>
      </div>
    );
  };

  const RSITooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.[0]) return null;
    
    const d = payload[0].payload;
    if (d.rsi === undefined) return null;
    
    const rsiColor = d.rsi >= 70 ? 'text-chart-down' : d.rsi <= 30 ? 'text-chart-up' : 'text-foreground';
    return (
      <div className="bg-popover border border-border rounded-lg p-2 shadow-lg">
        <p className="text-xs font-medium">{label}</p>
        <p className="text-xs">
          RSI(14): <span className={cn("font-mono font-medium", rsiColor)}>{d.rsi?.toFixed(2)}</span>
        </p>
      </div>
    );
  };

  const MACDTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.[0]) return null;
    
    const d = payload[0].payload;
    if (d.macd === undefined) return null;
    
    return (
      <div className="bg-popover border border-border rounded-lg p-2 shadow-lg">
        <p className="text-xs font-medium">{label}</p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
          <span className="text-muted-foreground">MACD:</span>
          <span className="font-mono text-chart-macd">{d.macd?.toFixed(3)}</span>
          <span className="text-muted-foreground">Signal:</span>
          <span className="font-mono text-chart-macd-signal">{d.macdSignal?.toFixed(3)}</span>
          <span className="text-muted-foreground">Histogram:</span>
          <span className={cn(
            "font-mono",
            d.macdHistogram >= 0 ? "text-chart-up" : "text-chart-down"
          )}>{d.macdHistogram?.toFixed(3)}</span>
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

          {/* Bollinger Bands */}
          {indicators.includes('BB') && (
            <>
              {/* Upper Band */}
              <Line
                type="monotone"
                dataKey="bbUpper"
                stroke="hsl(var(--chart-bb))"
                strokeWidth={1}
                strokeDasharray="4 2"
                dot={false}
                connectNulls
              />
              {/* Middle Band (SMA) */}
              <Line
                type="monotone"
                dataKey="bbMiddle"
                stroke="hsl(var(--chart-bb))"
                strokeWidth={1.5}
                dot={false}
                connectNulls
              />
              {/* Lower Band */}
              <Line
                type="monotone"
                dataKey="bbLower"
                stroke="hsl(var(--chart-bb))"
                strokeWidth={1}
                strokeDasharray="4 2"
                dot={false}
                connectNulls
              />
              {/* Fill between bands */}
              <Area
                type="monotone"
                dataKey="bbUpper"
                stroke="none"
                fill="hsl(var(--chart-bb))"
                fillOpacity={0.05}
                connectNulls
              />
            </>
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {/* Volume Chart */}
      <ResponsiveContainer width="100%" height={100}>
        <ComposedChart 
          data={chartData} 
          margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
          barGap={0}
          barCategoryGap="10%"
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="hsl(var(--border))" 
            opacity={0.3}
            vertical={false}
            horizontal={false}
          />
          <XAxis 
            dataKey="date" 
            tick={false}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--border))' }}
          />
          <YAxis 
            domain={[0, maxVolume * 1.1]}
            tickFormatter={formatVolume}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            width={80}
            orientation="right"
            tickCount={3}
          />
          <Tooltip content={<VolumeTooltip />} />
          
          <Bar dataKey="volume" radius={[1, 1, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell 
                key={`vol-${index}`} 
                fill={entry.isUp ? 'hsl(var(--chart-up))' : 'hsl(var(--chart-down))'}
                fillOpacity={0.6}
              />
            ))}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>

      {/* RSI Panel */}
      {indicators.includes('RSI') && (
        <div className="mt-2">
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="text-xs font-medium text-muted-foreground">RSI (14)</span>
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span>Overbought: 70</span>
              <span>Oversold: 30</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={100}>
            <ComposedChart 
              data={chartData} 
              margin={{ top: 5, right: 30, left: 10, bottom: 0 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                opacity={0.3}
                vertical={false}
              />
              <XAxis 
                dataKey="date" 
                tick={false}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                domain={[0, 100]}
                ticks={[30, 50, 70]}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                width={80}
                orientation="right"
              />
              <Tooltip content={<RSITooltip />} />
              
              {/* Overbought/Oversold zones */}
              <ReferenceArea y1={70} y2={100} fill="hsl(var(--chart-down))" fillOpacity={0.1} />
              <ReferenceArea y1={0} y2={30} fill="hsl(var(--chart-up))" fillOpacity={0.1} />
              <ReferenceLine y={70} stroke="hsl(var(--chart-down))" strokeDasharray="3 3" strokeOpacity={0.5} />
              <ReferenceLine y={30} stroke="hsl(var(--chart-up))" strokeDasharray="3 3" strokeOpacity={0.5} />
              <ReferenceLine y={50} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" strokeOpacity={0.3} />
              
              <Line
                type="monotone"
                dataKey="rsi"
                stroke="hsl(var(--chart-rsi))"
                strokeWidth={1.5}
                dot={false}
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* MACD Panel */}
      {indicators.includes('MACD') && (
        <div className="mt-2">
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="text-xs font-medium text-muted-foreground">MACD (12, 26, 9)</span>
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <ComposedChart 
              data={chartData} 
              margin={{ top: 5, right: 30, left: 10, bottom: 0 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                opacity={0.3}
                vertical={false}
              />
              <XAxis 
                dataKey="date" 
                tick={false}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                width={80}
                orientation="right"
                tickFormatter={(v) => v.toFixed(1)}
              />
              <Tooltip content={<MACDTooltip />} />
              
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.5} />
              
              {/* Histogram */}
              <Bar dataKey="macdHistogram" radius={[1, 1, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`macd-hist-${index}`} 
                    fill={(entry.macdHistogram ?? 0) >= 0 ? 'hsl(var(--chart-up))' : 'hsl(var(--chart-down))'}
                    fillOpacity={0.6}
                  />
                ))}
              </Bar>
              
              {/* MACD Line */}
              <Line
                type="monotone"
                dataKey="macd"
                stroke="hsl(var(--chart-macd))"
                strokeWidth={1.5}
                dot={false}
                connectNulls
              />
              
              {/* Signal Line */}
              <Line
                type="monotone"
                dataKey="macdSignal"
                stroke="hsl(var(--chart-macd-signal))"
                strokeWidth={1.5}
                dot={false}
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-3 text-xs text-muted-foreground flex-wrap">
        {chartType === 'candlestick' && (
          <>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-chart-up" />
              <span>Up</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-chart-down" />
              <span>Down</span>
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
        {indicators.includes('RSI') && (
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-chart-rsi rounded" />
            <span>RSI</span>
          </div>
        )}
        {indicators.includes('BB') && (
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-chart-bb rounded" />
            <span>Bollinger</span>
          </div>
        )}
        {indicators.includes('MACD') && (
          <>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-chart-macd rounded" />
              <span>MACD</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-chart-macd-signal rounded" />
              <span>Signal</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
