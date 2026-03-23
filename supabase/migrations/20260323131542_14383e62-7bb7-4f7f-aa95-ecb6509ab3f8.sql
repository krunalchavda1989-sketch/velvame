
-- Banner settings table for global slider configuration
CREATE TABLE public.banner_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  autoplay_speed integer NOT NULL DEFAULT 4000,
  transition_speed integer NOT NULL DEFAULT 600,
  transition_effect text NOT NULL DEFAULT 'slide',
  easing text NOT NULL DEFAULT 'ease-in-out',
  direction text NOT NULL DEFAULT 'horizontal',
  loop_enabled boolean NOT NULL DEFAULT true,
  pause_on_hover boolean NOT NULL DEFAULT true,
  show_arrows boolean NOT NULL DEFAULT true,
  show_dots boolean NOT NULL DEFAULT true,
  default_desktop_mode text NOT NULL DEFAULT 'cover',
  default_mobile_mode text NOT NULL DEFAULT 'cover',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.banner_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage banner settings" ON public.banner_settings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view banner settings" ON public.banner_settings FOR SELECT TO anon, authenticated USING (true);

-- Insert default row
INSERT INTO public.banner_settings (id) VALUES (gen_random_uuid());

-- Add per-banner override columns
ALTER TABLE public.banners
  ADD COLUMN desktop_display_mode text NOT NULL DEFAULT '',
  ADD COLUMN mobile_display_mode text NOT NULL DEFAULT '',
  ADD COLUMN custom_duration integer;
