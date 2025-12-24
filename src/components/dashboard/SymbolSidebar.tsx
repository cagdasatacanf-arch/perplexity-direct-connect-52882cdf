import { useState } from 'react';
import { Search, TrendingUp, TrendingDown, Bot, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

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

  const filteredSymbols = symbols.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      {/* Symbol List */}
      <ScrollArea className="flex-1 custom-scrollbar">
        <div className="p-2">
          <h3 className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Symbols
          </h3>
          <div className="space-y-0.5">
            {filteredSymbols.map((symbol) => (
              <button
                key={symbol.id}
                onClick={() => onSelectSymbol(symbol.id)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm transition-colors",
                  selectedSymbol === symbol.id
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "hover:bg-sidebar-accent text-sidebar-foreground"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{symbol.id}</span>
                  <span className="text-xs opacity-70">{symbol.name}</span>
                </div>
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
              </button>
            ))}
          </div>
        </div>
      </ScrollArea>

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
