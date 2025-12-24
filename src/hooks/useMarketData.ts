import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MarketSymbol {
  id: string;
  name: string;
  price: number;
  change: number;
  changePercent?: number;
  high?: number;
  low?: number;
  volume?: string;
  category: 'stock' | 'metal';
  unit?: string;
  lastUpdated?: string;
}

interface MarketDataResponse {
  success: boolean;
  data?: MarketSymbol[];
  error?: string;
  timestamp?: string;
}

const DEFAULT_SYMBOLS: MarketSymbol[] = [
  { id: 'AAPL', name: 'Apple Inc.', price: 178.50, change: 2.35, category: 'stock', unit: 'USD' },
  { id: 'GOOGL', name: 'Alphabet Inc.', price: 141.25, change: -0.85, category: 'stock', unit: 'USD' },
  { id: 'MSFT', name: 'Microsoft Corp.', price: 378.90, change: 4.20, category: 'stock', unit: 'USD' },
  { id: 'AMZN', name: 'Amazon.com Inc.', price: 178.25, change: 1.15, category: 'stock', unit: 'USD' },
  { id: 'TSLA', name: 'Tesla Inc.', price: 248.50, change: -3.25, category: 'stock', unit: 'USD' },
  { id: 'NVDA', name: 'NVIDIA Corp.', price: 875.30, change: 12.45, category: 'stock', unit: 'USD' },
  { id: 'XAU', name: 'Gold Spot', price: 2650.50, change: 8.75, category: 'metal', unit: 'USD/oz' },
  { id: 'XAG', name: 'Silver Spot', price: 31.45, change: 0.32, category: 'metal', unit: 'USD/oz' },
];

const SYMBOL_IDS = DEFAULT_SYMBOLS.map(s => s.id);
const REFRESH_INTERVAL = 60000; // 1 minute

export const useMarketData = () => {
  const [symbols, setSymbols] = useState<MarketSymbol[]>(DEFAULT_SYMBOLS);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchMarketData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke<MarketDataResponse>('market-data', {
        body: { symbols: SYMBOL_IDS },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.success && data.data && data.data.length > 0) {
        // Merge with defaults to preserve category info
        const updatedSymbols = DEFAULT_SYMBOLS.map(defaultSymbol => {
          const liveData = data.data?.find(
            d => d.id.toUpperCase() === defaultSymbol.id.toUpperCase()
          );
          if (liveData) {
            return {
              ...defaultSymbol,
              price: liveData.price || defaultSymbol.price,
              change: liveData.changePercent || liveData.change || defaultSymbol.change,
              changePercent: liveData.changePercent,
              high: liveData.high,
              low: liveData.low,
              volume: liveData.volume,
              unit: liveData.unit || defaultSymbol.unit,
              lastUpdated: liveData.lastUpdated,
            };
          }
          return defaultSymbol;
        });

        setSymbols(updatedSymbols);
        setLastUpdated(new Date());
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch market data';
      setError(message);
      console.error('Market data fetch error:', message);
      // Keep using existing data on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    fetchMarketData();
    toast.info('Refreshing market data...');
  }, [fetchMarketData]);

  // Initial fetch
  useEffect(() => {
    fetchMarketData();
  }, [fetchMarketData]);

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(fetchMarketData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchMarketData]);

  return {
    symbols,
    isLoading,
    lastUpdated,
    error,
    refresh,
  };
};
