# Production Deployment Runbook (P3)

**System:** Gemini Analysis Pipeline & Auto-Alert System  
**Version:** 1.0 (MVP)

## 1. Pre-Flight Checks
- [ ] **Environment Variables**: Ensure `GEMINI_API_KEY`, `POSTGRES_URL` (and related DB vars), and `SUPABASE_SERVICE_KEY` are set in the production environment (e.g., Vercel, Railway, or Supabase Secrets).
- [ ] **Database Connectivity**: Verify production DB is reachable from the batch execution environment.
- [ ] **Data Source**: Confirm `prices` table has up-to-date OHLCV data for the target symbols.

## 2. Database Migration Deployment
Run the SQL migrations in order against the production Supabase project:
1. `20251225000000_optimize_analysis_results.sql` (Tables & Indexes)
2. `20251225000001_create_prices_table.sql` (Prices Schema)
3. `20251225000002_create_alerts_trigger.sql` (Auto-Alert System)

*Command (using Supabase CLI):*
```bash
supabase db push
```

## 3. Edge Function Deployment
Deploy the `gemini-analyze` function for real-time analysis requests.

*Command:*
```bash
supabase functions deploy gemini-analyze --no-verify-jwt
```
*(Remove `--no-verify-jwt` if auth is required)*

## 4. Batch Pipeline Execution (Daily Schedule)
This script should be run via a scheduled task (CRON) or orchestrated workflow (GitHub Actions / Airflow).

*Command:*
```bash
python scripts/batch_analysis.py
```
*Verify:* Check logs for "Serialization successful" and "Job created".

## 5. Validation
1. **Check Alerts**: Query `SELECT * FROM alerts WHERE created_at > NOW() - INTERVAL '1 hour'` to see if any high-confidence signals were generated.
2. **Frontend check**: Load the Lovable UI and ensure `logic_check` fields (Volume Multiplier, Slope) are visible on cards.

## 6. Rollback Plan
If critical failure occurs:
1. **Disable Triggers**: `ALTER TABLE analysis_results DISABLE TRIGGER trg_detect_alpha;`
2. **Revert Edge Function**: `supabase functions deploy gemini-analyze-v-prev` (if versioned) or redeploy previous commit.
