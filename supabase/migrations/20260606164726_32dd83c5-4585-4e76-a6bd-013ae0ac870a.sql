
-- 1) RPC to atomically record a payout AND debit wallet + create ledger entry + mark commissions paid
CREATE OR REPLACE FUNCTION public.admin_record_payout(
  _user_id uuid,
  _amount numeric,
  _payment_mode text,
  _transaction_ref text,
  _payment_date date,
  _admin_id uuid,
  _note text DEFAULT ''
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _comm_balance numeric;
  _sub_balance numeric;
  _debit_from_comm numeric;
  _new_comm numeric;
  _new_balance numeric;
  _payout_id uuid;
BEGIN
  IF _amount IS NULL OR _amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid amount');
  END IF;

  -- Lock wallet row
  SELECT subscription_balance, commission_balance
    INTO _sub_balance, _comm_balance
  FROM public.wallets
  WHERE user_id = _user_id
  FOR UPDATE;

  IF _comm_balance IS NULL THEN
    -- Auto-create wallet if missing
    INSERT INTO public.wallets (user_id) VALUES (_user_id);
    _sub_balance := 0; _comm_balance := 0;
  END IF;

  -- Debit commission_balance up to available; remainder is tracked but not deducted (historical drift)
  _debit_from_comm := LEAST(_comm_balance, _amount);
  _new_comm := _comm_balance - _debit_from_comm;
  _new_balance := COALESCE(_sub_balance, 0) + _new_comm;

  -- Insert payout transaction
  INSERT INTO public.payout_transactions
    (user_id, amount, payment_mode, transaction_ref, payment_date, paid_by_admin_id, note, status)
  VALUES
    (_user_id, _amount, _payment_mode, _transaction_ref, _payment_date, _admin_id, COALESCE(_note,''), 'paid')
  RETURNING id INTO _payout_id;

  -- Update wallet
  UPDATE public.wallets
  SET balance = _new_balance,
      commission_balance = _new_comm,
      total_withdrawn = COALESCE(total_withdrawn, 0) + _amount,
      updated_at = now()
  WHERE user_id = _user_id;

  -- Insert ledger debit
  INSERT INTO public.wallet_transactions
    (user_id, type, amount, description, closing_balance, balance_type)
  VALUES
    (_user_id, 'debit', _amount, 'Payout (Ref: ' || COALESCE(_transaction_ref, '') || ')', _new_balance, 'commission');

  -- Mark pending commissions as paid (FIFO) up to amount
  WITH ranked AS (
    SELECT id, amount,
           SUM(amount) OVER (ORDER BY created_at ASC, id ASC) AS running
    FROM public.commissions
    WHERE beneficiary_id = _user_id AND status = 'pending'
  )
  UPDATE public.commissions c
  SET status = 'paid'
  FROM ranked r
  WHERE c.id = r.id
    AND r.running - r.amount < _amount;

  RETURN jsonb_build_object('success', true, 'payout_id', _payout_id, 'new_commission_balance', _new_comm);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_record_payout(uuid, numeric, text, text, date, uuid, text) TO authenticated, service_role;


-- 2) One-time reconciliation: align wallets + ledger with historical payouts
DO $reconcile$
DECLARE
  r RECORD;
  _credits numeric;
  _debits numeric;
  _payouts numeric;
  _missing_payouts RECORD;
  _new_balance numeric;
BEGIN
  FOR r IN SELECT user_id FROM public.wallets LOOP

    -- Sum existing ledger credits/debits (commission)
    SELECT COALESCE(SUM(CASE WHEN type='credit' THEN amount END), 0),
           COALESCE(SUM(CASE WHEN type='debit'  THEN amount END), 0)
      INTO _credits, _debits
    FROM public.wallet_transactions
    WHERE user_id = r.user_id AND balance_type = 'commission';

    -- Sum payouts
    SELECT COALESCE(SUM(amount), 0) INTO _payouts
    FROM public.payout_transactions
    WHERE user_id = r.user_id;

    -- For each payout that has no matching ledger debit row, insert one
    FOR _missing_payouts IN
      SELECT pt.id, pt.amount, pt.transaction_ref, pt.payment_date
      FROM public.payout_transactions pt
      WHERE pt.user_id = r.user_id
        AND NOT EXISTS (
          SELECT 1 FROM public.wallet_transactions wt
          WHERE wt.user_id = r.user_id
            AND wt.balance_type = 'commission'
            AND wt.type = 'debit'
            AND wt.description = 'Payout (Ref: ' || COALESCE(pt.transaction_ref, '') || ')'
        )
    LOOP
      INSERT INTO public.wallet_transactions
        (user_id, type, amount, description, closing_balance, balance_type, created_at)
      VALUES
        (r.user_id, 'debit', _missing_payouts.amount,
         'Payout (Ref: ' || COALESCE(_missing_payouts.transaction_ref, '') || ')',
         0, 'commission',
         COALESCE(_missing_payouts.payment_date::timestamptz, now()));
      _debits := _debits + _missing_payouts.amount;
    END LOOP;

    -- Recompute wallet balances
    _new_balance := GREATEST(0, _credits - _debits);

    UPDATE public.wallets
    SET commission_balance = _new_balance,
        total_withdrawn = _payouts,
        balance = COALESCE(subscription_balance, 0) + _new_balance,
        updated_at = now()
    WHERE user_id = r.user_id;
  END LOOP;
END;
$reconcile$;
