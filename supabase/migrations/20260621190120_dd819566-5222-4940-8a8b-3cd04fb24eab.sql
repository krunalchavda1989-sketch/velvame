
-- 1) COUPONS: remove broad authenticated read; keep admin-only access
DROP POLICY IF EXISTS "Authenticated users can view active coupons" ON public.coupons;

-- Safe public listing (no max_uses/used_count/is_active flags exposure beyond what's needed)
CREATE OR REPLACE FUNCTION public.list_public_coupons()
RETURNS TABLE(id uuid, code text, discount_type text, discount_value numeric,
              min_order_amount numeric, max_discount_amount numeric, end_date timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT c.id, c.code, c.discount_type, c.discount_value,
         c.min_order_amount, c.max_discount_amount, c.end_date
  FROM public.coupons c
  WHERE c.is_active = true
    AND c.start_date <= now()
    AND c.end_date >= now()
    AND (c.max_uses = 0 OR c.used_count < c.max_uses)
  ORDER BY c.discount_value DESC;
$$;
GRANT EXECUTE ON FUNCTION public.list_public_coupons() TO authenticated, anon;

-- Validate + return discount only
CREATE OR REPLACE FUNCTION public.validate_coupon(_code text, _order_amount numeric)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  c RECORD;
  _discount numeric;
BEGIN
  SELECT * INTO c FROM public.coupons
   WHERE code = upper(trim(_code)) AND is_active = true;
  IF c IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid coupon code');
  END IF;
  IF c.start_date > now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Coupon not yet active');
  END IF;
  IF c.end_date < now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Coupon has expired');
  END IF;
  IF c.max_uses > 0 AND c.used_count >= c.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Coupon usage limit reached');
  END IF;
  IF c.min_order_amount > 0 AND _order_amount < c.min_order_amount THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Minimum order of ' || c.min_order_amount || ' required');
  END IF;
  IF c.discount_type = 'percentage' THEN
    _discount := (_order_amount * c.discount_value) / 100;
    IF c.max_discount_amount > 0 THEN
      _discount := LEAST(_discount, c.max_discount_amount);
    END IF;
  ELSE
    _discount := c.discount_value;
  END IF;
  RETURN jsonb_build_object(
    'valid', true,
    'id', c.id,
    'code', c.code,
    'discount_type', c.discount_type,
    'discount_value', c.discount_value,
    'max_discount_amount', c.max_discount_amount,
    'discount_amount', _discount
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, numeric) TO authenticated, anon;

-- 2) STORAGE: popup-images admin-only writes
DROP POLICY IF EXISTS "Authenticated users can upload popup images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update popup images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete popup images" ON storage.objects;

CREATE POLICY "Admins can upload popup images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'popup-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update popup images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'popup-images' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'popup-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete popup images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'popup-images' AND public.has_role(auth.uid(), 'admin'));

-- 3) REALTIME: restrict subscriptions to topics scoped to user's own uid
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can subscribe to own-scoped topics" ON realtime.messages;
CREATE POLICY "Users can subscribe to own-scoped topics"
ON realtime.messages FOR SELECT TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND realtime.topic() LIKE '%' || auth.uid()::text || '%'
);

DROP POLICY IF EXISTS "Users can broadcast to own-scoped topics" ON realtime.messages;
CREATE POLICY "Users can broadcast to own-scoped topics"
ON realtime.messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND realtime.topic() LIKE '%' || auth.uid()::text || '%'
);
