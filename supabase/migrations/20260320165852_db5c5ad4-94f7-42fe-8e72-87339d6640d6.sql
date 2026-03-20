ALTER TABLE public.brand_settings ADD COLUMN IF NOT EXISTS favicon_url text DEFAULT '';
ALTER TABLE public.brand_settings ADD COLUMN IF NOT EXISTS footer_logo_url text DEFAULT '';