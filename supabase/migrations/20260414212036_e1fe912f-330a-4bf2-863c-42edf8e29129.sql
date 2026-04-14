
-- wallet_transactions (1713 rows, no indexes besides PK)
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON public.wallet_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_order_id ON public.wallet_transactions(order_id);

-- commissions (319 rows, no custom indexes)
CREATE INDEX IF NOT EXISTS idx_commissions_beneficiary_id ON public.commissions(beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_commissions_source_user_id ON public.commissions(source_user_id);
CREATE INDEX IF NOT EXISTS idx_commissions_order_id ON public.commissions(order_id);
CREATE INDEX IF NOT EXISTS idx_commissions_created_at ON public.commissions(created_at DESC);

-- orders (82 rows, no custom indexes)
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- order_items (157 rows, no custom indexes)
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- notifications (no index on user_id)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);

-- profiles (missing referred_by index, critical for genealogy)
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by);

-- inventory_logs
CREATE INDEX IF NOT EXISTS idx_inventory_logs_product_id ON public.inventory_logs(product_id);

-- payments
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_ref ON public.payments(order_ref_id);

-- payout_transactions
CREATE INDEX IF NOT EXISTS idx_payout_transactions_user_id ON public.payout_transactions(user_id);

-- manual_subscriptions
CREATE INDEX IF NOT EXISTS idx_manual_subscriptions_user_id ON public.manual_subscriptions(user_id);
