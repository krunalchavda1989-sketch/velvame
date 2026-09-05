CREATE TABLE public.payout_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_day_of_month integer NOT NULL DEFAULT 5,
  min_payout_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.payout_settings TO authenticated;
GRANT ALL ON public.payout_settings TO service_role;

ALTER TABLE public.payout_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view payout settings"
  ON public.payout_settings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert payout settings"
  ON public.payout_settings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update payout settings"
  ON public.payout_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER payout_settings_updated_at
  BEFORE UPDATE ON public.payout_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.payout_settings (payout_day_of_month, min_payout_amount) VALUES (5, 0);