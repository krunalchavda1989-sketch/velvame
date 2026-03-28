
-- Add image_url column to title_roadmap
ALTER TABLE public.title_roadmap ADD COLUMN IF NOT EXISTS image_url text DEFAULT '';

-- Create storage bucket for title images
INSERT INTO storage.buckets (id, name, public) VALUES ('title-images', 'title-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Anyone can view title images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'title-images');

-- Allow admin upload/delete
CREATE POLICY "Admins can manage title images" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'title-images' AND public.has_role(auth.uid(), 'admin')) WITH CHECK (bucket_id = 'title-images' AND public.has_role(auth.uid(), 'admin'));

-- Create function to count all active downline members (recursive)
CREATE OR REPLACE FUNCTION public.get_active_downline_count(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH RECURSIVE downline AS (
    SELECT id FROM public.profiles
    WHERE user_id = _user_id
    
    UNION ALL
    
    SELECT p.id FROM public.profiles p
    INNER JOIN downline d ON p.referred_by = d.id
  )
  SELECT COALESCE(COUNT(*)::integer - 1, 0)
  FROM downline d2
  INNER JOIN public.profiles p2 ON p2.id = d2.id
  WHERE p2.subscription_paid = true
    AND p2.user_id != _user_id;
$$;
