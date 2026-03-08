
CREATE TABLE public.product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text DEFAULT '',
  image_url text DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage categories" ON public.product_categories
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view categories" ON public.product_categories
  FOR SELECT TO anon, authenticated
  USING (true);

-- Seed existing categories
INSERT INTO public.product_categories (name, sort_order) VALUES
  ('General', 0),
  ('Health', 1),
  ('Beauty', 2),
  ('Nutrition', 3),
  ('Personal Care', 4),
  ('Wellness', 5),
  ('Supplements', 6);
