
INSERT INTO storage.buckets (id, name, public) VALUES ('reel-thumbnails', 'reel-thumbnails', true);

CREATE POLICY "Anyone can view reel thumbnails" ON storage.objects FOR SELECT USING (bucket_id = 'reel-thumbnails');

CREATE POLICY "Authenticated users can upload reel thumbnails" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'reel-thumbnails');

CREATE POLICY "Authenticated users can update reel thumbnails" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'reel-thumbnails');

CREATE POLICY "Authenticated users can delete reel thumbnails" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'reel-thumbnails');
