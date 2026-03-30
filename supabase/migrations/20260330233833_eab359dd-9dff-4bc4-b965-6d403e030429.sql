
-- Featured product sections table
CREATE TABLE public.featured_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  selection_type text NOT NULL DEFAULT 'manual', -- 'manual' or 'category'
  category_filter text DEFAULT '',
  bg_color text NOT NULL DEFAULT '#ffffff',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Junction table for manual product selection
CREATE TABLE public.featured_section_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES public.featured_sections(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(section_id, product_id)
);

-- RLS
ALTER TABLE public.featured_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_section_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active featured sections" ON public.featured_sections FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Admins can manage featured sections" ON public.featured_sections FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view featured section products" ON public.featured_section_products FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage featured section products" ON public.featured_section_products FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
