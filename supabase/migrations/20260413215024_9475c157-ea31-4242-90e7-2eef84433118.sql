
INSERT INTO storage.buckets (id, name, public) VALUES ('popup-images', 'popup-images', true);

CREATE POLICY "Popup images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'popup-images');

CREATE POLICY "Authenticated users can upload popup images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'popup-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update popup images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'popup-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete popup images"
ON storage.objects FOR DELETE
USING (bucket_id = 'popup-images' AND auth.role() = 'authenticated');
