-- Create storage bucket for campaign media
INSERT INTO storage.buckets (id, name, public) VALUES ('campaign-media', 'campaign-media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow admins to upload to campaign-media
CREATE POLICY "Admins can upload campaign media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'campaign-media' AND
  public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins can delete campaign media"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'campaign-media' AND
  public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Anyone can view campaign media"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'campaign-media');

-- Add media columns to sms_campaigns
ALTER TABLE public.sms_campaigns
  ADD COLUMN IF NOT EXISTS media_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS link_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS link_text TEXT DEFAULT '';