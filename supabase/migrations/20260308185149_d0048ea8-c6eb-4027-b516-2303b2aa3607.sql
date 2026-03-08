
-- Add order_number column to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number TEXT;

-- Create order number settings table
CREATE TABLE public.order_number_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prefix TEXT NOT NULL DEFAULT 'ORD',
  next_number INTEGER NOT NULL DEFAULT 1,
  padding INTEGER NOT NULL DEFAULT 4,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_number_settings ENABLE ROW LEVEL SECURITY;

-- Admins can manage
CREATE POLICY "Admins can manage order number settings"
  ON public.order_number_settings FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Anyone can read (needed for display)
CREATE POLICY "Anyone can view order number settings"
  ON public.order_number_settings FOR SELECT
  TO authenticated
  USING (true);

-- Insert default row
INSERT INTO public.order_number_settings (prefix, next_number, padding)
VALUES ('ORD', 1, 4);

-- Create function to generate order number atomically
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _prefix TEXT;
  _next INTEGER;
  _padding INTEGER;
BEGIN
  -- Atomically get and increment
  UPDATE public.order_number_settings
  SET next_number = next_number + 1, updated_at = now()
  RETURNING prefix, next_number - 1, padding
  INTO _prefix, _next, _padding;

  -- If no settings row exists, use defaults
  IF _prefix IS NULL THEN
    _prefix := 'ORD';
    _next := 1;
    _padding := 4;
  END IF;

  NEW.order_number := _prefix || LPAD(_next::TEXT, _padding, '0');
  RETURN NEW;
END;
$$;

-- Create trigger on orders table
CREATE TRIGGER trg_generate_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL)
  EXECUTE FUNCTION public.generate_order_number();

-- Backfill existing orders without order_number
DO $$
DECLARE
  r RECORD;
  _prefix TEXT;
  _next INTEGER;
  _padding INTEGER;
  _count INTEGER := 0;
BEGIN
  SELECT prefix, next_number, padding INTO _prefix, _next, _padding
  FROM public.order_number_settings LIMIT 1;

  FOR r IN SELECT id FROM public.orders WHERE order_number IS NULL ORDER BY created_at ASC
  LOOP
    UPDATE public.orders SET order_number = _prefix || LPAD((_next + _count)::TEXT, _padding, '0') WHERE id = r.id;
    _count := _count + 1;
  END LOOP;

  -- Update next_number
  IF _count > 0 THEN
    UPDATE public.order_number_settings SET next_number = _next + _count;
  END IF;
END;
$$;
