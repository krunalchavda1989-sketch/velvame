
ALTER TABLE public.sms_campaigns
  ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'sms';
