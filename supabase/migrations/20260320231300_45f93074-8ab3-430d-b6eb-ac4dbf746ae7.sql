ALTER TABLE public.footer_settings 
  ADD COLUMN IF NOT EXISTS show_brand_section boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS brand_description text NOT NULL DEFAULT '';