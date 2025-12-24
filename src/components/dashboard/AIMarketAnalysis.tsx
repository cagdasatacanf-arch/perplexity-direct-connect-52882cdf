import { useState, useCallback } from 'react';
import { Bot, TrendingUp, TrendingDown, Newspaper, BarChart3, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { perplexityApi, type PerplexityResponse } from '@/lib/api/perplexity';
import { toast } from 'sonner';

interface AIMarketAnalysisProps {
  symbolId: string;
  symbolName: string;
  currentPrice: number;
  className?: string;
}

type AnalysisType = 'sentiment' | 'technical' | 'news' | 'forecast';

interface AnalysisResult {
  type: AnalysisType;
  content: string;
  citations: string[];
  timestamp: Date;
}

const analysisTypes: { type: AnalysisType; label: string; icon: React.ReactNode; prompt: (symbol: string, name: string) => string }[] = [
  {
    type: 'sentiment',
    label: 'Sentiment',
    icon: <Sparkles className="h-4 w-4" />,
    prompt: (symbol, name) => `Analyze the current market sentiment for ${name} (${symbol}). Include social media sentiment, analyst opinions, and overall market mood. Rate sentiment as bullish, bearish, or neutral with confidence level.`,
  },
  {
    type: 'technical',
    label: 'Technical',
    icon: <BarChart3 className="h-4 w-4" />,
    prompt: (symbol, name) => `Provide a technical analysis for ${name} (${symbol}). Include key support/resistance levels, current trend direction, RSI, MACD signals, and moving average crossovers. Give actionable insights.`,
  },
  {
    type: 'news',
    label: 'News',
    icon: <Newspaper className="h-4 w-4" />,
    prompt: (symbol, name) => `What are the latest significant news and events affecting ${name} (${symbol})? Include earnings reports, product launches, regulatory changes, and market-moving announcements from the past week.`,
  },
  {
    type: 'forecast',
    label: 'Forecast',
    icon: <TrendingUp className="h-4 w-4" />,
    prompt: (symbol, name) => `What are the price forecasts and analyst targets for ${name} (${symbol})? Include consensus price targets, analyst ratings distribution (buy/hold/sell), and key factors that could affect the stock price.`,
  },
];

export const AIMarketAnalysis = ({
  symbolId,
  symbolName,
  currentPrice,
  className,
}: AIMarketAnalysisProps) => {
  const [loading, setLoading] = useState<AnalysisType | null>(null);
  const [results, setResults] = useState<Record<AnalysisType, AnalysisResult | null>>({
    sentiment: null,
    technical: null,
    news: null,
    forecast: null,
  });

  const runAnalysis = useCallback(async (type: AnalysisType) => {
    const analysisConfig = analysisTypes.find(a => a.type === type);
    if (!analysisConfig) return;

    setLoading(type);

    try {
      const response = await perplexityApi.search(analysisConfig.prompt(symbolId, symbolName));
      
      if (response.success && response.answer) {
        setResults(prev => ({
          ...prev,
          [type]: {
            type,
            content: response.answer!,
            citations: response.citations || [],
            timestamp: new Date(),
          },
        }));
      } else {
        toast.error(`Failed to get ${analysisConfig.label.toLowerCase()} analysis`);
      }
    } catch (error) {
      toast.error('Analysis failed. Please try again.');
    } finally {
      setLoading(null);
    }
  }, [symbolId, symbolName]);

  const getSentimentBadge = (content: string) => {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('bullish') || lowerContent.includes('positive')) {
      return <Badge className="bg-chart-up/20 text-chart-up border-chart-up/30">Bullish</Badge>;
    }
    if (lowerContent.includes('bearish') || lowerContent.includes('negative')) {
      return <Badge className="bg-chart-down/20 text-chart-down border-chart-down/30">Bearish</Badge>;
    }
    return <Badge variant="secondary">Neutral</Badge>;
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bot className="h-5 w-5 text-primary" />
          AI Market Analysis
          <Badge variant="outline" className="ml-auto font-normal">
            {symbolId}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Analysis Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {analysisTypes.map((analysis) => (
            <Button
              key={analysis.type}
              variant={results[analysis.type] ? "secondary" : "outline"}
              size="sm"
              onClick={() => runAnalysis(analysis.type)}
              disabled={loading !== null}
              className="gap-1.5"
            >
              {loading === analysis.type ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                analysis.icon
              )}
              {analysis.label}
            </Button>
          ))}
        </div>

        {/* Results */}
        <ScrollArea className="h-[300px]">
          <div className="space-y-4 pr-4">
            {Object.entries(results).map(([type, result]) => {
              if (!result) return null;
              const config = analysisTypes.find(a => a.type === type);
              
              return (
                <div key={type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {config?.icon}
                      <span className="font-medium text-sm">{config?.label} Analysis</span>
                    </div>
                    {type === 'sentiment' && getSentimentBadge(result.content)}
                    <span className="text-xs text-muted-foreground">
                      {result.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground leading-relaxed bg-muted/50 rounded-lg p-3">
                    {result.content.split('\n').map((para, i) => (
                      para.trim() && <p key={i} className="mb-2 last:mb-0">{para}</p>
                    ))}
                  </div>
                  {result.citations.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {result.citations.slice(0, 3).map((url, i) => {
                        try {
                          const domain = new URL(url).hostname.replace('www.', '');
                          return (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline"
                            >
                              {domain}
                            </a>
                          );
                        } catch {
                          return null;
                        }
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {!Object.values(results).some(r => r !== null) && (
              <div className="text-center py-8 text-muted-foreground">
                <Bot className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Click an analysis type above to get AI-powered insights</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
