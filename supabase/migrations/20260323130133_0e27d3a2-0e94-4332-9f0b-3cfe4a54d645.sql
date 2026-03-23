
-- Create banners table
CREATE TABLE public.banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  desktop_image_url TEXT NOT NULL DEFAULT '',
  mobile_image_url TEXT NOT NULL DEFAULT '',
  destination_link TEXT NOT NULL DEFAULT '',
  link_target TEXT NOT NULL DEFAULT '_self',
  alt_text TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Admins can manage banners
CREATE POLICY "Admins can manage banners" ON public.banners
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view active banners
CREATE POLICY "Anyone can view active banners" ON public.banners
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- Create storage bucket for banner images
INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true);

-- Storage policies for banner images
CREATE POLICY "Admins can upload banner images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'banners' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update banner images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'banners' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete banner images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'banners' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view banner images" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'banners');
