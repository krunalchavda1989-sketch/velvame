
CREATE TABLE public.pickup_verification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  code_entered text NOT NULL,
  success boolean NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pickup_verification_logs TO authenticated;
GRANT ALL ON public.pickup_verification_logs TO service_role;

ALTER TABLE public.pickup_verification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view pickup verification logs"
ON public.pickup_verification_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_pickup_verification_logs_order ON public.pickup_verification_logs(order_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.admin_verify_pickup_code(_order_id uuid, _code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _order RECORD;
  _admin_id uuid;
  _masked text;
  _reason text;
BEGIN
  _admin_id := auth.uid();
  _masked := COALESCE(trim(_code), '');

  IF _admin_id IS NULL OR NOT public.has_role(_admin_id, 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT id, delivery_method, pickup_code, pickup_verified, status
    INTO _order
  FROM public.orders
  WHERE id = _order_id
  FOR UPDATE;

  IF _order IS NULL THEN
    INSERT INTO public.pickup_verification_logs (order_id, admin_id, code_entered, success, reason)
    VALUES (_order_id, _admin_id, _masked, false, 'Order not found');
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;

  IF _order.delivery_method <> 'pickup' THEN
    _reason := 'Not a self-pickup order';
  ELSIF _order.pickup_verified THEN
    _reason := 'Already verified';
  ELSIF _order.pickup_code IS NULL OR trim(_code) <> _order.pickup_code THEN
    _reason := 'Invalid pickup code';
  END IF;

  IF _reason IS NOT NULL THEN
    INSERT INTO public.pickup_verification_logs (order_id, admin_id, code_entered, success, reason)
    VALUES (_order_id, _admin_id, _masked, false, _reason);
    RETURN jsonb_build_object('success', false, 'error', _reason);
  END IF;

  UPDATE public.orders
  SET pickup_verified = true,
      picked_up_at = now(),
      picked_up_by_admin_id = _admin_id,
      status = 'delivered',
      updated_at = now()
  WHERE id = _order_id;

  INSERT INTO public.pickup_verification_logs (order_id, admin_id, code_entered, success, reason)
  VALUES (_order_id, _admin_id, _masked, true, 'Verified');

  RETURN jsonb_build_object('success', true);
END;
$function$;
