
-- Inventory update logs table
CREATE TABLE public.inventory_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  previous_stock INTEGER NOT NULL DEFAULT 0,
  new_stock INTEGER NOT NULL DEFAULT 0,
  change_quantity INTEGER NOT NULL DEFAULT 0,
  change_type TEXT NOT NULL DEFAULT 'manual',
  note TEXT DEFAULT '',
  changed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage inventory logs" ON public.inventory_logs
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger to auto-log stock changes on products table
CREATE OR REPLACE FUNCTION public.log_product_stock_change()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.stock IS DISTINCT FROM NEW.stock THEN
    INSERT INTO public.inventory_logs (product_id, previous_stock, new_stock, change_quantity, change_type, changed_by)
    VALUES (
      NEW.id,
      OLD.stock,
      NEW.stock,
      NEW.stock - OLD.stock,
      'product_edit',
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_product_stock_change
  AFTER UPDATE OF stock ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.log_product_stock_change();
