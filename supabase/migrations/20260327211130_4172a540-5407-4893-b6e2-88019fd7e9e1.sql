GRANT UPDATE ON TABLE public.profiles TO authenticated;

GRANT UPDATE (
  full_name,
  phone,
  title,
  subscription_paid,
  subscription_date,
  membership_activated_at,
  membership_source,
  updated_at,
  avatar_url
) ON TABLE public.profiles TO authenticated;