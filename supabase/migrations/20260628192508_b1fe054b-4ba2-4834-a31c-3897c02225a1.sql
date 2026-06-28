CREATE TABLE public.review_platforms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name text NOT NULL,
  platform text NOT NULL,
  icon_url text,
  review_url text NOT NULL,
  rating numeric(2,1),
  review_count integer DEFAULT 0,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.review_platforms TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.review_platforms TO authenticated;
GRANT ALL ON public.review_platforms TO service_role;

ALTER TABLE public.review_platforms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active review platforms"
  ON public.review_platforms FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage review platforms"
  ON public.review_platforms FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.update_review_platforms_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_review_platforms_updated_at
BEFORE UPDATE ON public.review_platforms
FOR EACH ROW EXECUTE FUNCTION public.update_review_platforms_updated_at();