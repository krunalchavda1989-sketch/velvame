
-- Brand Settings table (single row)
CREATE TABLE public.brand_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name text NOT NULL DEFAULT 'NexaMarket',
  logo_url text DEFAULT '',
  tagline text DEFAULT '',
  address text DEFAULT '',
  phone text DEFAULT '',
  email text DEFAULT '',
  website text DEFAULT '',
  gst_number text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.brand_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage brand settings" ON public.brand_settings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view brand settings" ON public.brand_settings FOR SELECT TO anon, authenticated USING (true);

-- Insert default row
INSERT INTO public.brand_settings (brand_name) VALUES ('NexaMarket');

-- Title Roadmap table
CREATE TABLE public.title_roadmap (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_name text NOT NULL,
  required_referrals integer NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  badge_color text DEFAULT '#3b82f6',
  description text DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.title_roadmap ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage title roadmap" ON public.title_roadmap FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view title roadmap" ON public.title_roadmap FOR SELECT TO anon, authenticated USING (true);

-- Seed default titles
INSERT INTO public.title_roadmap (title_name, required_referrals, sort_order, badge_color) VALUES
  ('Member', 0, 0, '#6b7280'),
  ('Silver', 1, 1, '#9ca3af'),
  ('Gold', 3, 2, '#eab308'),
  ('Platinum', 6, 3, '#a855f7'),
  ('Diamond', 10, 4, '#3b82f6'),
  ('Crown', 20, 5, '#f59e0b');

-- Awards/Rewards table
CREATE TABLE public.awards_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_name text NOT NULL,
  reward_type text NOT NULL DEFAULT 'cash',
  cash_amount numeric DEFAULT 0,
  gift_name text DEFAULT '',
  gift_description text DEFAULT '',
  gift_image_url text DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.awards_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage awards" ON public.awards_rewards FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view awards" ON public.awards_rewards FOR SELECT TO anon, authenticated USING (true);

-- Monthly Offers table
CREATE TABLE public.monthly_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  image_url text DEFAULT '',
  offer_type text NOT NULL DEFAULT 'banner',
  discount_percentage numeric DEFAULT 0,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date NOT NULL DEFAULT (CURRENT_DATE + interval '30 days')::date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.monthly_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage offers" ON public.monthly_offers FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view active offers" ON public.monthly_offers FOR SELECT TO anon, authenticated USING (true);

-- Coupons table
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL DEFAULT 'percentage',
  discount_value numeric NOT NULL DEFAULT 0,
  min_order_amount numeric DEFAULT 0,
  max_discount_amount numeric DEFAULT 0,
  max_uses integer DEFAULT 0,
  used_count integer NOT NULL DEFAULT 0,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date NOT NULL DEFAULT (CURRENT_DATE + interval '30 days')::date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage coupons" ON public.coupons FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view active coupons" ON public.coupons FOR SELECT TO anon, authenticated USING (is_active = true);

-- Commission levels master table
CREATE TABLE public.commission_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level integer NOT NULL UNIQUE,
  commission_type text NOT NULL DEFAULT 'level',
  rate numeric NOT NULL DEFAULT 0,
  min_referrals integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.commission_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage commission levels" ON public.commission_levels FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view commission levels" ON public.commission_levels FOR SELECT TO anon, authenticated USING (true);

-- Seed default commission levels
INSERT INTO public.commission_levels (level, commission_type, rate, min_referrals) VALUES
  (1, 'level', 5, 1),
  (2, 'level', 4.5, 3),
  (3, 'level', 4, 3),
  (4, 'level', 3.5, 3),
  (5, 'level', 3, 3),
  (6, 'level', 2.5, 6),
  (7, 'level', 2, 6),
  (8, 'level', 1.5, 6),
  (9, 'level', 1, 6);

INSERT INTO public.commission_levels (level, commission_type, rate, min_referrals) VALUES
  (101, 'repurchase', 3, 1),
  (102, 'repurchase', 2, 1),
  (103, 'repurchase', 1, 1);
