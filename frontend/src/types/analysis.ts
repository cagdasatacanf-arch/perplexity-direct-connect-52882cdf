
// Logic Check Details for UI explanation
interface LogicCheck {
    volume_multiplier?: number;
    rsi_slope_degrees?: number;
    penalties_applied: string[]; // e.g., ["RSI_SLOPE_LOW", "VOLUME_GATE_CAP"]
}

// Main Pattern Analysis Interface
export interface PatternAnalysis {
    symbol: string;
    pattern_type: 'BB_BREAK' | 'RSI_DIVERGENCE' | 'PRICE_ACTION' | 'CORRELATION' | 'GENERAL';
    summary: string;
    trend: 'bullish' | 'bearish' | 'neutral';
    confidence_score: number; // 0.0 - 1.0 (float)

    // Logic validation Details (New for v1.1)
    logic_check: LogicCheck;

    key_levels: {
        support: number[];
        resistance: number[];
    };

    signals: string[];
    recommendation: 'buy' | 'sell' | 'hold';

    // Metadata
    model_used: 'gemini-1.5-pro' | 'gemini-1.5-flash';
    created_at: string;
}

// Type for the API Response wrapper
export interface APIResponse<T> {
    data: T;
    error?: string;
    meta?: {
        timestamp: string;
        version: string;
    };
}
