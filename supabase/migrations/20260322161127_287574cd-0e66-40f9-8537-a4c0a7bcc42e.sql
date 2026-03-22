
-- Contact form fields table
CREATE TABLE public.contact_form_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text',
  placeholder TEXT NOT NULL DEFAULT '',
  is_required BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_protected BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_form_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage contact form fields" ON public.contact_form_fields
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active contact form fields" ON public.contact_form_fields
  FOR SELECT TO anon, authenticated USING (is_active = true);

-- Insert default fields
INSERT INTO public.contact_form_fields (label, field_type, placeholder, is_required, is_protected, sort_order) VALUES
  ('First Name', 'text', 'Enter your first name', true, true, 0),
  ('Last Name', 'text', 'Enter your last name', true, true, 1),
  ('Email', 'email', 'Enter your email address', true, true, 2),
  ('Mobile No', 'phone', 'Enter your mobile number', true, true, 3),
  ('Subject', 'text', 'Enter subject', true, false, 4),
  ('Message', 'textarea', 'How can we help you?', true, false, 5);

-- Contact submissions table
CREATE TABLE public.contact_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submitted_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'new',
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage contact submissions" ON public.contact_submissions
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can insert contact submissions" ON public.contact_submissions
  FOR INSERT TO anon, authenticated WITH CHECK (true);
