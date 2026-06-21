
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  referrer_profile_id UUID;
  _default_code TEXT;
  _referrer_subscribed BOOLEAN;
  _phone TEXT;
BEGIN
  IF NEW.raw_user_meta_data->>'referral_code' IS NOT NULL AND 
     NEW.raw_user_meta_data->>'referral_code' != '' THEN
    SELECT id, subscription_paid INTO referrer_profile_id, _referrer_subscribed
    FROM public.profiles
    WHERE referral_code = NEW.raw_user_meta_data->>'referral_code';
    
    IF referrer_profile_id IS NOT NULL AND (_referrer_subscribed IS NULL OR _referrer_subscribed = false) THEN
      referrer_profile_id := NULL;
    END IF;
  END IF;

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

  _phone := NULLIF(NEW.raw_user_meta_data->>'phone', '');

  INSERT INTO public.profiles (user_id, full_name, referred_by, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    referrer_profile_id,
    _phone
  );

  IF referrer_profile_id IS NOT NULL THEN
    UPDATE public.profiles
    SET direct_referral_count = direct_referral_count + 1
    WHERE id = referrer_profile_id;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  RETURN NEW;
END;
$function$;
