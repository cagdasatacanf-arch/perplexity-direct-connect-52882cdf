import { TrendingUp, TrendingDown, Activity, BarChart3, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsPanelProps {
  stats: {
    min: number;
    max: number;
    avg: number;
    volume: number;
    volatility: number;
    change: number;
  };
  className?: string;
}

export const StatsPanel = ({ stats, className }: StatsPanelProps) => {
  const formatPrice = (value: number) =>
    `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatVolume = (value: number) => {
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
    return value.toString();
  };

  const statItems = [
    { 
      label: 'Min', 
      value: formatPrice(stats.min), 
      icon: TrendingDown,
      color: 'text-chart-down'
    },
    { 
      label: 'Max', 
      value: formatPrice(stats.max), 
      icon: TrendingUp,
      color: 'text-chart-up'
    },
    { 
      label: 'Average', 
      value: formatPrice(stats.avg), 
      icon: Activity,
      color: 'text-primary'
    },
    { 
      label: 'Volume', 
      value: formatVolume(stats.volume), 
      icon: BarChart3,
      color: 'text-muted-foreground'
    },
    { 
      label: 'Volatility', 
      value: `${stats.volatility.toFixed(2)}%`, 
      icon: Percent,
      color: 'text-warning'
    },
  ];

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-5 gap-3 p-4", className)}>
      {statItems.map((stat) => (
        <div key={stat.label} className="stat-card">
          <div className="flex items-center gap-2 mb-1">
            <stat.icon className={cn("h-4 w-4", stat.color)} />
            <span className="text-xs text-muted-foreground">{stat.label}</span>
          </div>
          <p className="text-lg font-semibold font-mono">{stat.value}</p>
        </div>
      ))}
    </div>
  );
};
