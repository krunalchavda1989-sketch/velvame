
ALTER TABLE public.awards_rewards
  ADD COLUMN IF NOT EXISTS required_active_members integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS description text DEFAULT '';

-- Update gift_image_url default
ALTER TABLE public.awards_rewards ALTER COLUMN gift_image_url SET DEFAULT '';
