
-- Add seo_keywords column to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seo_keywords text NOT NULL DEFAULT '';

-- Create product_reviews table
CREATE TABLE public.product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  order_id uuid REFERENCES public.orders(id),
  reviewer_name text NOT NULL DEFAULT '',
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_title text NOT NULL DEFAULT '',
  review_body text NOT NULL DEFAULT '',
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  is_verified_purchase boolean NOT NULL DEFAULT false,
  is_bulk_uploaded boolean NOT NULL DEFAULT false,
  admin_note text DEFAULT '',
  review_date timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(product_id, user_id)
);

-- Enable RLS
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Admins can manage all reviews
CREATE POLICY "Admins can manage reviews" ON public.product_reviews
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Anyone can view approved reviews
CREATE POLICY "Anyone can view approved reviews" ON public.product_reviews
  FOR SELECT TO anon, authenticated
  USING (status = 'approved');

-- Authenticated users can insert their own reviews
CREATE POLICY "Users can insert own reviews" ON public.product_reviews
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own reviews (any status)
CREATE POLICY "Users can view own reviews" ON public.product_reviews
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Create storage bucket for review images
INSERT INTO storage.buckets (id, name, public) VALUES ('review-images', 'review-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for review images
CREATE POLICY "Anyone can view review images" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'review-images');

CREATE POLICY "Authenticated users can upload review images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'review-images');

CREATE POLICY "Admins can delete review images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'review-images' AND public.has_role(auth.uid(), 'admin'));

-- Enable realtime for product_reviews
ALTER PUBLICATION supabase_realtime ADD TABLE public.product_reviews;
