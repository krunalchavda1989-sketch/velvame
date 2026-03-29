
-- Allow authenticated users to check their own sub-admin status
CREATE POLICY "Users can check own sub-admin status" ON public.admin_sub_users
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
