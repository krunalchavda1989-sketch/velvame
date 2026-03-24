
-- Create default placement settings table
CREATE TABLE public.default_placement_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  default_referral_code text NOT NULL DEFAULT 'VM501',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert default row
INSERT INTO public.default_placement_settings (default_referral_code) VALUES ('VM501');

-- Enable RLS
ALTER TABLE public.default_placement_settings ENABLE ROW LEVEL SECURITY;

-- Admins can manage
CREATE POLICY "Admins can manage default placement"
  ON public.default_placement_settings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can read (needed by trigger/frontend)
CREATE POLICY "Anyone can view default placement"
  ON public.default_placement_settings FOR SELECT TO anon, authenticated
  USING (true);

-- Update the handle_new_user trigger function to auto-assign default referral
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  referrer_profile_id UUID;
  _default_code TEXT;
BEGIN
  -- Find referrer by referral code from signup metadata
  IF NEW.raw_user_meta_data->>'referral_code' IS NOT NULL AND 
     NEW.raw_user_meta_data->>'referral_code' != '' THEN
    SELECT id INTO referrer_profile_id
    FROM public.profiles
    WHERE referral_code = NEW.raw_user_meta_data->>'referral_code';
  END IF;

  -- If no referral code provided or invalid, use default placement
  IF referrer_profile_id IS NULL THEN
    SELECT default_referral_code INTO _default_code
    FROM public.default_placement_settings
    LIMIT 1;

    IF _default_code IS NOT NULL AND _default_code != '' THEN
      SELECT id INTO referrer_profile_id
      FROM public.profiles
      WHERE referral_code = _default_code;
    END IF;
  END IF;

  -- Create profile with referral relationship
  INSERT INTO public.profiles (user_id, full_name, referred_by)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    referrer_profile_id
  );

  -- Update referrer's direct referral count
  IF referrer_profile_id IS NOT NULL THEN
    UPDATE public.profiles
    SET direct_referral_count = direct_referral_count + 1
    WHERE id = referrer_profile_id;
  END IF;

  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  RETURN NEW;
END;
$function$;
