
CREATE TABLE public.breadcrumb_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  background_type text NOT NULL DEFAULT 'solid',
  bg_color text NOT NULL DEFAULT '#1a1a2e',
  gradient_type text NOT NULL DEFAULT 'linear',
  gradient_direction text NOT NULL DEFAULT 'to right',
  gradient_stops jsonb NOT NULL DEFAULT '[{"color":"#1a1a2e","position":0},{"color":"#ff6600","position":100}]'::jsonb,
  bg_image_url text NOT NULL DEFAULT '',
  bg_position text NOT NULL DEFAULT 'center',
  bg_size text NOT NULL DEFAULT 'cover',
  bg_repeat text NOT NULL DEFAULT 'no-repeat',
  overlay_enabled boolean NOT NULL DEFAULT false,
  overlay_color text NOT NULL DEFAULT '#000000',
  overlay_opacity integer NOT NULL DEFAULT 40,
  section_height text NOT NULL DEFAULT 'medium',
  custom_height integer NOT NULL DEFAULT 100,
  title_font_size integer NOT NULL DEFAULT 32,
  title_font_weight text NOT NULL DEFAULT 'bold',
  title_color text NOT NULL DEFAULT '#ffffff',
  title_transform text NOT NULL DEFAULT 'none',
  title_letter_spacing integer NOT NULL DEFAULT 0,
  crumb_font_size integer NOT NULL DEFAULT 14,
  crumb_font_weight text NOT NULL DEFAULT 'normal',
  crumb_active_color text NOT NULL DEFAULT '#ffffff',
  crumb_inactive_color text NOT NULL DEFAULT '#cccccc',
  separator_symbol text NOT NULL DEFAULT '>',
  separator_color text NOT NULL DEFAULT '#ffffff',
  text_alignment text NOT NULL DEFAULT 'left',
  vertical_position text NOT NULL DEFAULT 'middle',
  visibility_settings jsonb NOT NULL DEFAULT '{"cms":true,"product":true,"category":true,"about":true,"contact":true,"blog":true,"home":false,"checkout":false,"login":false}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.breadcrumb_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage breadcrumb settings" ON public.breadcrumb_settings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view breadcrumb settings" ON public.breadcrumb_settings FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.breadcrumb_settings (id) VALUES (gen_random_uuid());
