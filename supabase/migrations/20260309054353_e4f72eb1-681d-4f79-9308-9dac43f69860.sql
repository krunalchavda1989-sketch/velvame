
CREATE TABLE public.social_media_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.social_media_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage social media links"
  ON public.social_media_links FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active social media links"
  ON public.social_media_links FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Seed common platforms
INSERT INTO public.social_media_links (platform, url, icon, sort_order) VALUES
  ('Facebook', '', 'facebook', 0),
  ('Instagram', '', 'instagram', 1),
  ('Twitter', '', 'twitter', 2),
  ('YouTube', '', 'youtube', 3),
  ('LinkedIn', '', 'linkedin', 4),
  ('WhatsApp', '', 'whatsapp', 5);
