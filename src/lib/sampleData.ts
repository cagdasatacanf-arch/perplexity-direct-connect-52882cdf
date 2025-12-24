// Sample data for the dashboard
export interface SymbolData {
  id: string;
  name: string;
  price: number;
  change: number;
  category: 'stock' | 'metal';
}

export interface OHLCData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export const sampleSymbols: SymbolData[] = [
  { id: 'AAPL', name: 'Apple Inc.', price: 178.72, change: 2.34, category: 'stock' },
  { id: 'GOOGL', name: 'Alphabet Inc.', price: 141.80, change: -0.52, category: 'stock' },
  { id: 'MSFT', name: 'Microsoft Corp.', price: 378.91, change: 1.23, category: 'stock' },
  { id: 'AMZN', name: 'Amazon.com', price: 178.25, change: 0.87, category: 'stock' },
  { id: 'TSLA', name: 'Tesla Inc.', price: 248.50, change: -1.45, category: 'stock' },
  { id: 'GOLD', name: 'Gold Futures', price: 2024.30, change: 0.42, category: 'metal' },
  { id: 'SILVER', name: 'Silver Futures', price: 23.45, change: -0.18, category: 'metal' },
  { id: 'PLAT', name: 'Platinum Futures', price: 912.60, change: 1.05, category: 'metal' },
];

// Generate sample OHLC data
export const generateOHLCData = (basePrice: number, days: number = 90): OHLCData[] => {
  const data: OHLCData[] = [];
  let price = basePrice;
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const volatility = 0.02;
    const change = (Math.random() - 0.5) * 2 * volatility;
    const open = price;
    const close = price * (1 + change);
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    const volume = Math.floor(Math.random() * 50000000) + 10000000;

    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
    });

    price = close;
  }

  return data;
};

// Calculate statistics from OHLC data
export const calculateStats = (data: OHLCData[]) => {
  if (data.length === 0) {
    return { min: 0, max: 0, avg: 0, volume: 0, volatility: 0, change: 0 };
  }

  const closes = data.map(d => d.close);
  const lows = data.map(d => d.low);
  const highs = data.map(d => d.high);
  const volumes = data.map(d => d.volume);

  const min = Math.min(...lows);
  const max = Math.max(...highs);
  const avg = closes.reduce((a, b) => a + b, 0) / closes.length;
  const volume = volumes.reduce((a, b) => a + b, 0);

  // Calculate volatility (standard deviation of daily returns)
  const returns = closes.slice(1).map((close, i) => (close - closes[i]) / closes[i]);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance) * Math.sqrt(252) * 100; // Annualized

  // Calculate change
  const firstClose = closes[0];
  const lastClose = closes[closes.length - 1];
  const change = ((lastClose - firstClose) / firstClose) * 100;

  return { min, max, avg, volume, volatility, change };
};

// Filter data by period
export const filterByPeriod = (data: OHLCData[], period: string): OHLCData[] => {
  const now = new Date();
  let daysToShow = data.length;

  switch (period) {
    case '1D': daysToShow = 1; break;
    case '1W': daysToShow = 7; break;
    case '1M': daysToShow = 30; break;
    case '3M': daysToShow = 90; break;
    case '6M': daysToShow = 180; break;
    case '1Y': daysToShow = 365; break;
    case '5Y': daysToShow = 365 * 5; break;
    case 'MAX': daysToShow = data.length; break;
  }

  return data.slice(-Math.min(daysToShow, data.length));
};

// Calculate Pearson correlation coefficient between two arrays
export const calculateCorrelation = (arr1: number[], arr2: number[]): number => {
  if (arr1.length !== arr2.length || arr1.length < 2) return 0;
  
  const n = arr1.length;
  const mean1 = arr1.reduce((a, b) => a + b, 0) / n;
  const mean2 = arr2.reduce((a, b) => a + b, 0) / n;
  
  let numerator = 0;
  let sum1Sq = 0;
  let sum2Sq = 0;
  
  for (let i = 0; i < n; i++) {
    const diff1 = arr1[i] - mean1;
    const diff2 = arr2[i] - mean2;
    numerator += diff1 * diff2;
    sum1Sq += diff1 * diff1;
    sum2Sq += diff2 * diff2;
  }
  
  const denominator = Math.sqrt(sum1Sq * sum2Sq);
  if (denominator === 0) return 0;
  
  return numerator / denominator;
};

// Calculate daily returns from OHLC data
export const calculateReturns = (data: OHLCData[]): number[] => {
  const returns: number[] = [];
  for (let i = 1; i < data.length; i++) {
    const dailyReturn = (data[i].close - data[i - 1].close) / data[i - 1].close;
    returns.push(dailyReturn);
  }
  return returns;
};

// Generate seeded OHLC data for consistent correlations
export const generateSeededOHLCData = (
  basePrice: number, 
  days: number = 90,
  seed: number = 0,
  marketFactor: number[] = []
): OHLCData[] => {
  const data: OHLCData[] = [];
  let price = basePrice;
  const now = new Date();

  // Simple seeded random function
  const seededRandom = (s: number) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const volatility = 0.02;
    let change = (seededRandom(seed + i) - 0.5) * 2 * volatility;
    
    // Add market factor influence if provided
    if (marketFactor.length > 0 && i < marketFactor.length) {
      const marketInfluence = marketFactor[days - i] || 0;
      change = change * 0.4 + marketInfluence * 0.6; // 60% market influence
    }
    
    const open = price;
    const close = price * (1 + change);
    const high = Math.max(open, close) * (1 + seededRandom(seed + i + 1000) * 0.01);
    const low = Math.min(open, close) * (1 - seededRandom(seed + i + 2000) * 0.01);
    const volume = Math.floor(seededRandom(seed + i + 3000) * 50000000) + 10000000;

    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
    });

    price = close;
  }

  return data;
};
