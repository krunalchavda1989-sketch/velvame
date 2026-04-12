
-- Create reels_videos table
CREATE TABLE public.reels_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  video_url TEXT NOT NULL DEFAULT '',
  platform TEXT NOT NULL DEFAULT 'youtube',
  video_id TEXT NOT NULL DEFAULT '',
  thumbnail_url TEXT NOT NULL DEFAULT '',
  custom_thumbnail_url TEXT NOT NULL DEFAULT '',
  destination_link TEXT NOT NULL DEFAULT '',
  link_target TEXT NOT NULL DEFAULT '_blank',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reels_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active reels videos"
  ON public.reels_videos FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage reels videos"
  ON public.reels_videos FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create reels_settings table
CREATE TABLE public.reels_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_title TEXT NOT NULL DEFAULT 'Our Reels',
  section_subtitle TEXT NOT NULL DEFAULT 'Watch our latest videos',
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  show_platform_badge BOOLEAN NOT NULL DEFAULT true,
  show_title BOOLEAN NOT NULL DEFAULT true,
  show_description BOOLEAN NOT NULL DEFAULT true,
  cards_desktop INTEGER NOT NULL DEFAULT 5,
  cards_mobile INTEGER NOT NULL DEFAULT 2,
  show_arrows BOOLEAN NOT NULL DEFAULT true,
  enable_swipe BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reels_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reels settings"
  ON public.reels_settings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage reels settings"
  ON public.reels_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default settings
INSERT INTO public.reels_settings (section_title, section_subtitle) VALUES ('Our Reels', 'Watch our latest videos');

-- Add reels to landing section order
INSERT INTO public.landing_section_order (section_key, section_label, sort_order, is_visible)
VALUES ('reels', 'Reels / Video Slider', 12, true);
