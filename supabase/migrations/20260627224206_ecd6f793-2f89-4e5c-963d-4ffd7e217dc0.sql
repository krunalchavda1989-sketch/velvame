
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS pickup_code text,
  ADD COLUMN IF NOT EXISTS picked_up_at timestamptz,
  ADD COLUMN IF NOT EXISTS picked_up_by_admin_id uuid,
  ADD COLUMN IF NOT EXISTS pickup_verified boolean NOT NULL DEFAULT false;

-- Trigger: auto-generate 6-digit pickup_code on insert when delivery_method='pickup'
CREATE OR REPLACE FUNCTION public.set_pickup_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.delivery_method = 'pickup' AND (NEW.pickup_code IS NULL OR NEW.pickup_code = '') THEN
    NEW.pickup_code := LPAD((floor(random() * 1000000))::int::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_pickup_code ON public.orders;
CREATE TRIGGER trg_set_pickup_code
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_pickup_code();

-- Backfill existing pickup orders missing a code
UPDATE public.orders
SET pickup_code = LPAD((floor(random() * 1000000))::int::text, 6, '0')
WHERE delivery_method = 'pickup' AND (pickup_code IS NULL OR pickup_code = '');

-- Admin-only verification RPC
CREATE OR REPLACE FUNCTION public.admin_verify_pickup_code(_order_id uuid, _code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _order RECORD;
  _admin_id uuid;
BEGIN
  _admin_id := auth.uid();
  IF _admin_id IS NULL OR NOT public.has_role(_admin_id, 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT id, delivery_method, pickup_code, pickup_verified, status
    INTO _order
  FROM public.orders
  WHERE id = _order_id
  FOR UPDATE;

  IF _order IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;

  IF _order.delivery_method <> 'pickup' THEN
    RETURN jsonb_build_object('success', false, 'error', 'This is not a self-pickup order');
  END IF;

  IF _order.pickup_verified THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order already verified as picked up');
  END IF;

  IF _order.pickup_code IS NULL OR trim(_code) <> _order.pickup_code THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid pickup code');
  END IF;

  UPDATE public.orders
  SET pickup_verified = true,
      picked_up_at = now(),
      picked_up_by_admin_id = _admin_id,
      status = 'delivered',
      updated_at = now()
  WHERE id = _order_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_verify_pickup_code(uuid, text) TO authenticated;
