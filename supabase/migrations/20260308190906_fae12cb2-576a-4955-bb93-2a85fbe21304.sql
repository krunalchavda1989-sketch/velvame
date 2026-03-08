
-- Product variations (e.g. Size: S/M/L, Color: Red/Blue)
CREATE TABLE public.product_variations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  attribute_name TEXT NOT NULL DEFAULT '',
  attribute_value TEXT NOT NULL DEFAULT '',
  price_adjustment NUMERIC NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  sku TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Product tags (many-to-many via simple table)
CREATE TABLE public.product_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  tag TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, tag)
);

-- Add SEO columns to products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS seo_title TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS seo_slug TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS seo_description TEXT DEFAULT '';

-- RLS for product_variations
ALTER TABLE public.product_variations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage product variations"
  ON public.product_variations FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view product variations"
  ON public.product_variations FOR SELECT
  TO authenticated, anon
  USING (true);

-- RLS for product_tags
ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage product tags"
  ON public.product_tags FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view product tags"
  ON public.product_tags FOR SELECT
  TO authenticated, anon
  USING (true);

-- Add variation_id to order_items for tracking which variation was ordered
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS variation_id UUID REFERENCES public.product_variations(id),
  ADD COLUMN IF NOT EXISTS variation_label TEXT DEFAULT '';
