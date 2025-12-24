import { useState } from 'react';
import { SearchInput } from '@/components/SearchInput';
import { SearchResult } from '@/components/SearchResult';
import { perplexityApi, PerplexityResponse } from '@/lib/api/perplexity';
import { useToast } from '@/hooks/use-toast';
import { Sparkles } from 'lucide-react';

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ query: string; answer: string; citations: string[] } | null>(null);
  const { toast } = useToast();

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    setResult(null);

    try {
      const response: PerplexityResponse = await perplexityApi.search(query);

      if (response.success && response.answer) {
        setResult({
          query,
          answer: response.answer,
          citations: response.citations || [],
        });
      } else {
        toast({
          title: "Search failed",
          description: response.error || "Unable to get a response. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Connection error",
        description: "Failed to connect to search service. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewSearch = () => {
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          {!result && (
            <div className="mb-8 pt-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-semibold mb-4">
                <span className="gradient-text">AI Search</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                Get instant answers with real-time web search powered by Perplexity AI
              </p>
            </div>
          )}

          {result && (
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={handleNewSearch}
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                ← New search
              </button>
            </div>
          )}
        </header>

        {/* Search Input */}
        <div className={`transition-all duration-300 ${result ? 'mb-8' : 'mb-16'}`}>
          <SearchInput
            onSearch={handleSearch}
            isLoading={isLoading}
            placeholder={result ? "Ask a follow-up question..." : "Ask anything..."}
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
              </div>
              <span className="text-sm">Searching the web...</span>
            </div>
          </div>
        )}

        {/* Result */}
        {result && !isLoading && (
          <SearchResult
            query={result.query}
            answer={result.answer}
            citations={result.citations}
          />
        )}

        {/* Suggestions when no result */}
        {!result && !isLoading && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">Try asking</p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                "What are the latest AI developments?",
                "Explain quantum computing simply",
                "Best practices for React in 2024",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSearch(suggestion)}
                  className="px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm hover:bg-secondary/80 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
