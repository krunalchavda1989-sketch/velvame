
-- Store newsletter section display settings (bg color etc.)
CREATE TABLE public.newsletter_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bg_color TEXT NOT NULL DEFAULT '#e8e0f0',
  heading TEXT NOT NULL DEFAULT 'Stay in the Loop',
  subtext TEXT NOT NULL DEFAULT 'No spam. Only useful tips, exclusive offers, and friendly reminders delivered to your inbox.',
  button_text TEXT NOT NULL DEFAULT 'Sign up',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default row
INSERT INTO public.newsletter_settings (id) VALUES (gen_random_uuid());

-- Allow public read
ALTER TABLE public.newsletter_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read newsletter settings" ON public.newsletter_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update newsletter settings" ON public.newsletter_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
