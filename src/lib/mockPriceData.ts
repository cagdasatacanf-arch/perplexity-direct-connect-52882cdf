// Mock price data for chart visualization

export interface PricePoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PatternOverlay {
  startIndex: number;
  endIndex: number;
  type: string;
  direction: 'bullish' | 'bearish' | 'neutral';
  keyPoints: { index: number; label: string; price: number }[];
}

// Generate mock price data for a symbol
export const generateMockPriceData = (symbol: string, days: number = 30): PricePoint[] => {
  const basePrice = symbol === 'AAPL' ? 175 : symbol === 'TSLA' ? 245 : symbol === 'GOLD' ? 2000 : 150;
  const volatility = symbol === 'TSLA' ? 0.03 : symbol === 'GOLD' ? 0.01 : 0.02;
  
  const data: PricePoint[] = [];
  let currentPrice = basePrice;
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    const change = (Math.random() - 0.5) * 2 * volatility * currentPrice;
    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) + Math.random() * volatility * currentPrice * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * currentPrice * 0.5;
    
    data.push({
      date: date.toISOString().split('T')[0],
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: Math.floor(Math.random() * 50000000) + 10000000,
    });
    
    currentPrice = close;
  }
  
  return data;
};

// Pattern overlays for mock data
export const mockPatternOverlays: Record<string, PatternOverlay[]> = {
  AAPL: [
    {
      startIndex: 5,
      endIndex: 20,
      type: 'cup_and_handle',
      direction: 'bullish',
      keyPoints: [
        { index: 5, label: 'Cup Start', price: 172 },
        { index: 12, label: 'Cup Low', price: 168 },
        { index: 18, label: 'Handle', price: 176 },
        { index: 20, label: 'Breakout', price: 180 },
      ],
    },
    {
      startIndex: 22,
      endIndex: 28,
      type: 'flag',
      direction: 'bullish',
      keyPoints: [
        { index: 22, label: 'Flag Start', price: 182 },
        { index: 28, label: 'Flag End', price: 185 },
      ],
    },
  ],
  TSLA: [
    {
      startIndex: 3,
      endIndex: 25,
      type: 'head_and_shoulders',
      direction: 'bearish',
      keyPoints: [
        { index: 5, label: 'Left Shoulder', price: 245 },
        { index: 12, label: 'Head', price: 262 },
        { index: 20, label: 'Right Shoulder', price: 248 },
        { index: 25, label: 'Neckline Break', price: 235 },
      ],
    },
  ],
  GOLD: [
    {
      startIndex: 8,
      endIndex: 26,
      type: 'triangle_ascending',
      direction: 'bullish',
      keyPoints: [
        { index: 8, label: 'Support 1', price: 1985 },
        { index: 15, label: 'Resistance', price: 2050 },
        { index: 20, label: 'Support 2', price: 2010 },
        { index: 26, label: 'Apex', price: 2045 },
      ],
    },
  ],
};
