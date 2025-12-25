// Sample JSON responses for UI testing (from Gemini Specialist)
import { PatternAnalysisResponse, PatternMatch } from './patternTypes';

export const mockPatternResponses: Record<string, PatternAnalysisResponse> = {
  AAPL: {
    success: true,
    data: {
      symbol: 'AAPL',
      patterns: [
        {
          id: 'p1',
          pattern: 'cup_and_handle',
          symbol: 'AAPL',
          confidence: 87,
          direction: 'bullish',
          priceTarget: 195.50,
          stopLoss: 165.00,
          evidence: [
            { type: 'price_point', description: 'Cup formation low at $168.22', value: 168.22, timestamp: '2024-01-10T14:30:00Z' },
            { type: 'volume_spike', description: 'Handle breakout with 2.3x avg volume', value: 2.3, timestamp: '2024-01-18T10:00:00Z' },
            { type: 'trend_line', description: 'Resistance at $185 broken', value: 185, timestamp: '2024-01-19T15:00:00Z' },
          ],
          detectedAt: '2024-01-20T09:30:00Z',
          timeframe: '1M',
        },
        {
          id: 'p2',
          pattern: 'flag',
          symbol: 'AAPL',
          confidence: 72,
          direction: 'bullish',
          priceTarget: 190.00,
          stopLoss: 175.00,
          evidence: [
            { type: 'trend_line', description: 'Parallel channel forming after rally', value: 0, timestamp: '2024-01-15T09:30:00Z' },
            { type: 'volume_spike', description: 'Decreasing volume during consolidation', value: 0.6, timestamp: '2024-01-17T16:00:00Z' },
          ],
          detectedAt: '2024-01-20T09:30:00Z',
          timeframe: '1W',
        },
      ],
      summary: {
        totalPatterns: 2,
        avgConfidence: 79.5,
        dominantDirection: 'bullish',
      },
    },
    timestamp: '2024-01-20T09:30:00Z',
  },
  TSLA: {
    success: true,
    data: {
      symbol: 'TSLA',
      patterns: [
        {
          id: 'p3',
          pattern: 'head_and_shoulders',
          symbol: 'TSLA',
          confidence: 91,
          direction: 'bearish',
          priceTarget: 210.00,
          stopLoss: 265.00,
          evidence: [
            { type: 'price_point', description: 'Left shoulder at $245', value: 245, timestamp: '2024-01-05T14:00:00Z' },
            { type: 'price_point', description: 'Head peak at $262', value: 262, timestamp: '2024-01-12T11:00:00Z' },
            { type: 'price_point', description: 'Right shoulder at $248', value: 248, timestamp: '2024-01-18T10:30:00Z' },
            { type: 'support_resistance', description: 'Neckline at $235', value: 235, timestamp: '2024-01-19T15:00:00Z' },
          ],
          detectedAt: '2024-01-20T09:30:00Z',
          timeframe: '1M',
        },
      ],
      summary: {
        totalPatterns: 1,
        avgConfidence: 91,
        dominantDirection: 'bearish',
      },
    },
    timestamp: '2024-01-20T09:30:00Z',
  },
  GOLD: {
    success: true,
    data: {
      symbol: 'GOLD',
      patterns: [
        {
          id: 'p4',
          pattern: 'triangle_ascending',
          symbol: 'GOLD',
          confidence: 78,
          direction: 'bullish',
          priceTarget: 2100.00,
          stopLoss: 1980.00,
          evidence: [
            { type: 'trend_line', description: 'Higher lows forming upward trendline', value: 0, timestamp: '2024-01-08T09:00:00Z' },
            { type: 'support_resistance', description: 'Horizontal resistance at $2050', value: 2050, timestamp: '2024-01-15T14:00:00Z' },
            { type: 'volume_spike', description: 'Volume increasing on tests of resistance', value: 1.8, timestamp: '2024-01-19T10:00:00Z' },
          ],
          detectedAt: '2024-01-20T09:30:00Z',
          timeframe: '1W',
        },
        {
          id: 'p5',
          pattern: 'double_bottom',
          symbol: 'GOLD',
          confidence: 65,
          direction: 'bullish',
          priceTarget: 2080.00,
          evidence: [
            { type: 'price_point', description: 'First bottom at $1985', value: 1985, timestamp: '2024-01-03T10:00:00Z' },
            { type: 'price_point', description: 'Second bottom at $1988', value: 1988, timestamp: '2024-01-16T11:00:00Z' },
          ],
          detectedAt: '2024-01-20T09:30:00Z',
          timeframe: '1M',
        },
      ],
      summary: {
        totalPatterns: 2,
        avgConfidence: 71.5,
        dominantDirection: 'bullish',
      },
    },
    timestamp: '2024-01-20T09:30:00Z',
  },
};

// Mock error response for testing
export const mockErrorResponse: PatternAnalysisResponse = {
  success: false,
  data: {
    symbol: '',
    patterns: [],
    summary: {
      totalPatterns: 0,
      avgConfidence: 0,
      dominantDirection: 'neutral',
    },
  },
  error: 'Failed to analyze patterns. Please try again.',
  timestamp: new Date().toISOString(),
};

// Available symbols for dropdown
export const availableSymbols = [
  { id: 'AAPL', name: 'Apple Inc.' },
  { id: 'GOOGL', name: 'Alphabet Inc.' },
  { id: 'MSFT', name: 'Microsoft Corp.' },
  { id: 'AMZN', name: 'Amazon.com Inc.' },
  { id: 'TSLA', name: 'Tesla Inc.' },
  { id: 'NVDA', name: 'NVIDIA Corp.' },
  { id: 'GOLD', name: 'Gold Futures' },
  { id: 'SILVER', name: 'Silver Futures' },
  { id: 'OIL', name: 'Crude Oil WTI' },
];
