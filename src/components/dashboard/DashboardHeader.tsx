import { Moon, Sun, Menu, Briefcase, RefreshCw, TrendingUp, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
  onMenuClick: () => void;
  onPortfolioClick?: () => void;
  onMarketInsightsClick?: () => void;
  onDataImportClick?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  lastUpdated?: Date | null;
}

export const DashboardHeader = ({ 
  onMenuClick, 
  onPortfolioClick,
  onMarketInsightsClick,
  onDataImportClick,
  onRefresh,
  isRefreshing,
  lastUpdated,
}: DashboardHeaderProps) => {
  const { theme, setTheme } = useTheme();

  const formatLastUpdated = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
    });
  };

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold gradient-text">DEPO</h1>
        <span className="hidden sm:inline text-xs text-muted-foreground">
          Financial Intelligence
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Last Updated & Refresh */}
        <div className="hidden sm:flex items-center gap-2 mr-2">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Updated {formatLastUpdated(lastUpdated)}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-8 w-8"
            title="Refresh market data"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>
        </div>

        {/* Data Import Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onDataImportClick}
          className="gap-2"
        >
          <Database className="h-4 w-4" />
          <span className="hidden sm:inline">Import</span>
        </Button>

        {/* Market Insights Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onMarketInsightsClick}
          className="gap-2"
        >
          <TrendingUp className="h-4 w-4" />
          <span className="hidden sm:inline">Insights</span>
        </Button>

        {/* Portfolio Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onPortfolioClick}
          className="gap-2"
        >
          <Briefcase className="h-4 w-4" />
          <span className="hidden sm:inline">Portfolio</span>
        </Button>
        
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="rounded-full"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
    </header>
  );
};
