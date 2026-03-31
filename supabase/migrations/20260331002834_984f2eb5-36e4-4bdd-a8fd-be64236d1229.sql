
-- How It Works settings table
CREATE TABLE public.how_it_works_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'How It Works',
  subtitle text NOT NULL DEFAULT 'Three simple steps to start earning rewards',
  bg_color text NOT NULL DEFAULT '#ffffff',
  bg_image_url text NOT NULL DEFAULT '',
  display_style text NOT NULL DEFAULT 'card',
  icon_size integer NOT NULL DEFAULT 24,
  icon_color text NOT NULL DEFAULT '#000000',
  title_font_size integer NOT NULL DEFAULT 18,
  title_color text NOT NULL DEFAULT '#000000',
  desc_font_size integer NOT NULL DEFAULT 14,
  desc_color text NOT NULL DEFAULT '#6b7280',
  card_bg_color text NOT NULL DEFAULT '#ffffff',
  show_step_numbers boolean NOT NULL DEFAULT true,
  step_number_color text NOT NULL DEFAULT '#e5e7eb',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- How It Works items table
CREATE TABLE public.how_it_works_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  icon text NOT NULL DEFAULT 'shield',
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.how_it_works_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.how_it_works_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for settings
CREATE POLICY "Admins can manage how_it_works_settings" ON public.how_it_works_settings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can read how_it_works_settings" ON public.how_it_works_settings FOR SELECT TO public USING (true);

-- RLS policies for items
CREATE POLICY "Admins can manage how_it_works_items" ON public.how_it_works_items FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can read active how_it_works_items" ON public.how_it_works_items FOR SELECT TO public USING (is_active = true);

-- Seed default settings
INSERT INTO public.how_it_works_settings (title, subtitle) VALUES ('How It Works', 'Three simple steps to start earning rewards');

-- Seed default items
INSERT INTO public.how_it_works_items (icon, title, description, sort_order) VALUES
  ('users', 'Create Your Account', 'Sign up for free and unlock exclusive distributor pricing on all products.', 0),
  ('shopping-bag', 'Shop & Share', 'Buy quality products and share your unique referral link with friends.', 1),
  ('gift', 'Earn Rewards', 'Earn generous rewards on every purchase from your network.', 2);
