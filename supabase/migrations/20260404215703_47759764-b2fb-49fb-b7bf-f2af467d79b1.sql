ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_source text NOT NULL DEFAULT 'user';

-- Backfill: mark orders that have matching order_notes with 'admin_manual' note_type as manual
UPDATE public.orders SET order_source = 'manual' WHERE id IN (SELECT DISTINCT order_id FROM public.order_notes WHERE note_type = 'admin_manual' OR content ILIKE '%manual order%' OR content ILIKE '%Admin placed%');