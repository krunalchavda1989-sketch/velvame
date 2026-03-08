
CREATE TABLE public.nav_menus (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  href TEXT NOT NULL DEFAULT '/',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  parent_id UUID REFERENCES public.nav_menus(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.nav_menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage nav menus" ON public.nav_menus FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active nav menus" ON public.nav_menus FOR SELECT USING (is_active = true);

INSERT INTO public.nav_menus (label, href, sort_order) VALUES
  ('Home', '/', 0),
  ('Shop', '/shop', 1),
  ('About', '/about', 2),
  ('FAQ', '/faq', 3),
  ('Contact', '/contact', 4);
