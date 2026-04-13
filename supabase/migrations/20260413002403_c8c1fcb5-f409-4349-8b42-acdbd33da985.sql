
-- Add background and padding fields to reels_settings
ALTER TABLE public.reels_settings
  ADD COLUMN IF NOT EXISTS bg_type text NOT NULL DEFAULT 'solid',
  ADD COLUMN IF NOT EXISTS bg_color text NOT NULL DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS gradient_direction text NOT NULL DEFAULT 'to bottom',
  ADD COLUMN IF NOT EXISTS gradient_stops jsonb NOT NULL DEFAULT '[{"color":"#ffffff","position":0},{"color":"#f3f4f6","position":100}]'::jsonb,
  ADD COLUMN IF NOT EXISTS bg_image_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS padding_top integer NOT NULL DEFAULT 48,
  ADD COLUMN IF NOT EXISTS padding_bottom integer NOT NULL DEFAULT 48;
