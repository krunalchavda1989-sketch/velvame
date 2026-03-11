
-- Create a SECURITY DEFINER function to atomically deduct wallet balance
-- This prevents the silent RLS failure and ensures atomic balance check + deduction
CREATE OR REPLACE FUNCTION public.deduct_wallet_balance(_user_id uuid, _amount numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_balance numeric;
  _new_balance numeric;
BEGIN
  -- Lock the row to prevent race conditions
  SELECT balance INTO _current_balance
  FROM public.wallets
  WHERE user_id = _user_id
  FOR UPDATE;

  IF _current_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;

  IF _current_balance < _amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  _new_balance := _current_balance - _amount;

  UPDATE public.wallets
  SET balance = _new_balance,
      total_withdrawn = total_withdrawn + _amount,
      updated_at = now()
  WHERE user_id = _user_id;

  RETURN jsonb_build_object('success', true, 'new_balance', _new_balance);
END;
$$;
