
-- Footer settings table
CREATE TABLE public.footer_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  layout_sections integer NOT NULL DEFAULT 4,
  bg_color text NOT NULL DEFAULT '#1a1a2e',
  text_color text NOT NULL DEFAULT '#ffffff',
  link_color text NOT NULL DEFAULT '#cccccc',
  link_hover_color text NOT NULL DEFAULT '#ff6600',
  heading_color text NOT NULL DEFAULT '#ffffff',
  border_color text NOT NULL DEFAULT '#333333',
  show_visit_counter boolean NOT NULL DEFAULT false,
  visit_counter_label text NOT NULL DEFAULT 'Website Visits:',
  visit_counter_format text NOT NULL DEFAULT 'formatted',
  visit_counter_base integer NOT NULL DEFAULT 0,
  visit_counter_total integer NOT NULL DEFAULT 0,
  copyright_text text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.footer_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage footer settings" ON public.footer_settings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view footer settings" ON public.footer_settings FOR SELECT TO anon, authenticated USING (true);

-- Footer sections table
CREATE TABLE public.footer_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  heading text NOT NULL DEFAULT '',
  heading_color text NOT NULL DEFAULT '#ffffff',
  heading_font_size text NOT NULL DEFAULT '16px',
  width_percentage numeric NOT NULL DEFAULT 25,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.footer_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage footer sections" ON public.footer_sections FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view footer sections" ON public.footer_sections FOR SELECT TO anon, authenticated USING (true);

-- Footer menu items table
CREATE TABLE public.footer_menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid REFERENCES public.footer_sections(id) ON DELETE CASCADE NOT NULL,
  label text NOT NULL DEFAULT '',
  url text NOT NULL DEFAULT '/',
  open_in_new_tab boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.footer_menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage footer menu items" ON public.footer_menu_items FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view footer menu items" ON public.footer_menu_items FOR SELECT TO anon, authenticated USING (true);

-- Insert default footer settings
INSERT INTO public.footer_settings (layout_sections, bg_color, text_color, link_color, link_hover_color, heading_color) VALUES (4, '#1a1a2e', '#ffffff', '#cccccc', '#ff6600', '#ffffff');

-- Insert default sections
INSERT INTO public.footer_sections (heading, width_percentage, display_order) VALUES ('About', 25, 0), ('Platform', 25, 1), ('Company', 25, 2), ('Get Started', 25, 3);
