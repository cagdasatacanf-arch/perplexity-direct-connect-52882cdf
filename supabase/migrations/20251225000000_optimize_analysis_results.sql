-- Migration: Optimize analysis_results table
-- Description: Adds indexes for high-volume writes and low-latency queries.
--              Adds UNIQUE constraint to prevent duplicate analysis for same symbol/pattern/time.

BEGIN;

-- 1. Ensure table exists (if not created by standard schema yet)
CREATE TABLE IF NOT EXISTS public.analysis_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol TEXT NOT NULL,
    pattern_type TEXT NOT NULL,
    analysis_data JSONB NOT NULL,
    confidence_score INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Add Unique Constraint
-- Ensures consistent data: One specific pattern analysis per symbol at a specific time is enough.
-- Useful for upsert operations during batch processing.
ALTER TABLE public.analysis_results 
ADD CONSTRAINT unique_symbol_pattern_time 
UNIQUE (symbol, pattern_type, created_at);

-- 3. Add Indexes for Performance

-- Index for querying by symbol + time (Most common query: "Get latest analysis for AAPL")
CREATE INDEX IF NOT EXISTS idx_results_symbol_created 
ON public.analysis_results (symbol, created_at DESC);

-- Index for filtering high-confidence results (e.g., "Show me all high confidence signals")
CREATE INDEX IF NOT EXISTS idx_results_confidence 
ON public.analysis_results (confidence_score DESC);

-- Index for filtering by pattern type (e.g., "Show all Bollinger Band breaks")
CREATE INDEX IF NOT EXISTS idx_results_pattern 
ON public.analysis_results (pattern_type);

COMMIT;

-- Verification (Comments for manual run)
-- EXPLAIN ANALYZE SELECT * FROM analysis_results WHERE symbol = 'AAPL' ORDER BY created_at DESC LIMIT 1;
-- Should use idx_results_symbol_created
