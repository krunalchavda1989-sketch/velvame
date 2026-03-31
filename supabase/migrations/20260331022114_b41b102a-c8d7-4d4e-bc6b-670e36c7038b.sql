
ALTER TABLE public.product_categories
ADD COLUMN IF NOT EXISTS seo_title text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS seo_description text NOT NULL DEFAULT '';
