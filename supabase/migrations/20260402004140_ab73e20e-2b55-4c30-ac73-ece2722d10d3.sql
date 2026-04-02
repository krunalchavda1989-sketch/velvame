
-- Create payout_transactions table
CREATE TABLE public.payout_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  payment_mode TEXT NOT NULL DEFAULT 'bank_transfer',
  transaction_ref TEXT NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  paid_by_admin_id UUID NOT NULL,
  note TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'paid',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payout_transactions ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admins can manage payout_transactions"
  ON public.payout_transactions FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own payouts
CREATE POLICY "Users can view own payouts"
  ON public.payout_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Unique constraint on transaction_ref to prevent duplicates
CREATE UNIQUE INDEX idx_payout_transactions_ref ON public.payout_transactions(transaction_ref);
