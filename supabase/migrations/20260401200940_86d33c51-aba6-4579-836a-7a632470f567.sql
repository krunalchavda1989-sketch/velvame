
-- Fix withdrawal_requests RLS: change from {public} to {authenticated}
DROP POLICY IF EXISTS "Users can view own withdrawals" ON withdrawal_requests;
CREATE POLICY "Users can view own withdrawals" ON withdrawal_requests
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create withdrawals" ON withdrawal_requests;
CREATE POLICY "Users can create withdrawals" ON withdrawal_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage withdrawals" ON withdrawal_requests;
CREATE POLICY "Admins can manage withdrawals" ON withdrawal_requests
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
