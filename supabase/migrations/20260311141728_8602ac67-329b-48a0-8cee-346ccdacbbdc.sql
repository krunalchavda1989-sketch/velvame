
-- Create wallet_transactions table
CREATE TABLE public.wallet_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'credit',
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  closing_balance NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view own transactions
CREATE POLICY "Users can view own wallet transactions"
  ON public.wallet_transactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Admins can manage all
CREATE POLICY "Admins can manage wallet transactions"
  ON public.wallet_transactions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Update deduct_wallet_balance to log transaction
CREATE OR REPLACE FUNCTION public.deduct_wallet_balance(_user_id uuid, _amount numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _current_balance numeric;
  _new_balance numeric;
BEGIN
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

  -- Log transaction
  INSERT INTO public.wallet_transactions (user_id, type, amount, description, closing_balance)
  VALUES (_user_id, 'debit', _amount, 'Order Payment', _new_balance);

  RETURN jsonb_build_object('success', true, 'new_balance', _new_balance);
END;
$function$;

-- Update cancel_order_and_refund_wallet to log transaction
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
    UPDATE public.wallets
    SET balance = balance + _wallet_amount,
        total_withdrawn = GREATEST(0, total_withdrawn - _wallet_amount),
        updated_at = now()
    WHERE user_id = _user_id
    RETURNING balance INTO _new_balance;

    -- Log refund transaction
    INSERT INTO public.wallet_transactions (user_id, type, amount, description, order_id, closing_balance)
    VALUES (_user_id, 'credit', _wallet_amount, 'Order Cancelled - Refund', _order_id, _new_balance);
  END IF;

  RETURN jsonb_build_object('success', true, 'refunded', _wallet_amount);
END;
$function$;

-- Create admin function to credit/debit wallet with logging
CREATE OR REPLACE FUNCTION public.admin_wallet_adjust(_user_id uuid, _amount numeric, _type text, _description text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _current_balance numeric;
  _new_balance numeric;
BEGIN
  SELECT balance INTO _current_balance
  FROM public.wallets
  WHERE user_id = _user_id
  FOR UPDATE;

  IF _current_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;

  IF _type = 'debit' AND _current_balance < _amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  IF _type = 'credit' THEN
    _new_balance := _current_balance + _amount;
    UPDATE public.wallets
    SET balance = _new_balance,
        total_earned = total_earned + _amount,
        updated_at = now()
    WHERE user_id = _user_id;
  ELSE
    _new_balance := _current_balance - _amount;
    UPDATE public.wallets
    SET balance = _new_balance,
        total_withdrawn = total_withdrawn + _amount,
        updated_at = now()
    WHERE user_id = _user_id;
  END IF;

  INSERT INTO public.wallet_transactions (user_id, type, amount, description, closing_balance)
  VALUES (_user_id, _type, _amount, _description, _new_balance);

  RETURN jsonb_build_object('success', true, 'new_balance', _new_balance);
END;
$function$;
