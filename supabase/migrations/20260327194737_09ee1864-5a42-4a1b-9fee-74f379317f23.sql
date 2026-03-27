
-- 1. Create RPC to validate referral code AND check referrer subscription
CREATE OR REPLACE FUNCTION public.validate_referral_with_subscription(_code text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = _code)
    THEN jsonb_build_object('valid', false, 'reason', 'INVALID_CODE', 'message', 'Invalid referral code.')
    WHEN NOT (SELECT subscription_paid FROM public.profiles WHERE referral_code = _code)
    THEN jsonb_build_object('valid', false, 'reason', 'SUBSCRIPTION_REQUIRED', 'message', 'Referring user does not have an active subscription.')
    ELSE jsonb_build_object('valid', true, 'reason', NULL, 'message', NULL)
  END
$$;

-- 2. Update handle_new_user to check referrer subscription before attaching referral
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  referrer_profile_id UUID;
  _default_code TEXT;
  _referrer_subscribed BOOLEAN;
BEGIN
  -- Find referrer by referral code from signup metadata
  IF NEW.raw_user_meta_data->>'referral_code' IS NOT NULL AND 
     NEW.raw_user_meta_data->>'referral_code' != '' THEN
    SELECT id, subscription_paid INTO referrer_profile_id, _referrer_subscribed
    FROM public.profiles
    WHERE referral_code = NEW.raw_user_meta_data->>'referral_code';
    
    -- If referrer is not subscribed, treat as no referral
    IF referrer_profile_id IS NOT NULL AND (_referrer_subscribed IS NULL OR _referrer_subscribed = false) THEN
      referrer_profile_id := NULL;
    END IF;
  END IF;

  -- If no valid referral code or referrer not subscribed, use default placement
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
