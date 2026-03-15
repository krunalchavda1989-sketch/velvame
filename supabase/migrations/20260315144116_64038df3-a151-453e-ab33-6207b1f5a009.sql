
-- Step 1: Add subscription_balance and commission_balance to wallets table
ALTER TABLE public.wallets
  ADD COLUMN IF NOT EXISTS subscription_balance numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_balance numeric NOT NULL DEFAULT 0;

-- Step 2: Add balance_type to wallet_transactions table
ALTER TABLE public.wallet_transactions
  ADD COLUMN IF NOT EXISTS balance_type text NOT NULL DEFAULT 'commission';

-- Step 3: Initialize existing balances - set commission_balance = balance (existing balance is commission)
UPDATE public.wallets SET commission_balance = balance WHERE commission_balance = 0 AND balance > 0;

-- Step 4: Replace deduct_wallet_balance to support balance segregation
CREATE OR REPLACE FUNCTION public.deduct_wallet_balance(_user_id uuid, _amount numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _sub_balance numeric;
  _comm_balance numeric;
  _sub_deduct numeric;
  _comm_deduct numeric;
  _new_sub numeric;
  _new_comm numeric;
  _new_balance numeric;
BEGIN
  SELECT subscription_balance, commission_balance INTO _sub_balance, _comm_balance
  FROM public.wallets
  WHERE user_id = _user_id
  FOR UPDATE;

  IF _sub_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;

  IF (_sub_balance + _comm_balance) < _amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  -- Deduct from subscription first, then commission
  _sub_deduct := LEAST(_sub_balance, _amount);
  _comm_deduct := _amount - _sub_deduct;

  _new_sub := _sub_balance - _sub_deduct;
  _new_comm := _comm_balance - _comm_deduct;
  _new_balance := _new_sub + _new_comm;

  UPDATE public.wallets
  SET balance = _new_balance,
      subscription_balance = _new_sub,
      commission_balance = _new_comm,
      total_withdrawn = total_withdrawn + _amount,
      updated_at = now()
  WHERE user_id = _user_id;

  -- Log subscription deduction
  IF _sub_deduct > 0 THEN
    INSERT INTO public.wallet_transactions (user_id, type, amount, description, closing_balance, balance_type)
    VALUES (_user_id, 'debit', _sub_deduct, 'Order Payment (Subscription Balance)', _new_sub + _new_comm, 'subscription');
  END IF;

  -- Log commission deduction
  IF _comm_deduct > 0 THEN
    INSERT INTO public.wallet_transactions (user_id, type, amount, description, closing_balance, balance_type)
    VALUES (_user_id, 'debit', _comm_deduct, 'Order Payment (Commission Balance)', _new_sub + _new_comm, 'commission');
  END IF;

  RETURN jsonb_build_object('success', true, 'new_balance', _new_balance, 'sub_deducted', _sub_deduct, 'comm_deducted', _comm_deduct);
END;
$function$;

-- Step 5: Replace admin_wallet_adjust to support balance_type
CREATE OR REPLACE FUNCTION public.admin_wallet_adjust(_user_id uuid, _amount numeric, _type text, _description text, _balance_type text DEFAULT 'commission')
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _current_balance numeric;
  _current_sub numeric;
  _current_comm numeric;
  _new_balance numeric;
  _new_sub numeric;
  _new_comm numeric;
BEGIN
  SELECT balance, subscription_balance, commission_balance
  INTO _current_balance, _current_sub, _current_comm
  FROM public.wallets
  WHERE user_id = _user_id
  FOR UPDATE;

  IF _current_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;

  _new_sub := _current_sub;
  _new_comm := _current_comm;

  IF _type = 'credit' THEN
    IF _balance_type = 'subscription' THEN
      _new_sub := _current_sub + _amount;
    ELSE
      _new_comm := _current_comm + _amount;
    END IF;
    _new_balance := _new_sub + _new_comm;
    UPDATE public.wallets
    SET balance = _new_balance,
        subscription_balance = _new_sub,
        commission_balance = _new_comm,
        total_earned = total_earned + _amount,
        updated_at = now()
    WHERE user_id = _user_id;
  ELSE
    IF _balance_type = 'subscription' THEN
      IF _current_sub < _amount THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient subscription balance');
      END IF;
      _new_sub := _current_sub - _amount;
    ELSE
      IF _current_comm < _amount THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient commission balance');
      END IF;
      _new_comm := _current_comm - _amount;
    END IF;
    _new_balance := _new_sub + _new_comm;
    UPDATE public.wallets
    SET balance = _new_balance,
        subscription_balance = _new_sub,
        commission_balance = _new_comm,
        total_withdrawn = total_withdrawn + _amount,
        updated_at = now()
    WHERE user_id = _user_id;
  END IF;

  INSERT INTO public.wallet_transactions (user_id, type, amount, description, closing_balance, balance_type)
  VALUES (_user_id, _type, _amount, _description, _new_balance, _balance_type);

  RETURN jsonb_build_object('success', true, 'new_balance', _new_balance);
END;
$function$;

-- Step 6: Replace cancel_order_and_refund_wallet to refund to correct buckets
CREATE OR REPLACE FUNCTION public.cancel_order_and_refund_wallet(_order_id uuid, _user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _order RECORD;
  _wallet_amount numeric;
  _new_balance numeric;
  _sub_refund numeric;
  _comm_refund numeric;
BEGIN
  SELECT id, user_id, status, wallet_amount_used
  INTO _order
  FROM public.orders
  WHERE id = _order_id
  FOR UPDATE;

  IF _order IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;

  IF _order.user_id != _user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  IF _order.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order cannot be cancelled');
  END IF;

  _wallet_amount := _order.wallet_amount_used;

  UPDATE public.orders
  SET status = 'cancelled', updated_at = now()
  WHERE id = _order_id;

  IF _wallet_amount > 0 THEN
    -- Look up original deduction transactions to determine how much was from each bucket
    SELECT
      COALESCE(SUM(CASE WHEN balance_type = 'subscription' THEN amount ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN balance_type = 'commission' THEN amount ELSE 0 END), 0)
    INTO _sub_refund, _comm_refund
    FROM public.wallet_transactions
    WHERE order_id = _order_id AND user_id = _user_id AND type = 'debit';

    -- If no breakdown found, refund to commission by default
    IF _sub_refund + _comm_refund = 0 THEN
      _comm_refund := _wallet_amount;
    END IF;

    UPDATE public.wallets
    SET balance = balance + _wallet_amount,
        subscription_balance = subscription_balance + _sub_refund,
        commission_balance = commission_balance + _comm_refund,
        total_withdrawn = GREATEST(0, total_withdrawn - _wallet_amount),
        updated_at = now()
    WHERE user_id = _user_id
    RETURNING balance INTO _new_balance;

    IF _sub_refund > 0 THEN
      INSERT INTO public.wallet_transactions (user_id, type, amount, description, order_id, closing_balance, balance_type)
      VALUES (_user_id, 'credit', _sub_refund, 'Order Cancelled - Refund (Subscription)', _order_id, _new_balance, 'subscription');
    END IF;

    IF _comm_refund > 0 THEN
      INSERT INTO public.wallet_transactions (user_id, type, amount, description, order_id, closing_balance, balance_type)
      VALUES (_user_id, 'credit', _comm_refund, 'Order Cancelled - Refund (Commission)', _order_id, _new_balance, 'commission');
    END IF;
  END IF;

  RETURN jsonb_build_object('success', true, 'refunded', _wallet_amount);
END;
$function$;

-- Step 7: Create withdrawal validation function
CREATE OR REPLACE FUNCTION public.validate_withdrawal(_user_id uuid, _amount numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _comm_balance numeric;
BEGIN
  SELECT commission_balance INTO _comm_balance
  FROM public.wallets
  WHERE user_id = _user_id;

  IF _comm_balance IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Wallet not found');
  END IF;

  IF _amount > _comm_balance THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Withdrawal is not allowed from Subscription Balance. Only your Commission Balance is available for withdrawal.', 'commission_balance', _comm_balance);
  END IF;

  RETURN jsonb_build_object('valid', true, 'commission_balance', _comm_balance);
END;
$function$;

-- Step 8: Update handle_new_profile to credit subscription_balance when membership is activated
-- The existing handle_new_profile just creates a wallet. That's fine.
-- Commission crediting (from process-commissions edge function) should tag balance_type='commission'
-- Membership activation (from razorpay edge function) credits subscription_balance
