import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  ReferenceDot,
} from 'recharts';
import { PatternMatch, patternDisplayNames } from '@/lib/patternTypes';
import { generateMockPriceData, mockPatternOverlays, PricePoint, PatternOverlay } from '@/lib/mockPriceData';
import { LineChart } from 'lucide-react';

interface PatternChartProps {
  symbol: string;
  patterns: PatternMatch[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-medium mb-2">{label}</p>
        <div className="space-y-1 text-muted-foreground">
          <p>Open: <span className="font-mono text-foreground">${data.open}</span></p>
          <p>High: <span className="font-mono text-foreground">${data.high}</span></p>
          <p>Low: <span className="font-mono text-foreground">${data.low}</span></p>
          <p>Close: <span className="font-mono text-foreground">${data.close}</span></p>
        </div>
      </div>
    );
  }
  return null;
};

export const PatternChart = ({ symbol, patterns }: PatternChartProps) => {
  const priceData = useMemo(() => generateMockPriceData(symbol, 30), [symbol]);
  const overlays = mockPatternOverlays[symbol] || [];

  // Calculate price range for Y axis
  const prices = priceData.flatMap(d => [d.high, d.low]);
  const minPrice = Math.min(...prices) * 0.98;
  const maxPrice = Math.max(...prices) * 1.02;

  // Get colors for pattern areas
  const getPatternColor = (direction: string) => {
    switch (direction) {
      case 'bullish': return { fill: 'rgba(34, 197, 94, 0.1)', stroke: 'rgb(34, 197, 94)' };
      case 'bearish': return { fill: 'rgba(239, 68, 68, 0.1)', stroke: 'rgb(239, 68, 68)' };
      default: return { fill: 'rgba(234, 179, 8, 0.1)', stroke: 'rgb(234, 179, 8)' };
    }
  };

  // Transform data for candlestick-like visualization
  const chartData = priceData.map((point, index) => ({
    ...point,
    index,
    // For the area between high and low
    range: [point.low, point.high],
    // Color based on close vs open
    fill: point.close >= point.open ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))',
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <LineChart className="h-4 w-4" />
          Price Chart with Pattern Overlays
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
                className="text-muted-foreground"
              />
              
              <YAxis 
                domain={[minPrice, maxPrice]}
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
                className="text-muted-foreground"
              />
              
              <Tooltip content={<CustomTooltip />} />

              {/* Pattern highlight areas */}
              {overlays.map((overlay, idx) => {
                const startDate = chartData[overlay.startIndex]?.date;
                const endDate = chartData[overlay.endIndex]?.date;
                const colors = getPatternColor(overlay.direction);
                
                return (
                  <ReferenceArea
                    key={idx}
                    x1={startDate}
                    x2={endDate}
                    fill={colors.fill}
                    stroke={colors.stroke}
                    strokeDasharray="4 4"
                    strokeWidth={1}
                  />
                );
              })}

              {/* High-Low range as thin bars */}
              <Bar 
                dataKey="high" 
                fill="transparent"
                stroke="hsl(var(--muted-foreground))"
                barSize={1}
              />

              {/* Close price line */}
              <Line
                type="monotone"
                dataKey="close"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: 'hsl(var(--primary))' }}
              />

              {/* Pattern key points */}
              {overlays.flatMap((overlay, overlayIdx) =>
                overlay.keyPoints.map((point, pointIdx) => {
                  const date = chartData[point.index]?.date;
                  if (!date) return null;
                  
                  const colors = getPatternColor(overlay.direction);
                  return (
                    <ReferenceDot
                      key={`${overlayIdx}-${pointIdx}`}
                      x={date}
                      y={point.price}
                      r={6}
                      fill={colors.stroke}
                      stroke="white"
                      strokeWidth={2}
                    />
                  );
                })
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Pattern Legend */}
        {overlays.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium mb-2">Detected Patterns</p>
            <div className="flex flex-wrap gap-4">
              {overlays.map((overlay, idx) => {
                const colors = getPatternColor(overlay.direction);
                const patternName = patternDisplayNames[overlay.type as keyof typeof patternDisplayNames] || overlay.type;
                
                return (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <div 
                      className="w-4 h-4 rounded border-2" 
                      style={{ 
                        backgroundColor: colors.fill, 
                        borderColor: colors.stroke 
                      }}
                    />
                    <span>{patternName}</span>
                    <span className="text-muted-foreground">
                      ({chartData[overlay.startIndex]?.date} - {chartData[overlay.endIndex]?.date})
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Key Points Legend */}
        {overlays.some(o => o.keyPoints.length > 0) && (
          <div className="mt-3">
            <p className="text-xs text-muted-foreground mb-2">Key Points</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {overlays.flatMap((overlay) =>
                overlay.keyPoints.map((point, idx) => (
                  <span key={`${overlay.type}-${idx}`} className="text-muted-foreground">
                    • {point.label}: ${point.price}
                  </span>
                ))
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
