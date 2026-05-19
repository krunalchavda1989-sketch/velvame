
-- SEO settings: flexible key/value JSONB store
CREATE TABLE public.seo_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "seo_settings public read"
  ON public.seo_settings FOR SELECT
  USING (true);

CREATE POLICY "seo_settings admin write"
  ON public.seo_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER seo_settings_updated_at
  BEFORE UPDATE ON public.seo_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SEO redirects
CREATE TABLE public.seo_redirects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_path text UNIQUE NOT NULL,
  to_path text NOT NULL,
  status_code int NOT NULL DEFAULT 301,
  is_active boolean NOT NULL DEFAULT true,
  hits int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_redirects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "seo_redirects public read active"
  ON public.seo_redirects FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "seo_redirects admin write"
  ON public.seo_redirects FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER seo_redirects_updated_at
  BEFORE UPDATE ON public.seo_redirects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default global config
INSERT INTO public.seo_settings (key, config) VALUES
  ('global', jsonb_build_object(
    'site_name', 'Velvame',
    'separator', ' — ',
    'default_title', 'Velvame — Premium Health, Wellness & Rewards',
    'default_description', 'Discover premium health & wellness products at exclusive member prices. Share with friends and earn generous rewards on every purchase.',
    'default_og_image', '',
    'twitter_handle', '@Velvame',
    'twitter_card', 'summary_large_image',
    'locale', 'en_IN',
    'base_url', 'https://velvame.lovable.app'
  )),
  ('verification', jsonb_build_object(
    'google', 'aU2t6E6AfmzPhYkXuvTPjt7b6MO0xu3v17vIHt8Wt2U',
    'bing', '',
    'yandex', '',
    'pinterest', '',
    'facebook', ''
  )),
  ('schema', jsonb_build_object(
    'organization_enabled', true,
    'website_enabled', true,
    'breadcrumb_enabled', true,
    'product_enabled', true,
    'faq_enabled', true,
    'organization', jsonb_build_object(
      'name', 'Velvame',
      'logo', '',
      'email', '',
      'phone', '',
      'address', '',
      'same_as', '[]'::jsonb
    )
  )),
  ('robots', jsonb_build_object(
    'content', E'User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /dashboard\nDisallow: /checkout\nDisallow: /order-success\n\nSitemap: https://velvame.lovable.app/sitemap.xml\n'
  )),
  ('sitemap', jsonb_build_object(
    'include_products', true,
    'include_categories', true,
    'include_cms_pages', true,
    'include_static', true
  )),
  ('routes', jsonb_build_object(
    'home', jsonb_build_object('title','%site_name% — Premium Health, Wellness & Rewards','description','Discover premium health & wellness products at exclusive member prices.','noindex',false),
    'shop', jsonb_build_object('title','Shop — %site_name%','description','Browse our full catalog of wellness products.','noindex',false),
    'offers', jsonb_build_object('title','Special Offers — %site_name%','description','Limited-time deals on member-favorite products.','noindex',false),
    'about', jsonb_build_object('title','About — %site_name%','description','Learn about Velvame and our mission.','noindex',false),
    'contact', jsonb_build_object('title','Contact — %site_name%','description','Get in touch with the Velvame team.','noindex',false),
    'faq', jsonb_build_object('title','FAQ — %site_name%','description','Common questions, answered.','noindex',false),
    'product', jsonb_build_object('title','%product_name% — %site_name%','description','%product_description%','noindex',false),
    'category', jsonb_build_object('title','%category_name% — %site_name%','description','Shop %category_name% products at %site_name%.','noindex',false)
  ));
