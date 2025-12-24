import { useState } from 'react';
import { Search, TrendingUp, TrendingDown, Bot, ChevronRight, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useWatchlist } from '@/hooks/useWatchlist';

interface Symbol {
  id: string;
  name: string;
  price: number;
  change: number;
  category: 'stock' | 'metal';
}

interface SymbolSidebarProps {
  symbols: Symbol[];
  selectedSymbol: string;
  onSelectSymbol: (id: string) => void;
  onAISearch: (query: string) => void;
  isAILoading?: boolean;
  className?: string;
}

const presetQueries = [
  { label: '📰 News', query: 'Latest news and market updates' },
  { label: '📊 Sentiment', query: 'Market sentiment analysis' },
  { label: '📈 Analysis', query: 'Technical analysis and price targets' },
  { label: '🔗 Correlations', query: 'Asset correlations and market relationships' },
];

export const SymbolSidebar = ({
  symbols,
  selectedSymbol,
  onSelectSymbol,
  onAISearch,
  isAILoading,
  className,
}: SymbolSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [aiQuery, setAIQuery] = useState('');
  const { watchlist, toggleWatchlist, isInWatchlist } = useWatchlist();

  const filteredSymbols = symbols.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const watchlistSymbols = symbols.filter(s => watchlist.includes(s.id));

  const handleAISearch = () => {
    if (aiQuery.trim()) {
      onAISearch(aiQuery);
    }
  };

  const handlePresetClick = (query: string) => {
    const selected = symbols.find(s => s.id === selectedSymbol);
    const fullQuery = selected ? `${query} for ${selected.name}` : query;
    onAISearch(fullQuery);
  };

  const SymbolItem = ({ symbol }: { symbol: Symbol }) => (
    <div
      className={cn(
        "w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm transition-colors group",
        selectedSymbol === symbol.id
          ? "bg-sidebar-primary text-sidebar-primary-foreground"
          : "hover:bg-sidebar-accent text-sidebar-foreground"
      )}
    >
      <button
        onClick={() => onSelectSymbol(symbol.id)}
        className="flex items-center gap-2 flex-1 text-left"
      >
        <span className="font-medium">{symbol.id}</span>
        <span className="text-xs opacity-70">{symbol.name}</span>
      </button>
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWatchlist(symbol.id);
          }}
          className={cn(
            "p-1 rounded transition-colors",
            isInWatchlist(symbol.id)
              ? "text-yellow-500"
              : "text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-yellow-500"
          )}
          title={isInWatchlist(symbol.id) ? "Remove from watchlist" : "Add to watchlist"}
        >
          <Star className={cn("h-3.5 w-3.5", isInWatchlist(symbol.id) && "fill-current")} />
        </button>
        <div className="flex items-center gap-1">
          {symbol.change >= 0 ? (
            <TrendingUp className="h-3 w-3 text-chart-up" />
          ) : (
            <TrendingDown className="h-3 w-3 text-chart-down" />
          )}
          <span className={cn(
            "text-xs font-medium",
            symbol.change >= 0 ? "text-chart-up" : "text-chart-down"
          )}>
            {symbol.change >= 0 ? '+' : ''}{symbol.change.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <aside className={cn("w-72 border-r border-border bg-sidebar flex flex-col", className)}>
      {/* Symbol Search */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search symbols..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-sidebar-accent border-sidebar-border"
          />
        </div>
      </div>

      {/* Symbol List with Tabs */}
      <Tabs defaultValue="all" className="flex-1 flex flex-col">
        <div className="px-2 pt-2">
          <TabsList className="w-full grid grid-cols-2 h-8">
            <TabsTrigger value="all" className="text-xs">All Symbols</TabsTrigger>
            <TabsTrigger value="watchlist" className="text-xs">
              <Star className="h-3 w-3 mr-1" />
              Watchlist ({watchlist.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="flex-1 mt-0">
          <ScrollArea className="h-full custom-scrollbar">
            <div className="p-2">
              <h3 className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Symbols
              </h3>
              <div className="space-y-0.5">
                {filteredSymbols.map((symbol) => (
                  <SymbolItem key={symbol.id} symbol={symbol} />
                ))}
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="watchlist" className="flex-1 mt-0">
          <ScrollArea className="h-full custom-scrollbar">
            <div className="p-2">
              {watchlistSymbols.length === 0 ? (
                <div className="px-3 py-8 text-center text-muted-foreground text-sm">
                  <Star className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>No symbols in watchlist</p>
                  <p className="text-xs mt-1">Click the star icon to add symbols</p>
                </div>
              ) : (
                <>
                  <h3 className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Favorites
                  </h3>
                  <div className="space-y-0.5">
                    {watchlistSymbols.map((symbol) => (
                      <SymbolItem key={symbol.id} symbol={symbol} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* AI Research Section */}
      <div className="border-t border-sidebar-border p-4 bg-ai-bg">
        <div className="flex items-center gap-2 mb-3">
          <Bot className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium">AI Research</h3>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Ask about markets..."
              value={aiQuery}
              onChange={(e) => setAIQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAISearch()}
              className="bg-background border-ai-border text-sm"
            />
            <Button 
              size="sm" 
              onClick={handleAISearch}
              disabled={isAILoading || !aiQuery.trim()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {presetQueries.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handlePresetClick(preset.query)}
                disabled={isAILoading}
                className="px-2 py-1 text-xs rounded-md bg-background border border-border 
                         hover:bg-muted hover:border-primary/30 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};
