import { useState, useRef, useEffect } from 'react';
import { Search, ArrowRight, Loader2 } from 'lucide-react';

interface SearchInputProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

export const SearchInput = ({ onSearch, isLoading, placeholder = "Ask anything..." }: SearchInputProps) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative search-glow rounded-2xl bg-search-bg">
        <div className="flex items-center">
          <div className="pl-5 pr-3">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            disabled={isLoading}
            className="flex-1 py-4 pr-4 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-base"
          />
          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className="mr-2 p-2.5 rounded-xl bg-primary text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ArrowRight className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </form>
  );
};
