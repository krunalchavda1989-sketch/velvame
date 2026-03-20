ALTER TABLE public.brand_settings ADD COLUMN IF NOT EXISTS og_image_url text DEFAULT '';
ALTER TABLE public.brand_settings ADD COLUMN IF NOT EXISTS brand_color text DEFAULT '#1a1a2e';
ALTER TABLE public.brand_settings ADD COLUMN IF NOT EXISTS button_color text DEFAULT '#1a1a2e';
ALTER TABLE public.brand_settings ADD COLUMN IF NOT EXISTS font_heading text DEFAULT 'Space Grotesk';
ALTER TABLE public.brand_settings ADD COLUMN IF NOT EXISTS font_body text DEFAULT 'Inter';