
CREATE TABLE public.sms_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'msg91',
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  api_key TEXT NOT NULL DEFAULT '',
  sender_id TEXT NOT NULL DEFAULT '',
  template_id TEXT NOT NULL DEFAULT '',
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  otp_enabled BOOLEAN NOT NULL DEFAULT false,
  order_updates_enabled BOOLEAN NOT NULL DEFAULT false,
  welcome_sms_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sms_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage sms settings"
  ON public.sms_settings FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view sms settings"
  ON public.sms_settings FOR SELECT
  TO authenticated, anon
  USING (true);
