
ALTER TABLE public.product_categories
ADD COLUMN IF NOT EXISTS slug text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS banner_url text NOT NULL DEFAULT '';

-- Populate slugs from existing names
UPDATE public.product_categories
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug = '';

-- Add unique constraint on slug
ALTER TABLE public.product_categories ADD CONSTRAINT product_categories_slug_key UNIQUE (slug);
