-- Migration: Create Analysis Results Table
CREATE TABLE IF NOT EXISTS analysis_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol TEXT NOT NULL,
    pattern_type TEXT NOT NULL, -- e.g., 'RSI Divergence', 'BB Break'
    confidence NUMERIC(3, 2) CHECK (confidence >= 0 AND confidence <= 1),
    description TEXT,
    evidence JSONB, -- Stores triggers like: {"price": 52000, "indicator": "RSI 85"}
    gemini_model TEXT NOT NULL, -- 'gemini-1.5-pro' or 'gemini-1.5-flash'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_analysis_symbol ON analysis_results(symbol);
