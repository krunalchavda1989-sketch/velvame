
-- Add wallet_amount_used and razorpay_amount columns to orders table
ALTER TABLE public.orders ADD COLUMN wallet_amount_used numeric NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN razorpay_amount numeric NOT NULL DEFAULT 0;

-- Create a SECURITY DEFINER function to atomically cancel an order and refund wallet
CREATE OR REPLACE FUNCTION public.cancel_order_and_refund_wallet(_order_id uuid, _user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _order RECORD;
  _wallet_amount numeric;
BEGIN
  -- Lock and fetch the order
  SELECT id, user_id, status, wallet_amount_used
  INTO _order
  FROM public.orders
  WHERE id = _order_id
  FOR UPDATE;

  IF _order IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;

  -- Verify the order belongs to the user
  IF _order.user_id != _user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Only cancel pending orders
  IF _order.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order cannot be cancelled');
  END IF;

  _wallet_amount := _order.wallet_amount_used;

  -- Mark order as cancelled
  UPDATE public.orders
  SET status = 'cancelled', updated_at = now()
  WHERE id = _order_id;

  -- Refund wallet if any was used
  IF _wallet_amount > 0 THEN
    UPDATE public.wallets
    SET balance = balance + _wallet_amount,
        total_withdrawn = GREATEST(0, total_withdrawn - _wallet_amount),
        updated_at = now()
    WHERE user_id = _user_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'refunded', _wallet_amount);
END;
$$;
