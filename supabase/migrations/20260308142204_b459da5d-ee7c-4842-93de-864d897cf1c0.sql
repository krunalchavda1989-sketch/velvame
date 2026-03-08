
CREATE TABLE public.localization_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  default_language text NOT NULL DEFAULT 'en',
  default_currency text NOT NULL DEFAULT 'INR',
  currency_symbol text NOT NULL DEFAULT '₹',
  available_languages jsonb NOT NULL DEFAULT '["en","hi"]'::jsonb,
  available_currencies jsonb NOT NULL DEFAULT '[{"code":"INR","symbol":"₹","name":"Indian Rupee"},{"code":"USD","symbol":"$","name":"US Dollar"},{"code":"EUR","symbol":"€","name":"Euro"}]'::jsonb,
  tax_enabled boolean NOT NULL DEFAULT false,
  tax_label text NOT NULL DEFAULT 'GST',
  tax_rate numeric NOT NULL DEFAULT 18,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.localization_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage localization"
  ON public.localization_settings FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view localization"
  ON public.localization_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anon can view localization"
  ON public.localization_settings FOR SELECT
  TO anon
  USING (true);

-- Insert default row
INSERT INTO public.localization_settings (default_language, default_currency, currency_symbol)
VALUES ('en', 'INR', '₹');
