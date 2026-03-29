
-- Create admin_sub_users table for sub-admin access management
CREATE TABLE public.admin_sub_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  added_by uuid NOT NULL,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_sub_users ENABLE ROW LEVEL SECURITY;

-- Only master admin can manage sub-users (checked via admin role)
CREATE POLICY "Admins can manage sub users" ON public.admin_sub_users
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Remove admin role from unauthorized user chavdas.com@gmail.com
DELETE FROM public.user_roles 
WHERE role = 'admin' 
AND user_id IN (
  SELECT id FROM auth.users WHERE email = 'chavdas.com@gmail.com'
);
