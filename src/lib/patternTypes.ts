// API Types for Pattern Analysis (mirrors /functions/_shared/types.ts)

export interface PatternRequest {
  symbol: string;
  patterns: PatternType[];
  timeframe?: '1D' | '1W' | '1M' | '3M' | '1Y';
  sensitivity?: 'low' | 'medium' | 'high';
}

export type PatternType = 
  | 'head_and_shoulders'
  | 'double_top'
  | 'double_bottom'
  | 'triangle_ascending'
  | 'triangle_descending'
  | 'wedge_rising'
  | 'wedge_falling'
  | 'cup_and_handle'
  | 'flag'
  | 'pennant';

export interface PatternMatch {
  id: string;
  pattern: PatternType;
  symbol: string;
  confidence: number; // 0-100
  direction: 'bullish' | 'bearish' | 'neutral';
  priceTarget?: number;
  stopLoss?: number;
  evidence: PatternEvidence[];
  detectedAt: string;
  timeframe: string;
}

export interface PatternEvidence {
  type: 'price_point' | 'volume_spike' | 'trend_line' | 'support_resistance';
  description: string;
  value: number;
  timestamp: string;
}

export interface PatternAnalysisResponse {
  success: boolean;
  data: {
    symbol: string;
    patterns: PatternMatch[];
    summary: {
      totalPatterns: number;
      avgConfidence: number;
      dominantDirection: 'bullish' | 'bearish' | 'neutral';
    };
  };
  error?: string;
  timestamp: string;
}

// Helper to get pattern display name
export const patternDisplayNames: Record<PatternType, string> = {
  head_and_shoulders: 'Head & Shoulders',
  double_top: 'Double Top',
  double_bottom: 'Double Bottom',
  triangle_ascending: 'Ascending Triangle',
  triangle_descending: 'Descending Triangle',
  wedge_rising: 'Rising Wedge',
  wedge_falling: 'Falling Wedge',
  cup_and_handle: 'Cup & Handle',
  flag: 'Flag',
  pennant: 'Pennant',
};

// Helper to get direction colors
export const directionColors = {
  bullish: 'text-emerald-500',
  bearish: 'text-red-500',
  neutral: 'text-yellow-500',
};
