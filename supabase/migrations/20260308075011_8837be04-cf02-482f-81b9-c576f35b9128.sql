
-- CMS pages content table
CREATE TABLE public.pages_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug text NOT NULL UNIQUE,
  title text NOT NULL DEFAULT '',
  subtitle text DEFAULT '',
  content jsonb NOT NULL DEFAULT '{}',
  meta_title text DEFAULT '',
  meta_description text DEFAULT '',
  is_published boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pages_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage pages" ON public.pages_content FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view published pages" ON public.pages_content FOR SELECT TO anon, authenticated USING (is_published = true);

-- Seed about, contact pages
INSERT INTO public.pages_content (page_slug, title, subtitle, content) VALUES
  ('about', 'About Us', 'Our Story & Mission', '{"hero_image":"","mission":"We are committed to empowering individuals through a revolutionary network marketing platform that combines premium products with a transparent 9-level commission structure.","vision":"To become India''s most trusted MLM platform where every member can build sustainable income through genuine product sales and ethical network building.","values":["Transparency","Quality Products","Fair Commissions","Community First"],"team_members":[]}'),
  ('contact', 'Contact Us', 'Get in Touch', '{"email":"support@nexamlm.com","phone":"+91 98765 43210","address":"123 Business Park, Mumbai, Maharashtra 400001","map_embed":"","working_hours":"Mon-Sat: 10 AM - 7 PM"}');

-- FAQ table
CREATE TABLE public.faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text DEFAULT 'General',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage faqs" ON public.faqs FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view faqs" ON public.faqs FOR SELECT TO anon, authenticated USING (is_active = true);

-- Seed FAQs
INSERT INTO public.faqs (question, answer, category, sort_order) VALUES
  ('What is the joining fee?', 'The one-time lifetime membership fee is ₹2,800 which gives you access to all products at distributor prices and the ability to earn commissions across 9 levels.', 'Membership', 0),
  ('How does the commission system work?', 'You earn commissions when anyone in your 9-level downline makes a purchase. Level 1 pays 5%, Level 2 pays 4.5%, and so on down to Level 9 at 1%.', 'Commission', 1),
  ('How do I withdraw my earnings?', 'Go to Dashboard → Wallet → Request Withdrawal. Enter the amount and your UPI ID or bank details. Withdrawals are processed within 24-48 hours.', 'Payments', 2),
  ('Is there a minimum purchase requirement?', 'No. Once you are a member, you can purchase any product at distributor prices. There is no forced purchase or monthly minimum.', 'Products', 3),
  ('Can I return products?', 'Yes, we offer a 7-day return policy on all unused products in original packaging. Contact support to initiate a return.', 'Products', 4),
  ('What qualifications are needed for higher levels?', 'Level 1 requires 1 direct referral, Levels 2-5 require 3 direct referrals, and Levels 6-9 require 6 direct referrals.', 'Commission', 5),
  ('How do I track my team?', 'Go to Dashboard → My Team to see all direct referrals, or Dashboard → Genealogy to view your complete downline tree up to 9 levels.', 'Network', 6),
  ('Is this a legal business?', 'Yes. We are a product-based direct selling company. All commissions are generated from actual product sales, not recruitment alone.', 'General', 7);
