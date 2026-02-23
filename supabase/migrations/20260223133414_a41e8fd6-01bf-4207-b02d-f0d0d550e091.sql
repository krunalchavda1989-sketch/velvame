
-- Fix 1: Restrict profiles SELECT policy
DROP POLICY "Public profiles are viewable" ON public.profiles;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Users can view their direct referrals (downline)
CREATE POLICY "Users can view direct referrals" ON public.profiles
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles AS parent
    WHERE parent.user_id = auth.uid()
    AND profiles.referred_by = parent.id
  )
);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RPC for referral code validation (used during registration, no auth required)
CREATE OR REPLACE FUNCTION public.validate_referral_code(_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE referral_code = _code
  )
$$;

-- Fix 2: Update handle_new_user to process referral relationships
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referrer_profile_id UUID;
BEGIN
  -- Find referrer by referral code from signup metadata
  IF NEW.raw_user_meta_data->>'referral_code' IS NOT NULL AND 
     NEW.raw_user_meta_data->>'referral_code' != '' THEN
    SELECT id INTO referrer_profile_id
    FROM public.profiles
    WHERE referral_code = NEW.raw_user_meta_data->>'referral_code';
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
$$;
