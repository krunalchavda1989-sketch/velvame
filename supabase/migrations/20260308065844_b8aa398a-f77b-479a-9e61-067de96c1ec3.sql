
CREATE TABLE public.product_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- Everyone can view product images
CREATE POLICY "Product images viewable by all"
  ON public.product_images
  FOR SELECT
  USING (true);

-- Admins can manage product images
CREATE POLICY "Admins can manage product images"
  ON public.product_images
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));
