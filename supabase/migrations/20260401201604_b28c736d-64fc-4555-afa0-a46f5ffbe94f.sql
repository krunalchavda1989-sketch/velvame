
-- Drop the overly permissive upload policy
DROP POLICY IF EXISTS "Authenticated users can upload review images" ON storage.objects;

-- Create user-scoped upload policy
CREATE POLICY "Users upload own review images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'review-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
