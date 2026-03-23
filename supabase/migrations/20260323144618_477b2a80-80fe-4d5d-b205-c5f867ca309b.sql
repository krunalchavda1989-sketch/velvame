
-- Create referral code settings table
CREATE TABLE public.referral_code_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prefix text NOT NULL DEFAULT 'VEL',
  padding integer NOT NULL DEFAULT 6,
  next_number integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referral_code_settings ENABLE ROW LEVEL SECURITY;

-- Admins can manage
CREATE POLICY "Admins can manage referral code settings" ON public.referral_code_settings
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view (needed for trigger)
CREATE POLICY "Anyone can view referral code settings" ON public.referral_code_settings
  FOR SELECT TO anon, authenticated
  USING (true);

-- Insert default row
INSERT INTO public.referral_code_settings (prefix, padding, next_number) VALUES ('VEL', 6, 1);

-- Replace the generate_referral_code trigger function
CREATE OR REPLACE FUNCTION public.generate_referral_code()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  _prefix TEXT;
  _padding INTEGER;
  _next INTEGER;
  _settings_id UUID;
BEGIN
  SELECT id INTO _settings_id FROM public.referral_code_settings LIMIT 1;

  IF _settings_id IS NULL THEN
    _prefix := 'VEL';
    _next := 1;
    _padding := 6;
  ELSE
    UPDATE public.referral_code_settings
    SET next_number = next_number + 1, updated_at = now()
    WHERE id = _settings_id
    RETURNING prefix, next_number - 1, padding
    INTO _prefix, _next, _padding;
  END IF;

  NEW.referral_code := _prefix || LPAD(_next::TEXT, _padding, '0');
  RETURN NEW;
END;
$function$;
