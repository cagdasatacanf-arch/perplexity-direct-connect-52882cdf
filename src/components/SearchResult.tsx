import { ExternalLink, Sparkles } from 'lucide-react';

interface SearchResultProps {
  query: string;
  answer: string;
  citations: string[];
}

export const SearchResult = ({ query, answer, citations }: SearchResultProps) => {
  const formatAnswer = (text: string) => {
    // Simple formatting: convert markdown-style formatting
    return text
      .split('\n\n')
      .map((paragraph, i) => (
        <p key={i} className="mb-4 last:mb-0">
          {paragraph}
        </p>
      ));
  };

  const getDomainFromUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain;
    } catch {
      return url;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-in">
      {/* Query echo */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">{query}</h2>
      </div>

      {/* Answer section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-muted-foreground">Answer</span>
        </div>
        <div className="prose-answer text-foreground">
          {formatAnswer(answer)}
        </div>
      </div>

      {/* Citations */}
      {citations.length > 0 && (
        <div className="pt-4 border-t border-border">
          <span className="text-sm font-medium text-muted-foreground mb-3 block">Sources</span>
          <div className="flex flex-wrap gap-2">
            {citations.map((url, index) => (
              <a
                key={index}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-citation-bg border border-citation-border text-sm text-foreground hover:bg-primary/10 transition-colors"
              >
                <span className="text-xs font-medium text-primary">{index + 1}</span>
                <span className="truncate max-w-[150px]">{getDomainFromUrl(url)}</span>
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
