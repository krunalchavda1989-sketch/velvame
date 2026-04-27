-- Track future commission reprocess / reversal / correction runs
CREATE TABLE public.commission_reprocess_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_label TEXT NOT NULL DEFAULT 'Commission Reprocess',
  reason TEXT NOT NULL DEFAULT '',
  triggered_by UUID,
  scope TEXT NOT NULL DEFAULT 'global',
  affected_user_id UUID,
  total_users_affected INTEGER NOT NULL DEFAULT 0,
  total_credits NUMERIC NOT NULL DEFAULT 0,
  total_debits NUMERIC NOT NULL DEFAULT 0,
  net_change NUMERIC NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.commission_reprocess_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage reprocess runs"
ON public.commission_reprocess_runs
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view runs that affected them"
ON public.commission_reprocess_runs
FOR SELECT
TO authenticated
USING (affected_user_id = auth.uid() OR scope = 'global');

CREATE INDEX idx_reprocess_runs_started ON public.commission_reprocess_runs(started_at DESC);
CREATE INDEX idx_reprocess_runs_user ON public.commission_reprocess_runs(affected_user_id);

-- Helper: derive historical reprocess "runs" by clustering reversal/correction wallet rows by 1-minute buckets
CREATE OR REPLACE FUNCTION public.get_derived_reprocess_runs(_user_id UUID DEFAULT NULL)
RETURNS TABLE(
  bucket_start TIMESTAMPTZ,
  bucket_end TIMESTAMPTZ,
  run_label TEXT,
  affected_users INTEGER,
  total_credits NUMERIC,
  total_debits NUMERIC,
  net_change NUMERIC,
  row_count INTEGER
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH base AS (
    SELECT
      date_trunc('minute', created_at) AS bucket,
      user_id,
      type,
      amount,
      description,
      CASE
        WHEN description ILIKE '%reversal%' THEN 'Commission Reversal'
        WHEN description ILIKE '%correction%' THEN 'Commission Correction'
        WHEN description ILIKE '%audit%' THEN 'Commission Audit'
        ELSE 'Commission Adjustment'
      END AS label
    FROM public.wallet_transactions
    WHERE balance_type = 'commission'
      AND (
        description ILIKE '%reversal%'
        OR description ILIKE '%correction%'
        OR description ILIKE '%audit%'
        OR description ILIKE '%reprocess%'
      )
      AND (_user_id IS NULL OR user_id = _user_id)
  )
  SELECT
    bucket AS bucket_start,
    bucket + INTERVAL '1 minute' AS bucket_end,
    MIN(label) AS run_label,
    COUNT(DISTINCT user_id)::INT AS affected_users,
    COALESCE(SUM(CASE WHEN type='credit' THEN amount END),0) AS total_credits,
    COALESCE(SUM(CASE WHEN type='debit' THEN amount END),0) AS total_debits,
    COALESCE(SUM(CASE WHEN type='credit' THEN amount END),0)
      - COALESCE(SUM(CASE WHEN type='debit' THEN amount END),0) AS net_change,
    COUNT(*)::INT AS row_count
  FROM base
  GROUP BY bucket
  ORDER BY bucket DESC;
$$;