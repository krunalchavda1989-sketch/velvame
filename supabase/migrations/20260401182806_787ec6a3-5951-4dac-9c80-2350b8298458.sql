
-- Function to deduct stock when order_items are inserted
CREATE OR REPLACE FUNCTION public.deduct_product_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Deduct from product_variations if variation_id is set
  IF NEW.variation_id IS NOT NULL THEN
    UPDATE public.product_variations
    SET stock = GREATEST(0, stock - NEW.quantity)
    WHERE id = NEW.variation_id;
  END IF;

  -- Always deduct from the main product stock
  UPDATE public.products
  SET stock = GREATEST(0, stock - NEW.quantity)
  WHERE id = NEW.product_id;

  RETURN NEW;
END;
$$;

-- Function to restore stock when order is cancelled
CREATE OR REPLACE FUNCTION public.restore_product_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'cancelled' THEN
    -- Restore stock for each item in the order
    UPDATE public.products p
    SET stock = p.stock + oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id AND oi.product_id = p.id;

    -- Restore variation stock
    UPDATE public.product_variations pv
    SET stock = pv.stock + oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id AND oi.variation_id IS NOT NULL AND oi.variation_id = pv.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger: deduct stock on order item insert
CREATE TRIGGER trg_deduct_stock_on_order_item
AFTER INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.deduct_product_stock();

-- Trigger: restore stock on order cancellation
CREATE TRIGGER trg_restore_stock_on_cancel
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.restore_product_stock();
