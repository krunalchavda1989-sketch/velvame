
-- 1. Update deduct_wallet_balance to accept and store order_id
CREATE OR REPLACE FUNCTION public.deduct_wallet_balance(_user_id uuid, _amount numeric, _order_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  IF _sub_deduct > 0 THEN
    INSERT INTO public.wallet_transactions (user_id, type, amount, description, closing_balance, balance_type, order_id)
    VALUES (_user_id, 'debit', _sub_deduct, 'Order Payment (Subscription Balance)', _new_balance, 'subscription', _order_id);
  END IF;

  IF _comm_deduct > 0 THEN
    INSERT INTO public.wallet_transactions (user_id, type, amount, description, closing_balance, balance_type, order_id)
    VALUES (_user_id, 'debit', _comm_deduct, 'Order Payment (Commission Balance)', _new_balance, 'commission', _order_id);
  END IF;

  RETURN jsonb_build_object('success', true, 'new_balance', _new_balance, 'sub_deducted', _sub_deduct, 'comm_deducted', _comm_deduct);
END;
$$;

-- 2. Create admin cancel + refund RPC that properly handles all scenarios
CREATE OR REPLACE FUNCTION public.admin_cancel_order_and_refund(_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _order RECORD;
  _wallet_amount numeric;
  _sub_refund numeric;
  _comm_refund numeric;
  _new_balance numeric;
  _payment RECORD;
BEGIN
  -- Get order with lock
  SELECT id, user_id, status, wallet_amount_used, payment_method, total_amount
  INTO _order
  FROM public.orders
  WHERE id = _order_id
  FOR UPDATE;

  IF _order IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;

  IF _order.status = 'cancelled' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order already cancelled');
  END IF;

  _wallet_amount := COALESCE(_order.wallet_amount_used, 0);

  -- Mark payments as failed
  UPDATE public.payments
  SET status = 'failed'
  WHERE order_ref_id = _order_id::text;

  -- Update order status
  UPDATE public.orders
  SET status = 'cancelled', updated_at = now()
  WHERE id = _order_id;

  -- Only refund wallet if wallet was actually used AND debit transactions exist
  IF _wallet_amount > 0 THEN
    -- Look for actual debit transactions linked to this order
    SELECT
      COALESCE(SUM(CASE WHEN balance_type = 'subscription' THEN amount ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN balance_type = 'commission' THEN amount ELSE 0 END), 0)
    INTO _sub_refund, _comm_refund
    FROM public.wallet_transactions
    WHERE order_id = _order_id AND user_id = _order.user_id AND type = 'debit';

    -- Only refund if we found actual debit transactions (prevents phantom refunds)
    IF (_sub_refund + _comm_refund) > 0 THEN
      -- Check if already refunded (prevent double refund)
      IF EXISTS (
        SELECT 1 FROM public.wallet_transactions
        WHERE order_id = _order_id AND user_id = _order.user_id AND type = 'credit'
          AND description LIKE 'Order Cancelled%'
      ) THEN
        RETURN jsonb_build_object('success', true, 'refunded', 0, 'message', 'Already refunded');
      END IF;

      UPDATE public.wallets
      SET balance = balance + _sub_refund + _comm_refund,
          subscription_balance = subscription_balance + _sub_refund,
          commission_balance = commission_balance + _comm_refund,
          total_withdrawn = GREATEST(0, total_withdrawn - (_sub_refund + _comm_refund)),
          updated_at = now()
      WHERE user_id = _order.user_id
      RETURNING balance INTO _new_balance;

      IF _sub_refund > 0 THEN
        INSERT INTO public.wallet_transactions (user_id, type, amount, description, order_id, closing_balance, balance_type)
        VALUES (_order.user_id, 'credit', _sub_refund, 'Order Cancelled - Refund (Subscription)', _order_id, _new_balance, 'subscription');
      END IF;

      IF _comm_refund > 0 THEN
        INSERT INTO public.wallet_transactions (user_id, type, amount, description, order_id, closing_balance, balance_type)
        VALUES (_order.user_id, 'credit', _comm_refund, 'Order Cancelled - Refund (Commission)', _order_id, _new_balance, 'commission');
      END IF;

      RETURN jsonb_build_object('success', true, 'refunded', _sub_refund + _comm_refund, 'sub_refunded', _sub_refund, 'comm_refunded', _comm_refund);
    END IF;
  END IF;

  RETURN jsonb_build_object('success', true, 'refunded', 0, 'message', 'No wallet deduction found to refund');
END;
$$;

-- 3. Update cancel_order_and_refund_wallet (user-facing) to also prevent double refund
CREATE OR REPLACE FUNCTION public.cancel_order_and_refund_wallet(_order_id uuid, _user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  _wallet_amount := COALESCE(_order.wallet_amount_used, 0);

  UPDATE public.orders
  SET status = 'cancelled', updated_at = now()
  WHERE id = _order_id;

  IF _wallet_amount > 0 THEN
    -- Check for actual debit transactions
    SELECT
      COALESCE(SUM(CASE WHEN balance_type = 'subscription' THEN amount ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN balance_type = 'commission' THEN amount ELSE 0 END), 0)
    INTO _sub_refund, _comm_refund
    FROM public.wallet_transactions
    WHERE order_id = _order_id AND user_id = _user_id AND type = 'debit';

    -- Only refund if actual deductions found
    IF (_sub_refund + _comm_refund) > 0 THEN
      -- Prevent double refund
      IF EXISTS (
        SELECT 1 FROM public.wallet_transactions
        WHERE order_id = _order_id AND user_id = _user_id AND type = 'credit'
          AND description LIKE 'Order Cancelled%'
      ) THEN
        RETURN jsonb_build_object('success', true, 'refunded', 0);
      END IF;

      UPDATE public.wallets
      SET balance = balance + _sub_refund + _comm_refund,
          subscription_balance = subscription_balance + _sub_refund,
          commission_balance = commission_balance + _comm_refund,
          total_withdrawn = GREATEST(0, total_withdrawn - (_sub_refund + _comm_refund)),
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
  END IF;

  RETURN jsonb_build_object('success', true, 'refunded', _sub_refund + _comm_refund);
END;
$$;

-- 4. Fix VM527's wallet balance - reset to correct value (2800 subscription, 0 commission)
UPDATE public.wallets
SET balance = 2800,
    subscription_balance = 2800,
    commission_balance = 0,
    total_withdrawn = 0,
    total_earned = 2800,
    updated_at = now()
WHERE user_id = '5361763b-799b-4e25-9eee-82a89ab8a848';
