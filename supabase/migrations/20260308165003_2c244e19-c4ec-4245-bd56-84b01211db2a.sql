
-- Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  is_read boolean NOT NULL DEFAULT false,
  link text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can manage all notifications"
  ON public.notifications FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger function for KYC status changes
CREATE OR REPLACE FUNCTION public.notify_kyc_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('approved', 'rejected') THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      NEW.user_id,
      CASE WHEN NEW.status = 'approved' THEN 'KYC Document Approved ✅' ELSE 'KYC Document Rejected ❌' END,
      CASE 
        WHEN NEW.status = 'approved' THEN 'Your ' || NEW.document_type || ' has been verified successfully.'
        ELSE 'Your ' || NEW.document_type || ' was rejected. ' || COALESCE(NEW.admin_note, 'Please re-upload.')
      END,
      CASE WHEN NEW.status = 'approved' THEN 'success' ELSE 'error' END,
      '/dashboard/settings?tab=kyc'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_kyc_status_change
  AFTER UPDATE ON public.kyc_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_kyc_status_change();
