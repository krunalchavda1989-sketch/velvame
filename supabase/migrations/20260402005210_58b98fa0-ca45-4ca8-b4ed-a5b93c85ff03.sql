INSERT INTO public.site_settings (key, value, updated_at)
VALUES ('force_bank_details', 'false'::jsonb, now())
ON CONFLICT (key) DO NOTHING;