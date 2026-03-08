
CREATE TABLE public.whatsapp_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'whatsapp_business',
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  api_key TEXT NOT NULL DEFAULT '',
  phone_number_id TEXT NOT NULL DEFAULT '',
  business_account_id TEXT NOT NULL DEFAULT '',
  webhook_verify_token TEXT NOT NULL DEFAULT '',
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  order_updates_enabled BOOLEAN NOT NULL DEFAULT false,
  welcome_msg_enabled BOOLEAN NOT NULL DEFAULT false,
  abandoned_cart_enabled BOOLEAN NOT NULL DEFAULT false,
  support_chat_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage whatsapp settings"
  ON public.whatsapp_settings FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view whatsapp settings"
  ON public.whatsapp_settings FOR SELECT
  TO authenticated, anon
  USING (true);
