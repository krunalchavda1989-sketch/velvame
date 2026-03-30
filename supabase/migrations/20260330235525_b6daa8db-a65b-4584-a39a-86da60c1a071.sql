
CREATE TABLE public.category_section_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'Shop by Category',
  subtitle text NOT NULL DEFAULT 'Browse our curated collections',
  bg_color text NOT NULL DEFAULT '#ffffff',
  bg_image_url text NOT NULL DEFAULT '',
  display_count integer NOT NULL DEFAULT 6,
  image_style text NOT NULL DEFAULT 'rounded',
  hover_effect text NOT NULL DEFAULT 'zoom',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.category_section_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read category section settings"
  ON public.category_section_settings FOR SELECT TO public USING (true);

CREATE POLICY "Admins can manage category section settings"
  ON public.category_section_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.category_section_settings (title, subtitle, bg_color, display_count, image_style, hover_effect)
VALUES ('Shop by Category', 'Browse our curated collections', '#ffffff', 6, 'rounded', 'zoom');
