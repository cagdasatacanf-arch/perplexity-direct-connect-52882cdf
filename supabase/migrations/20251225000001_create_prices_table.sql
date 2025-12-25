-- Migration: Create prices table
-- Description: Stores historical market data (OHLCV) for symbols.

BEGIN;

CREATE TABLE IF NOT EXISTS public.prices (
    symbol TEXT NOT NULL,
    date DATE NOT NULL,
    open NUMERIC(18, 4),
    high NUMERIC(18, 4),
    low NUMERIC(18, 4),
    close NUMERIC(18, 4),
    volume BIGINT,
    
    PRIMARY KEY (symbol, date)
);

CREATE INDEX IF NOT EXISTS idx_prices_symbol_date ON public.prices(symbol, date DESC);

COMMIT;
