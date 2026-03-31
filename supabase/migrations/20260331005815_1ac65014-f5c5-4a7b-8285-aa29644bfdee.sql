
CREATE TABLE public.marquee_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  bg_color text NOT NULL DEFAULT '#000000',
  text_color text NOT NULL DEFAULT '#ffffff',
  font_family text NOT NULL DEFAULT 'inherit',
  font_size integer NOT NULL DEFAULT 14,
  font_weight text NOT NULL DEFAULT 'medium',
  speed integer NOT NULL DEFAULT 20,
  height integer NOT NULL DEFAULT 40,
  direction text NOT NULL DEFAULT 'left',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.marquee_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marquee_id uuid NOT NULL REFERENCES public.marquee_sections(id) ON DELETE CASCADE,
  text text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.marquee_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marquee_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage marquee_sections"
  ON public.marquee_sections FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can read active marquee_sections"
  ON public.marquee_sections FOR SELECT TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage marquee_items"
  ON public.marquee_items FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can read active marquee_items"
  ON public.marquee_items FOR SELECT TO public
  USING (is_active = true);

-- Update landing_section_order: rename marquee entries
UPDATE public.landing_section_order SET section_label = 'Scrolling Marquee (Top)' WHERE section_key = 'marquee_top';
UPDATE public.landing_section_order SET section_label = 'Scrolling Marquee (Bottom)' WHERE section_key = 'marquee_bottom';
