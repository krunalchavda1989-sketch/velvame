
-- 1. Create tax_settings (singleton) and move GST out of public brand_settings
CREATE TABLE IF NOT EXISTS public.tax_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gst_number text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.tax_settings TO authenticated;
GRANT ALL ON public.tax_settings TO service_role;

ALTER TABLE public.tax_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view tax settings"
  ON public.tax_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage tax settings"
  ON public.tax_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER tax_settings_set_updated_at
  BEFORE UPDATE ON public.tax_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed a singleton row, copying existing GST from brand_settings if present
INSERT INTO public.tax_settings (gst_number)
SELECT COALESCE(gst_number, '')
FROM public.brand_settings
LIMIT 1;

INSERT INTO public.tax_settings (gst_number)
SELECT ''
WHERE NOT EXISTS (SELECT 1 FROM public.tax_settings);

-- Remove GST from publicly-readable brand_settings
ALTER TABLE public.brand_settings DROP COLUMN IF EXISTS gst_number;

-- 2. Restrict referral_code_settings to admins only (signup uses SECURITY DEFINER trigger)
DROP POLICY IF EXISTS "Anyone can view referral code settings" ON public.referral_code_settings;

-- 3. Restrict system_feature_log to admins only
DROP POLICY IF EXISTS "Anyone can view feature log" ON public.system_feature_log;
