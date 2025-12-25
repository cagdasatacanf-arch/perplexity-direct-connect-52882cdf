import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, BarChart3 } from 'lucide-react';
import { PatternAnalysisResponse, directionColors } from '@/lib/patternTypes';
import { PatternCard } from './PatternCard';
import { PatternChart } from './PatternChart';

interface PatternResultsProps {
  response: PatternAnalysisResponse | null;
  isLoading: boolean;
}

export const PatternResults = ({ response, isLoading }: PatternResultsProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 animate-pulse">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <p className="text-muted-foreground">Analyzing patterns...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!response) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              Select a symbol and patterns to analyze
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (!response.success) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Analysis Failed</AlertTitle>
        <AlertDescription>
          {response.error || 'An unknown error occurred. Please try again.'}
        </AlertDescription>
      </Alert>
    );
  }

  const { data } = response;
  const DirectionIcon = data.summary.dominantDirection === 'bullish'
    ? TrendingUp
    : data.summary.dominantDirection === 'bearish'
      ? TrendingDown
      : Minus;

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Analysis Results: {data.symbol}</span>
            <Badge variant="outline" className="text-xs">
              {new Date(response.timestamp).toLocaleString()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{data.summary.totalPatterns}</p>
              <p className="text-sm text-muted-foreground">Patterns Found</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{data.summary.avgConfidence.toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground">Avg Confidence</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className={`flex items-center justify-center gap-1 ${directionColors[data.summary.dominantDirection]}`}>
                <DirectionIcon className="h-5 w-5" />
                <span className="text-lg font-bold capitalize">{data.summary.dominantDirection}</span>
              </div>
              <p className="text-sm text-muted-foreground">Dominant Signal</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Price Chart with Pattern Overlays */}
      <PatternChart symbol={data.symbol} patterns={data.patterns} />

      {/* Pattern Cards */}
      {data.patterns.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {data.patterns.map(pattern => (
            <PatternCard key={pattern.id} pattern={pattern} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No patterns detected for the selected criteria.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
