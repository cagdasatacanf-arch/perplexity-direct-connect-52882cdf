import { useState, useEffect, useCallback } from 'react';

const WATCHLIST_KEY = 'market-watchlist';

export const useWatchlist = () => {
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(WATCHLIST_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
  }, [watchlist]);

  const addToWatchlist = useCallback((symbolId: string) => {
    setWatchlist(prev => {
      if (prev.includes(symbolId)) return prev;
      return [...prev, symbolId];
    });
  }, []);

  const removeFromWatchlist = useCallback((symbolId: string) => {
    setWatchlist(prev => prev.filter(id => id !== symbolId));
  }, []);

  const toggleWatchlist = useCallback((symbolId: string) => {
    setWatchlist(prev => {
      if (prev.includes(symbolId)) {
        return prev.filter(id => id !== symbolId);
      }
      return [...prev, symbolId];
    });
  }, []);

  const isInWatchlist = useCallback((symbolId: string) => {
    return watchlist.includes(symbolId);
  }, [watchlist]);

  return {
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist,
    isInWatchlist,
  };
};
