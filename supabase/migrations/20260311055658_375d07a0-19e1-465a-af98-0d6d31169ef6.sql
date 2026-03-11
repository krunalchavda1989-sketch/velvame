CREATE OR REPLACE FUNCTION public.generate_order_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _prefix TEXT;
  _next INTEGER;
  _padding INTEGER;
  _settings_id UUID;
BEGIN
  -- Get the settings row id first
  SELECT id INTO _settings_id FROM public.order_number_settings LIMIT 1;

  -- If no settings row exists, use defaults
  IF _settings_id IS NULL THEN
    _prefix := 'ORD';
    _next := 1;
    _padding := 4;
  ELSE
    -- Atomically get and increment with WHERE clause (required by pg_safeupdate)
    UPDATE public.order_number_settings
    SET next_number = next_number + 1, updated_at = now()
    WHERE id = _settings_id
    RETURNING prefix, next_number - 1, padding
    INTO _prefix, _next, _padding;
  END IF;

  NEW.order_number := _prefix || LPAD(_next::TEXT, _padding, '0');
  RETURN NEW;
END;
$function$