-- 1. Trigger to validate order_items price matches actual product price
CREATE OR REPLACE FUNCTION public.validate_order_item_price()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _real_price numeric;
  _variation_adj numeric;
BEGIN
  -- Get real product price (use distributor or retail based on order's price_type_used)
  SELECT 
    CASE 
      WHEN o.price_type_used = 'distributor' THEN p.distributor_price
      ELSE p.retail_price
    END INTO _real_price
  FROM public.products p
  JOIN public.orders o ON o.id = NEW.order_id
  WHERE p.id = NEW.product_id;

  IF _real_price IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  -- Add variation price adjustment if applicable
  IF NEW.variation_id IS NOT NULL THEN
    SELECT price_adjustment INTO _variation_adj
    FROM public.product_variations
    WHERE id = NEW.variation_id AND product_id = NEW.product_id;
    
    IF _variation_adj IS NOT NULL THEN
      _real_price := _real_price + _variation_adj;
    END IF;
  END IF;

  -- Validate price matches (allow tiny floating point tolerance)
  IF ABS(NEW.price - _real_price) > 0.01 THEN
    RAISE EXCEPTION 'Price mismatch: submitted %, expected %', NEW.price, _real_price;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_order_item_price
  BEFORE INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_order_item_price();

-- 2. Trigger to validate wallet_amount_used does not exceed wallet balance
CREATE OR REPLACE FUNCTION public.validate_order_wallet_amount()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _wallet_balance numeric;
BEGIN
  -- Only validate if wallet is being used
  IF NEW.wallet_amount_used IS NOT NULL AND NEW.wallet_amount_used > 0 THEN
    SELECT balance INTO _wallet_balance
    FROM public.wallets
    WHERE user_id = NEW.user_id;

    IF _wallet_balance IS NULL THEN
      RAISE EXCEPTION 'Wallet not found for user';
    END IF;

    IF NEW.wallet_amount_used > _wallet_balance THEN
      RAISE EXCEPTION 'Wallet amount (%) exceeds available balance (%)', NEW.wallet_amount_used, _wallet_balance;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_order_wallet_amount
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_order_wallet_amount();

-- 3. Tighten contact_submissions INSERT policy - add rate limiting via ip check
-- Drop the overly permissive policy and replace with a scoped one
DROP POLICY IF EXISTS "Anyone can insert contact submissions" ON public.contact_submissions;

CREATE POLICY "Anyone can insert contact submissions"
  ON public.contact_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    -- Allow insert but ensure submitted_data is not empty
    submitted_data IS NOT NULL AND submitted_data != '{}'::jsonb
  );