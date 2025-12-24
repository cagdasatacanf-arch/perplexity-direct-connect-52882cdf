import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Sparkles, ExternalLink, Clock, Loader2 } from 'lucide-react';
import { mockSearchResults } from '@/lib/mockData';

export const PerplexitySearchPanel = () => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(mockSearchResults);

  const presetQueries = [
    'What are the latest AI trends?',
    'Gold price forecast 2024',
    'Best performing tech stocks',
    'Crypto market analysis',
  ];

  const handleSearch = () => {
    if (!query.trim()) return;
    setIsSearching(true);
    
    setTimeout(() => {
      const newResult = {
        query,
        answer: `This is a mock response for: "${query}". In a real implementation, this would contain the AI-generated answer with citations from web sources.`,
        citations: ['https://example.com/source1', 'https://example.com/source2'],
        timestamp: new Date(),
      };
      setResults([newResult, ...results]);
      setQuery('');
      setIsSearching(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI-Powered Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Ask anything about markets, trends, or analysis..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-h-24 resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSearch();
                }
              }}
            />
            <div className="flex justify-between items-center">
              <div className="flex flex-wrap gap-2">
                {presetQueries.map((preset) => (
                  <Button
                    key={preset}
                    variant="outline"
                    size="sm"
                    onClick={() => setQuery(preset)}
                    className="text-xs"
                  >
                    {preset}
                  </Button>
                ))}
              </div>
              <Button onClick={handleSearch} disabled={!query.trim() || isSearching}>
                {isSearching ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Search Results</span>
            <Badge variant="secondary">{results.length} queries</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-6">
              {results.map((result, index) => (
                <div key={index} className="space-y-3 pb-6 border-b last:border-0">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-medium text-primary">{result.query}</h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                      <Clock className="h-3 w-3" />
                      {result.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-muted/50 text-sm leading-relaxed">
                    {result.answer}
                  </div>
                  
                  {result.citations.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">Sources:</p>
                      <div className="flex flex-wrap gap-2">
                        {result.citations.map((url, i) => (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {new URL(url).hostname}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
