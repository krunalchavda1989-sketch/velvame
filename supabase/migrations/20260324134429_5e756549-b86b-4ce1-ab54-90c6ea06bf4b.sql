
-- Add link_target to announcements
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS link_target text NOT NULL DEFAULT '_self';

-- Create announcement_bar_settings table
CREATE TABLE IF NOT EXISTS public.announcement_bar_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transition_effect text NOT NULL DEFAULT 'slide',
  display_duration integer NOT NULL DEFAULT 3000,
  transition_speed integer NOT NULL DEFAULT 500,
  auto_play boolean NOT NULL DEFAULT true,
  loop_enabled boolean NOT NULL DEFAULT true,
  pause_on_hover boolean NOT NULL DEFAULT true,
  show_arrows boolean NOT NULL DEFAULT false,
  show_dots boolean NOT NULL DEFAULT false,
  swipe_mobile boolean NOT NULL DEFAULT true,
  bg_color text NOT NULL DEFAULT '#000000',
  text_color text NOT NULL DEFAULT '#ffffff',
  font_size integer NOT NULL DEFAULT 14,
  font_weight text NOT NULL DEFAULT 'medium',
  bar_height integer NOT NULL DEFAULT 40,
  text_align text NOT NULL DEFAULT 'center',
  bar_position text NOT NULL DEFAULT 'above',
  show_close_button boolean NOT NULL DEFAULT true,
  show_on_mobile boolean NOT NULL DEFAULT true,
  show_on_desktop boolean NOT NULL DEFAULT true,
  is_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.announcement_bar_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage announcement bar settings"
ON public.announcement_bar_settings FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view announcement bar settings"
ON public.announcement_bar_settings FOR SELECT TO anon, authenticated
USING (true);

-- Insert default settings row
INSERT INTO public.announcement_bar_settings (id) VALUES (gen_random_uuid());
