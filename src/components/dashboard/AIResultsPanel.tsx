import { X, ExternalLink, Bookmark, MessageSquarePlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface AIResultsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  query?: string;
  answer?: string;
  citations?: string[];
  isLoading?: boolean;
  className?: string;
}

export const AIResultsPanel = ({
  isOpen,
  onClose,
  query,
  answer,
  citations,
  isLoading,
  className,
}: AIResultsPanelProps) => {
  if (!isOpen) return null;

  const getDomainFromUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
    } catch {
      return 'Source';
    }
  };

  const formatAnswer = (text: string) => {
    return text.split('\n\n').map((paragraph, i) => (
      <p key={i} className="mb-4 last:mb-0">{paragraph}</p>
    ));
  };

  return (
    <aside className={cn(
      "w-96 border-l border-border bg-card flex flex-col animate-slide-in-right",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-semibold">AI Insights</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 custom-scrollbar">
        <div className="p-4 space-y-4">
          {/* Query Display */}
          {query && (
            <div className="bg-muted rounded-lg p-3">
              <p className="text-sm text-muted-foreground mb-1">Your question:</p>
              <p className="text-sm font-medium">{query}</p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Researching...</span>
            </div>
          )}

          {/* Answer */}
          {!isLoading && answer && (
            <div className="ai-result-card">
              <div className="prose-answer text-sm">
                {formatAnswer(answer)}
              </div>
            </div>
          )}

          {/* Citations */}
          {!isLoading && citations && citations.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Sources
              </h4>
              <div className="space-y-2">
                {citations.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted 
                             text-sm transition-colors group"
                  >
                    <span className="flex items-center justify-center w-5 h-5 rounded bg-primary/10 
                                   text-primary text-xs font-medium">
                      {index + 1}
                    </span>
                    <span className="flex-1 truncate text-foreground">
                      {getDomainFromUrl(url)}
                    </span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground 
                                            group-hover:text-foreground transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Actions */}
      {!isLoading && answer && (
        <div className="p-4 border-t border-border flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Bookmark className="h-4 w-4 mr-1" />
            Save
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <MessageSquarePlus className="h-4 w-4 mr-1" />
            Follow-up
          </Button>
        </div>
      )}
    </aside>
  );
};
