CREATE TABLE IF NOT EXISTS public.wallet_reconciliation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at timestamptz NOT NULL DEFAULT now(),
  triggered_by text NOT NULL DEFAULT 'cron',
  users_checked integer NOT NULL DEFAULT 0,
  users_corrected integer NOT NULL DEFAULT 0,
  net_adjustment numeric NOT NULL DEFAULT 0,
  details jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.wallet_reconciliation_runs TO authenticated;
GRANT ALL ON public.wallet_reconciliation_runs TO service_role;

ALTER TABLE public.wallet_reconciliation_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view reconciliation runs" ON public.wallet_reconciliation_runs;
CREATE POLICY "Admins can view reconciliation runs"
  ON public.wallet_reconciliation_runs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.reconcile_commission_wallets(_triggered_by text DEFAULT 'cron')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  r RECORD;
  _checked integer := 0;
  _corrected integer := 0;
  _net numeric := 0;
  _details jsonb := '[]'::jsonb;
  _new_comm numeric;
  _new_balance numeric;
  _diff numeric;
BEGIN
  FOR r IN
    WITH led AS (
      SELECT user_id,
        SUM(CASE WHEN type='debit' AND description ~* 'payout|withdraw'
                 AND description !~* 'Reversal|Correction|Reprocess' THEN amount ELSE 0 END) AS mirror,
        SUM(CASE WHEN type='debit'
                 AND description !~* 'Reversal|Correction|Reprocess|payout|withdraw' THEN amount ELSE 0 END) AS used
      FROM public.wallet_transactions
      WHERE balance_type = 'commission'
      GROUP BY user_id
    ),
    pay AS (SELECT user_id, SUM(amount) AS total FROM public.payout_transactions GROUP BY user_id),
    com AS (SELECT beneficiary_id AS user_id, SUM(amount) AS total FROM public.commissions GROUP BY beneficiary_id)
    SELECT w.user_id,
           w.subscription_balance,
           w.commission_balance,
           GREATEST(0,
             COALESCE(com.total,0)
             - (GREATEST(COALESCE(pay.total,0), COALESCE(led.mirror,0)) + COALESCE(led.used,0))
           ) AS expected
    FROM public.wallets w
    LEFT JOIN led ON led.user_id = w.user_id
    LEFT JOIN pay ON pay.user_id = w.user_id
    LEFT JOIN com ON com.user_id = w.user_id
  LOOP
    _checked := _checked + 1;
    _diff := ROUND(r.expected - COALESCE(r.commission_balance, 0), 2);

    IF ABS(_diff) > 0.01 THEN
      _new_comm := ROUND(r.expected, 2);
      _new_balance := COALESCE(r.subscription_balance, 0) + _new_comm;

      UPDATE public.wallets
      SET commission_balance = _new_comm,
          balance = _new_balance,
          updated_at = now()
      WHERE user_id = r.user_id;

      INSERT INTO public.wallet_transactions
        (user_id, type, amount, description, closing_balance, balance_type)
      VALUES
        (r.user_id,
         CASE WHEN _diff > 0 THEN 'credit' ELSE 'debit' END,
         ABS(_diff),
         'Balance Correction (Auto Reconciliation)',
         _new_balance,
         'commission');

      _corrected := _corrected + 1;
      _net := _net + _diff;
      _details := _details || jsonb_build_object(
        'user_id', r.user_id,
        'previous', r.commission_balance,
        'corrected_to', _new_comm,
        'difference', _diff
      );
    END IF;
  END LOOP;

  INSERT INTO public.wallet_reconciliation_runs
    (triggered_by, users_checked, users_corrected, net_adjustment, details)
  VALUES (COALESCE(_triggered_by,'cron'), _checked, _corrected, _net, _details);

  RETURN jsonb_build_object(
    'success', true,
    'users_checked', _checked,
    'users_corrected', _corrected,
    'net_adjustment', _net
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.reconcile_commission_wallets(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reconcile_commission_wallets(text) TO service_role;

CREATE OR REPLACE FUNCTION public.admin_reconcile_commission_wallets()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  RETURN public.reconcile_commission_wallets('admin');
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_reconcile_commission_wallets() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_reconcile_commission_wallets() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reconcile_commission_wallets() TO service_role;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('nightly-wallet-reconciliation')
    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'nightly-wallet-reconciliation');

    PERFORM cron.schedule(
      'nightly-wallet-reconciliation',
      '30 0 * * *',
      $cron$SELECT public.reconcile_commission_wallets('cron');$cron$
    );
  END IF;
END
$$;