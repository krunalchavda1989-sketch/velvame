ALTER TABLE public.binary_settings ADD COLUMN min_monthly_purchase numeric NOT NULL DEFAULT 1000;

UPDATE public.binary_settings SET min_monthly_purchase = 1000;