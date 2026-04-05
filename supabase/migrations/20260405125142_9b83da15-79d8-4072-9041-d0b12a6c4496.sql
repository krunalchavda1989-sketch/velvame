
CREATE TABLE public.feature_toggles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_key text NOT NULL UNIQUE,
  is_enabled boolean NOT NULL DEFAULT true,
  label text NOT NULL DEFAULT '',
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_toggles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage feature toggles"
  ON public.feature_toggles FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view feature toggles"
  ON public.feature_toggles FOR SELECT
  TO anon, authenticated
  USING (true);

INSERT INTO public.feature_toggles (feature_key, is_enabled, label)
VALUES ('wallet_withdrawal', true, 'Wallet Withdrawal Button');
