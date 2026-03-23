
CREATE TABLE public.custom_code_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_css text NOT NULL DEFAULT '',
  custom_js text NOT NULL DEFAULT '',
  js_injection_position text NOT NULL DEFAULT 'body',
  css_enabled boolean NOT NULL DEFAULT false,
  js_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_code_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage custom code settings" ON public.custom_code_settings
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view custom code settings" ON public.custom_code_settings
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE TABLE public.custom_code_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'css',
  content text NOT NULL DEFAULT '',
  saved_at timestamp with time zone NOT NULL DEFAULT now(),
  saved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.custom_code_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage custom code history" ON public.custom_code_history
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.custom_code_settings (custom_css, custom_js) VALUES ('', '');
