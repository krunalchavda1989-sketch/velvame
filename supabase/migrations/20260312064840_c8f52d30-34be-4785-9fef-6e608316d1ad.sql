
-- Add membership tracking fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS membership_source text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS membership_activated_at timestamp with time zone DEFAULT NULL;

-- Add first order and price type tracking to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS is_first_order boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS price_type_used text DEFAULT 'distributor';
