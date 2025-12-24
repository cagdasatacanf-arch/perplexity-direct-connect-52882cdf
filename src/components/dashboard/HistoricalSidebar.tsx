import { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { Activity, ChevronRight, ChevronLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { OHLCData } from '@/lib/sampleData';

interface HistoricalSidebarProps {
  data: OHLCData[];
  symbolId: string;
  symbolName: string;
  isOpen: boolean;
  onToggle: () => void;
}

const formatVolume = (value: number) => {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toString();
};

export const HistoricalSidebar = ({
  data,
  symbolId,
  symbolName,
  isOpen,
  onToggle,
}: HistoricalSidebarProps) => {
  // Calculate daily returns and volatility
  const analysisData = useMemo(() => {
    return data.map((d, i) => {
      const prevClose = i > 0 ? data[i - 1].close : d.open;
      const dailyReturn = ((d.close - prevClose) / prevClose) * 100;
      const range = ((d.high - d.low) / d.low) * 100;
      const bodySize = Math.abs(((d.close - d.open) / d.open) * 100);
      
      return {
        ...d,
        dailyReturn,
        range,
        bodySize,
        isUp: d.close >= d.open,
        priceChange: d.close - prevClose,
      };
    });
  }, [data]);

  // Calculate rolling volatility (20-day)
  const volatilityData = useMemo(() => {
    return analysisData.map((d, i) => {
      if (i < 19) return { ...d, volatility: undefined };
      
      const slice = analysisData.slice(i - 19, i + 1);
      const returns = slice.map(s => s.dailyReturn);
      const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
      const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
      const volatility = Math.sqrt(variance) * Math.sqrt(252);
      
      return { ...d, volatility };
    });
  }, [analysisData]);

  // Calculate cumulative returns
  const cumulativeData = useMemo(() => {
    let cumReturn = 0;
    return analysisData.map(d => {
      cumReturn += d.dailyReturn;
      return { ...d, cumulativeReturn: cumReturn };
    });
  }, [analysisData]);

  // Calculate distribution of returns
  const returnDistribution = useMemo(() => {
    const buckets: { range: string; count: number; color: string }[] = [
      { range: '<-3%', count: 0, color: 'hsl(var(--chart-down))' },
      { range: '-3 to -1%', count: 0, color: 'hsl(var(--chart-down)/0.7)' },
      { range: '-1 to 0%', count: 0, color: 'hsl(var(--chart-down)/0.4)' },
      { range: '0 to 1%', count: 0, color: 'hsl(var(--chart-up)/0.4)' },
      { range: '1 to 3%', count: 0, color: 'hsl(var(--chart-up)/0.7)' },
      { range: '>3%', count: 0, color: 'hsl(var(--chart-up))' },
    ];

    analysisData.forEach(d => {
      if (d.dailyReturn < -3) buckets[0].count++;
      else if (d.dailyReturn < -1) buckets[1].count++;
      else if (d.dailyReturn < 0) buckets[2].count++;
      else if (d.dailyReturn < 1) buckets[3].count++;
      else if (d.dailyReturn < 3) buckets[4].count++;
      else buckets[5].count++;
    });

    return buckets;
  }, [analysisData]);

  // Summary statistics
  const stats = useMemo(() => {
    const returns = analysisData.map(d => d.dailyReturn);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const positiveD = returns.filter(r => r > 0).length;
    const negativeD = returns.filter(r => r <= 0).length;
    const maxGain = Math.max(...returns);
    const maxLoss = Math.min(...returns);
    const avgVolume = data.reduce((sum, d) => sum + d.volume, 0) / data.length;
    const totalReturn = ((data[data.length - 1].close - data[0].close) / data[0].close) * 100;

    return {
      avgReturn,
      positiveD,
      negativeD,
      winRate: (positiveD / returns.length) * 100,
      maxGain,
      maxLoss,
      avgVolume,
      totalReturn,
    };
  }, [analysisData, data]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.[0]) return null;
    const d = payload[0].payload;
    
    return (
      <div className="bg-popover border border-border rounded-lg p-2 shadow-lg text-xs">
        <p className="font-medium mb-1">{label}</p>
        <div className="space-y-0.5">
          {d.dailyReturn !== undefined && (
            <p className={cn(d.dailyReturn >= 0 ? "text-chart-up" : "text-chart-down")}>
              {d.dailyReturn >= 0 ? '+' : ''}{d.dailyReturn.toFixed(2)}%
            </p>
          )}
          {d.cumulativeReturn !== undefined && (
            <p className="text-muted-foreground">
              Cum: {d.cumulativeReturn >= 0 ? '+' : ''}{d.cumulativeReturn.toFixed(1)}%
            </p>
          )}
          {d.volatility !== undefined && (
            <p className="text-muted-foreground">
              Vol: {d.volatility.toFixed(1)}%
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={cn(
      "hidden lg:flex flex-col border-l bg-card transition-all duration-300",
      isOpen ? "w-80" : "w-10"
    )}>
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="h-10 w-full rounded-none border-b justify-center"
      >
        {isOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      {isOpen && (
        <ScrollArea className="flex-1">
          <div className="p-3">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">Historical Data</span>
              <Badge variant="outline" className="ml-auto text-[10px]">
                {symbolId}
              </Badge>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="p-2 rounded-lg bg-muted/50 border">
                <p className="text-[10px] text-muted-foreground">Total Return</p>
                <p className={cn(
                  "text-sm font-bold",
                  stats.totalReturn >= 0 ? "text-chart-up" : "text-chart-down"
                )}>
                  {stats.totalReturn >= 0 ? '+' : ''}{stats.totalReturn.toFixed(2)}%
                </p>
              </div>
              <div className="p-2 rounded-lg bg-muted/50 border">
                <p className="text-[10px] text-muted-foreground">Win Rate</p>
                <p className="text-sm font-bold">{stats.winRate.toFixed(1)}%</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/50 border">
                <p className="text-[10px] text-muted-foreground">Best Day</p>
                <p className="text-sm font-bold text-chart-up">+{stats.maxGain.toFixed(2)}%</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/50 border">
                <p className="text-[10px] text-muted-foreground">Worst Day</p>
                <p className="text-sm font-bold text-chart-down">{stats.maxLoss.toFixed(2)}%</p>
              </div>
            </div>

            <Tabs defaultValue="returns" className="w-full">
              <TabsList className="w-full grid grid-cols-2 h-8 mb-3">
                <TabsTrigger value="returns" className="text-[10px]">Returns</TabsTrigger>
                <TabsTrigger value="cumulative" className="text-[10px]">Cumulative</TabsTrigger>
              </TabsList>

              <TabsContent value="returns" className="mt-0">
                <ResponsiveContainer width="100%" height={160}>
                  <ComposedChart data={analysisData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      tickFormatter={(v) => `${v.toFixed(0)}%`}
                      width={30}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={0} stroke="hsl(var(--border))" />
                    <Bar dataKey="dailyReturn" radius={[1, 1, 0, 0]}>
                      {analysisData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`}
                          fill={entry.isUp ? 'hsl(var(--chart-up))' : 'hsl(var(--chart-down))'}
                          fillOpacity={0.8}
                        />
                      ))}
                    </Bar>
                  </ComposedChart>
                </ResponsiveContainer>
              </TabsContent>

              <TabsContent value="cumulative" className="mt-0">
                <ResponsiveContainer width="100%" height={160}>
                  <ComposedChart data={cumulativeData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      tickFormatter={(v) => `${v.toFixed(0)}%`}
                      width={30}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={0} stroke="hsl(var(--border))" />
                    <Area
                      type="monotone"
                      dataKey="cumulativeReturn"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.2}
                      strokeWidth={1.5}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </TabsContent>
            </Tabs>

            {/* Second row of tabs */}
            <Tabs defaultValue="volatility" className="w-full mt-4">
              <TabsList className="w-full grid grid-cols-2 h-8 mb-3">
                <TabsTrigger value="volatility" className="text-[10px]">Volatility</TabsTrigger>
                <TabsTrigger value="distribution" className="text-[10px]">Distribution</TabsTrigger>
              </TabsList>

              <TabsContent value="volatility" className="mt-0">
                <ResponsiveContainer width="100%" height={160}>
                  <ComposedChart data={volatilityData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      tickFormatter={(v) => `${v.toFixed(0)}%`}
                      width={30}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="volatility"
                      stroke="hsl(280 80% 60%)"
                      strokeWidth={1.5}
                      dot={false}
                      connectNulls
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </TabsContent>

              <TabsContent value="distribution" className="mt-0">
                <ResponsiveContainer width="100%" height={160}>
                  <ComposedChart 
                    data={returnDistribution} 
                    layout="vertical"
                    margin={{ top: 5, right: 5, left: 40, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis 
                      type="number"
                      tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                    />
                    <YAxis 
                      type="category"
                      dataKey="range"
                      tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      width={40}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${value} days`, 'Count']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '10px',
                      }}
                    />
                    <Bar dataKey="count" radius={[0, 2, 2, 0]}>
                      {returnDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </ComposedChart>
                </ResponsiveContainer>
              </TabsContent>
            </Tabs>

            {/* Period stats */}
            <div className="mt-4 p-2 rounded-lg bg-muted/30 border text-xs">
              <p className="text-muted-foreground mb-1">Period: {data.length} trading days</p>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Positive days:</span>
                <span className="text-chart-up font-medium">{stats.positiveD}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Negative days:</span>
                <span className="text-chart-down font-medium">{stats.negativeD}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg daily:</span>
                <span className={cn(
                  "font-medium",
                  stats.avgReturn >= 0 ? "text-chart-up" : "text-chart-down"
                )}>
                  {stats.avgReturn >= 0 ? '+' : ''}{stats.avgReturn.toFixed(3)}%
                </span>
              </div>
            </div>
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
