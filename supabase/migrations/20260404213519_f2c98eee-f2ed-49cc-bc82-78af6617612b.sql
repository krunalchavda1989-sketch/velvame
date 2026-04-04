
CREATE OR REPLACE FUNCTION public.admin_cancel_order_and_refund(_order_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _order RECORD;
  _wallet_amount numeric;
  _sub_refund numeric;
  _comm_refund numeric;
  _new_balance numeric;
BEGIN
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

  UPDATE public.payments
  SET status = 'failed'
  WHERE order_ref_id = _order_id;

  UPDATE public.orders
  SET status = 'cancelled', updated_at = now()
  WHERE id = _order_id;

  IF _wallet_amount > 0 THEN
    SELECT
      COALESCE(SUM(CASE WHEN balance_type = 'subscription' THEN amount ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN balance_type = 'commission' THEN amount ELSE 0 END), 0)
    INTO _sub_refund, _comm_refund
    FROM public.wallet_transactions
    WHERE order_id = _order_id AND user_id = _order.user_id AND type = 'debit';

    IF (_sub_refund + _comm_refund) > 0 THEN
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
$function$;

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

  _wallet_amount := COALESCE(_order.wallet_amount_used, 0);

  UPDATE public.orders
  SET status = 'cancelled', updated_at = now()
  WHERE id = _order_id;

  IF _wallet_amount > 0 THEN
    SELECT
      COALESCE(SUM(CASE WHEN balance_type = 'subscription' THEN amount ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN balance_type = 'commission' THEN amount ELSE 0 END), 0)
    INTO _sub_refund, _comm_refund
    FROM public.wallet_transactions
    WHERE order_id = _order_id AND user_id = _user_id AND type = 'debit';

    IF (_sub_refund + _comm_refund) > 0 THEN
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
$function$;
