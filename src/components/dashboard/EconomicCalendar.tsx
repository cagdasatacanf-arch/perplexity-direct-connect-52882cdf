import { useMemo } from 'react';
import { Calendar, TrendingUp, Landmark, Building2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface EconomicEvent {
  id: string;
  title: string;
  date: Date;
  type: 'fed' | 'earnings' | 'economic' | 'market';
  importance: 'high' | 'medium' | 'low';
  symbol?: string;
  description?: string;
}

interface EconomicCalendarProps {
  className?: string;
}

const eventTypeConfig = {
  fed: { icon: Landmark, label: 'Fed', color: 'text-blue-500 bg-blue-500/10' },
  earnings: { icon: TrendingUp, label: 'Earnings', color: 'text-green-500 bg-green-500/10' },
  economic: { icon: Building2, label: 'Economic', color: 'text-purple-500 bg-purple-500/10' },
  market: { icon: AlertCircle, label: 'Market', color: 'text-orange-500 bg-orange-500/10' },
};

const importanceConfig = {
  high: { label: 'High Impact', color: 'bg-chart-down/20 text-chart-down border-chart-down/30' },
  medium: { label: 'Medium', color: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30' },
  low: { label: 'Low', color: 'bg-muted text-muted-foreground border-border' },
};

// Generate upcoming events dynamically based on current date
const generateUpcomingEvents = (): EconomicEvent[] => {
  const now = new Date();
  const events: EconomicEvent[] = [];

  // Helper to add days to a date
  const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  // Fed meetings (typically every 6 weeks)
  const fedDates = [
    { offset: 3, title: 'FOMC Meeting Minutes Release' },
    { offset: 12, title: 'Fed Interest Rate Decision' },
    { offset: 28, title: 'Fed Chair Powell Speech' },
    { offset: 45, title: 'FOMC Meeting' },
  ];

  fedDates.forEach(({ offset, title }, i) => {
    events.push({
      id: `fed-${i}`,
      title,
      date: addDays(now, offset),
      type: 'fed',
      importance: title.includes('Interest Rate') ? 'high' : 'medium',
      description: title.includes('Interest Rate') 
        ? 'Federal Reserve interest rate announcement and economic projections'
        : 'Federal Reserve communication event',
    });
  });

  // Earnings dates for tracked symbols
  const earningsSchedule = [
    { symbol: 'AAPL', offset: 8, title: 'Apple Q4 Earnings' },
    { symbol: 'MSFT', offset: 10, title: 'Microsoft Q2 Earnings' },
    { symbol: 'GOOGL', offset: 15, title: 'Alphabet Q4 Earnings' },
    { symbol: 'AMZN', offset: 18, title: 'Amazon Q4 Earnings' },
    { symbol: 'TSLA', offset: 22, title: 'Tesla Q4 Earnings' },
    { symbol: 'NVDA', offset: 35, title: 'NVIDIA Q4 Earnings' },
  ];

  earningsSchedule.forEach(({ symbol, offset, title }, i) => {
    events.push({
      id: `earnings-${i}`,
      title,
      date: addDays(now, offset),
      type: 'earnings',
      importance: 'high',
      symbol,
      description: `Quarterly earnings report and investor call`,
    });
  });

  // Economic indicators
  const economicEvents = [
    { offset: 2, title: 'Initial Jobless Claims', importance: 'medium' as const },
    { offset: 5, title: 'Non-Farm Payrolls', importance: 'high' as const },
    { offset: 7, title: 'CPI Inflation Report', importance: 'high' as const },
    { offset: 14, title: 'Retail Sales Data', importance: 'medium' as const },
    { offset: 21, title: 'GDP Growth Rate', importance: 'high' as const },
    { offset: 25, title: 'Consumer Confidence Index', importance: 'medium' as const },
    { offset: 30, title: 'PCE Price Index', importance: 'high' as const },
  ];

  economicEvents.forEach(({ offset, title, importance }, i) => {
    events.push({
      id: `economic-${i}`,
      title,
      date: addDays(now, offset),
      type: 'economic',
      importance,
      description: 'Key economic indicator release',
    });
  });

  // Market events
  const marketEvents = [
    { offset: 1, title: 'Options Expiration', importance: 'medium' as const },
    { offset: 20, title: 'Triple Witching Day', importance: 'high' as const },
    { offset: 32, title: 'Month End Rebalancing', importance: 'low' as const },
  ];

  marketEvents.forEach(({ offset, title, importance }, i) => {
    events.push({
      id: `market-${i}`,
      title,
      date: addDays(now, offset),
      type: 'market',
      importance,
      description: 'Market structure event',
    });
  });

  // Sort by date
  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
};

const formatEventDate = (date: Date): string => {
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return `In ${diffDays} days`;

  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    weekday: 'short',
  });
};

const formatFullDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', { 
    weekday: 'long',
    month: 'long', 
    day: 'numeric',
    year: 'numeric',
  });
};

export const EconomicCalendar = ({ className }: EconomicCalendarProps) => {
  const events = useMemo(() => generateUpcomingEvents(), []);

  // Group events by week
  const groupedEvents = useMemo(() => {
    const now = new Date();
    const thisWeek: EconomicEvent[] = [];
    const nextWeek: EconomicEvent[] = [];
    const later: EconomicEvent[] = [];

    events.forEach(event => {
      const diffDays = Math.ceil((event.date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 7) {
        thisWeek.push(event);
      } else if (diffDays <= 14) {
        nextWeek.push(event);
      } else {
        later.push(event);
      }
    });

    return { thisWeek, nextWeek, later };
  }, [events]);

  const EventItem = ({ event }: { event: EconomicEvent }) => {
    const typeConfig = eventTypeConfig[event.type];
    const impConfig = importanceConfig[event.importance];
    const Icon = typeConfig.icon;

    return (
      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
        <div className={cn("p-2 rounded-md", typeConfig.color)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-sm leading-tight">{event.title}</p>
              {event.symbol && (
                <Badge variant="outline" className="mt-1 text-xs">
                  {event.symbol}
                </Badge>
              )}
            </div>
            <Badge 
              variant="outline" 
              className={cn("shrink-0 text-xs", impConfig.color)}
            >
              {impConfig.label}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span title={formatFullDate(event.date)}>
              {formatEventDate(event.date)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const EventSection = ({ title, events }: { title: string; events: EconomicEvent[] }) => {
    if (events.length === 0) return null;
    
    return (
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
          {title}
        </h4>
        <div className="space-y-2">
          {events.map(event => (
            <EventItem key={event.id} event={event} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="h-5 w-5 text-primary" />
          Economic Calendar
          <Badge variant="outline" className="ml-auto font-normal text-xs">
            {events.length} events
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Event Type Legend */}
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(eventTypeConfig).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className={cn("p-1 rounded", config.color)}>
                  <Icon className="h-3 w-3" />
                </div>
                <span>{config.label}</span>
              </div>
            );
          })}
        </div>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            <EventSection title="This Week" events={groupedEvents.thisWeek} />
            <EventSection title="Next Week" events={groupedEvents.nextWeek} />
            <EventSection title="Coming Up" events={groupedEvents.later.slice(0, 10)} />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
