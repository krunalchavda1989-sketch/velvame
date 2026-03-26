
CREATE TABLE public.manual_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activated_by UUID NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  amount NUMERIC NOT NULL DEFAULT 0,
  screenshot_url TEXT,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.manual_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage manual subscriptions"
  ON public.manual_subscriptions FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own manual subscriptions"
  ON public.manual_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
