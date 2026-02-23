-- Add admin management policy for order_items
CREATE POLICY "Admins can manage order items"
ON public.order_items
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow users to delete their own pending order items
CREATE POLICY "Users can delete own pending order items"
ON public.order_items
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
    AND orders.status = 'pending'
  )
);