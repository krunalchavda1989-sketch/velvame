
-- Drop the trigger first
DROP TRIGGER IF EXISTS trg_auto_place_binary ON public.profiles;

-- Drop the function with CASCADE
DROP FUNCTION IF EXISTS public.auto_place_binary_position() CASCADE;

-- Drop binary tables
DROP TABLE IF EXISTS public.binary_payouts CASCADE;
DROP TABLE IF EXISTS public.binary_positions CASCADE;
DROP TABLE IF EXISTS public.binary_settings CASCADE;
