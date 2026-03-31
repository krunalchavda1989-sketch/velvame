
-- Settings table for Why Choose section
CREATE TABLE public.why_choose_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'Why Choose Our Products',
  subtitle text NOT NULL DEFAULT 'Quality you can trust, rewards you''ll love',
  bg_color text NOT NULL DEFAULT '#faf8f5',
  bg_image_url text NOT NULL DEFAULT '',
  display_style text NOT NULL DEFAULT 'minimal',
  icon_size integer NOT NULL DEFAULT 24,
  icon_color text NOT NULL DEFAULT '#000000',
  title_font_size integer NOT NULL DEFAULT 14,
  title_color text NOT NULL DEFAULT '#000000',
  desc_font_size integer NOT NULL DEFAULT 12,
  desc_color text NOT NULL DEFAULT '#6b7280',
  card_bg_color text NOT NULL DEFAULT '#ffffff',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Items table for individual feature cards
CREATE TABLE public.why_choose_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  icon text NOT NULL DEFAULT 'shield',
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.why_choose_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.why_choose_items ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage why_choose_settings" ON public.why_choose_settings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can read why_choose_settings" ON public.why_choose_settings FOR SELECT TO public USING (true);

CREATE POLICY "Admins can manage why_choose_items" ON public.why_choose_items FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can read active why_choose_items" ON public.why_choose_items FOR SELECT TO public USING (is_active = true);

-- Seed default settings
INSERT INTO public.why_choose_settings (title, subtitle) VALUES ('Why Choose Our Products', 'Quality you can trust, rewards you''ll love');

-- Seed default items
INSERT INTO public.why_choose_items (icon, title, description, sort_order) VALUES
  ('truck', 'Fast Delivery', 'Quick & reliable shipping straight to your doorstep.', 0),
  ('eye', 'Transparency', 'Honest ingredients and clear product details you can trust.', 1),
  ('badge-check', 'Affordable', 'Premium products at prices that suit every budget.', 2),
  ('map-pin', 'Trusted Worldwide', 'Trusted by customers across multiple countries.', 3);
