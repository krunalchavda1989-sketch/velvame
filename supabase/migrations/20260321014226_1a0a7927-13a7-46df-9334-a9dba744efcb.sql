ALTER TABLE public.breadcrumb_settings
  ADD COLUMN IF NOT EXISTS padding_top integer NOT NULL DEFAULT 16,
  ADD COLUMN IF NOT EXISTS padding_bottom integer NOT NULL DEFAULT 16;