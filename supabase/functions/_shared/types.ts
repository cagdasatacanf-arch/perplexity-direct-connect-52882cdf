export interface AnalysisData {
    summary: string;
    trend: 'bullish' | 'bearish' | 'neutral';
    key_levels: {
        support: number[];
        resistance: number[];
    };
    signals: string[];
    recommendation: 'buy' | 'sell' | 'hold';
    confidence_score: number;
}

export interface GeminiAnalysisResponse {
    symbol: string;
    analysis: AnalysisData;
    model_used: 'gemini-1.5-pro' | 'gemini-1.5-flash';
    created_at?: string;
}

export interface BatchJobStatus {
    job_id: string;
    state: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';
    created_at: string;
    completed_at?: string;
    output_file?: string;
    error?: string;
}

export interface APIError {
    error: string;
    code?: string;
    details?: any;
}

export type AnalysisPatternType = 'BB_BREAK' | 'RSI_DIVERGENCE' | 'MACD_CROSS' | 'VOLUME_SPIKE' | 'GENERAL';

export interface AnalysisRequest {
    symbol: string;
    data: any;
    analysis_type: AnalysisPatternType;
}
