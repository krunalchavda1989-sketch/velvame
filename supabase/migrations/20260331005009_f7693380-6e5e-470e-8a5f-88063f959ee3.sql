
CREATE TABLE public.landing_section_order (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL UNIQUE,
  section_label text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.landing_section_order ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage landing_section_order"
  ON public.landing_section_order FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can read landing_section_order"
  ON public.landing_section_order FOR SELECT
  TO public
  USING (true);

-- Seed default order
INSERT INTO public.landing_section_order (section_key, section_label, sort_order) VALUES
  ('banner', 'Banner', 0),
  ('hero_stats', 'Hero Stats', 1),
  ('category', 'Category Section', 2),
  ('marquee_top', 'Scrolling Marquee', 3),
  ('monthly_offers', 'Monthly Offers', 4),
  ('why_choose', 'Why Choose', 5),
  ('featured_sections', 'Featured Sections', 6),
  ('how_it_works', 'How It Works', 7),
  ('testimonials', 'Testimonials', 8),
  ('marquee_bottom', 'Scrolling Marquee (Bottom)', 9),
  ('newsletter', 'Newsletter', 10),
  ('footer', 'Footer', 11);
