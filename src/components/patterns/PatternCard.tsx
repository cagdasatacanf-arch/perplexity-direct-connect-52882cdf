import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, Target, ShieldAlert } from 'lucide-react';
import { PatternMatch, patternDisplayNames, directionColors } from '@/lib/patternTypes';

interface PatternCardProps {
  pattern: PatternMatch;
}

export const PatternCard = ({ pattern }: PatternCardProps) => {
  const DirectionIcon = pattern.direction === 'bullish' 
    ? TrendingUp 
    : pattern.direction === 'bearish' 
      ? TrendingDown 
      : Minus;

  const confidenceColor = 
    pattern.confidence >= 80 ? 'bg-emerald-500' :
    pattern.confidence >= 60 ? 'bg-yellow-500' :
    'bg-red-500';

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">
              {patternDisplayNames[pattern.pattern]}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Detected {new Date(pattern.detectedAt).toLocaleDateString()} • {pattern.timeframe}
            </p>
          </div>
          <Badge 
            variant="outline" 
            className={`${directionColors[pattern.direction]} border-current`}
          >
            <DirectionIcon className="h-3 w-3 mr-1" />
            {pattern.direction.charAt(0).toUpperCase() + pattern.direction.slice(1)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Confidence Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Confidence</span>
            <span className="font-semibold">{pattern.confidence}%</span>
          </div>
          <div className="relative">
            <Progress value={pattern.confidence} className="h-2" />
            <div 
              className={`absolute top-0 left-0 h-2 rounded-full ${confidenceColor}`}
              style={{ width: `${pattern.confidence}%` }}
            />
          </div>
        </div>

        {/* Price Targets */}
        <div className="grid grid-cols-2 gap-3">
          {pattern.priceTarget && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <Target className="h-4 w-4 text-emerald-500" />
              <div>
                <p className="text-xs text-muted-foreground">Target</p>
                <p className="font-mono font-semibold">${pattern.priceTarget.toFixed(2)}</p>
              </div>
            </div>
          )}
          {pattern.stopLoss && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <ShieldAlert className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-xs text-muted-foreground">Stop Loss</p>
                <p className="font-mono font-semibold">${pattern.stopLoss.toFixed(2)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Evidence List */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Evidence</h4>
          <div className="space-y-1">
            {pattern.evidence.map((ev, idx) => (
              <div 
                key={idx}
                className="flex items-start gap-2 text-sm p-2 rounded bg-muted/30"
              >
                <span className="text-muted-foreground">•</span>
                <span>{ev.description}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
