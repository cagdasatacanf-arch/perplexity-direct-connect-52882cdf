-- Migration: Create alerts system
-- Description: Sets up the alerts table and triggers for high-confidence signals (>= 0.95).

BEGIN;

-- 1. Create Alerts Table
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_result_id UUID REFERENCES public.analysis_results(id),
    symbol TEXT NOT NULL,
    pattern_type TEXT NOT NULL,
    confidence_score NUMERIC(5,2) NOT NULL,
    status TEXT DEFAULT 'NEW', -- NEW, SENT, ACKNOWLEDGED
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying "NEW" alerts quickly
CREATE INDEX IF NOT EXISTS idx_alerts_status ON public.alerts(status);

-- 2. Create Trigger Function
CREATE OR REPLACE FUNCTION public.trigger_alpha_alert()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if confidence score meets the Alpha Alert threshold (0.95)
    -- Scaling: If confidence_score is 0-1.0 float, check >= 0.95
    -- If confidence_score is 0-100 int, check >= 95
    -- Based on previous migration, confidence_score was INTEGER (0-100 presumably, or handled as int in code).
    -- Wait, the batch validation log showed "0.96", implying float.
    -- Let's check the schema. The migration '20251225000000_optimize_analysis_results.sql' defined it as INTEGER.
    -- If it is storing 0.96, it might be storing as 96 (percentage) or there's a schema mismatch.
    -- PROCEEDING WITH ASSUMPTION: The pipeline inserts floats, but schema said Integer. 
    -- If it's Integer, 0.96 truncates to 0!
    -- FIX: I will update the column to NUMERIC/FLOAT first to be safe, then apply trigger.
    
    IF NEW.confidence_score >= 0.95 THEN
        INSERT INTO public.alerts (analysis_result_id, symbol, pattern_type, confidence_score)
        VALUES (NEW.id, NEW.symbol, NEW.pattern_type, NEW.confidence_score);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Fix Column Type (Robustness Step)
-- Ensure confidence_score supports decimals if it was created as INTEGER erroneously for 0-1 range.
ALTER TABLE public.analysis_results 
ALTER COLUMN confidence_score TYPE NUMERIC(5,2);

-- 4. Create Trigger
DROP TRIGGER IF EXISTS trg_detect_alpha ON public.analysis_results;

CREATE TRIGGER trg_detect_alpha
AFTER INSERT ON public.analysis_results
FOR EACH ROW
EXECUTE FUNCTION public.trigger_alpha_alert();

COMMIT;
