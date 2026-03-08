
CREATE TABLE public.order_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID,
  note_type TEXT NOT NULL DEFAULT 'manual',
  content TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.order_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage order notes" ON public.order_notes FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own order notes" ON public.order_notes FOR SELECT TO authenticated USING (
  is_internal = false AND EXISTS (
    SELECT 1 FROM orders WHERE orders.id = order_notes.order_id AND orders.user_id = auth.uid()
  )
);

CREATE INDEX idx_order_notes_order_id ON public.order_notes(order_id);
