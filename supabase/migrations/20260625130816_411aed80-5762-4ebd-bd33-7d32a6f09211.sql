
-- pickup_locations
CREATE TABLE public.pickup_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  state text,
  pincode text,
  phone text,
  hours text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pickup_locations TO anon, authenticated;
GRANT ALL ON public.pickup_locations TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.pickup_locations TO authenticated;
ALTER TABLE public.pickup_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active pickup locations are public" ON public.pickup_locations
  FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage pickup locations" ON public.pickup_locations
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_pickup_locations_updated_at
  BEFORE UPDATE ON public.pickup_locations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- shipping_settings (single row)
CREATE TABLE public.shipping_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_enabled boolean NOT NULL DEFAULT true,
  pickup_enabled boolean NOT NULL DEFAULT true,
  courier_charge numeric NOT NULL DEFAULT 0,
  free_courier_above numeric,
  pickup_charge numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.shipping_settings TO anon, authenticated;
GRANT ALL ON public.shipping_settings TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.shipping_settings TO authenticated;
ALTER TABLE public.shipping_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shipping settings are public" ON public.shipping_settings
  FOR SELECT USING (true);
CREATE POLICY "Admins manage shipping settings" ON public.shipping_settings
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_shipping_settings_updated_at
  BEFORE UPDATE ON public.shipping_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.shipping_settings (courier_enabled, pickup_enabled, courier_charge, free_courier_above, pickup_charge)
VALUES (true, true, 0, NULL, 0);

-- orders columns
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_method text NOT NULL DEFAULT 'courier',
  ADD COLUMN IF NOT EXISTS pickup_location_id uuid REFERENCES public.pickup_locations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS shipping_charge numeric NOT NULL DEFAULT 0;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_delivery_method_check CHECK (delivery_method IN ('courier','pickup'));
