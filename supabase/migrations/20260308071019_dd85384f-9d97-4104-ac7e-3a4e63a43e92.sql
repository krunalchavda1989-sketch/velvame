
-- Drop FK constraint and triggers
ALTER TABLE public.profiles DROP CONSTRAINT profiles_user_id_fkey;
ALTER TABLE public.profiles DISABLE TRIGGER on_profile_created;
ALTER TABLE public.profiles DISABLE TRIGGER set_referral_code;

-- Insert dummy members
INSERT INTO profiles (id, user_id, full_name, referral_code, referred_by, subscription_paid, title, direct_referral_count)
VALUES 
  ('a1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'Priya Sharma', 'NXMA1111', 'e044a5c2-ed9c-435c-8230-b424dc5333f0', true, 'Silver', 2),
  ('a2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 'Rahul Verma', 'NXMA2222', 'e044a5c2-ed9c-435c-8230-b424dc5333f0', true, 'Member', 1),
  ('a3333333-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333', 'Anita Desai', 'NXMA3333', 'e044a5c2-ed9c-435c-8230-b424dc5333f0', false, 'Member', 0),
  ('a4444444-4444-4444-4444-444444444444', 'b4444444-4444-4444-4444-444444444444', 'Vikram Patel', 'NXMA4444', 'a1111111-1111-1111-1111-111111111111', true, 'Member', 2),
  ('a5555555-5555-5555-5555-555555555555', 'b5555555-5555-5555-5555-555555555555', 'Neha Gupta', 'NXMA5555', 'a1111111-1111-1111-1111-111111111111', true, 'Member', 0),
  ('a6666666-6666-6666-6666-666666666666', 'b6666666-6666-6666-6666-666666666666', 'Suresh Kumar', 'NXMA6666', 'a2222222-2222-2222-2222-222222222222', false, 'Member', 0),
  ('a7777777-7777-7777-7777-777777777777', 'b7777777-7777-7777-7777-777777777777', 'Deepak Singh', 'NXMA7777', 'a4444444-4444-4444-4444-444444444444', true, 'Member', 0),
  ('a8888888-8888-8888-8888-888888888888', 'b8888888-8888-8888-8888-888888888888', 'Kavita Joshi', 'NXMA8888', 'a4444444-4444-4444-4444-444444444444', false, 'Member', 0);

-- Update Krunal's direct referral count
UPDATE profiles SET direct_referral_count = 3 WHERE id = 'e044a5c2-ed9c-435c-8230-b424dc5333f0';

-- Re-enable triggers
ALTER TABLE public.profiles ENABLE TRIGGER on_profile_created;
ALTER TABLE public.profiles ENABLE TRIGGER set_referral_code;

-- Re-add FK as NOT VALID so existing dummy rows aren't validated
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;
