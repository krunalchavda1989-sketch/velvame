
CREATE OR REPLACE FUNCTION public.get_user_earnings_report(
  _user_id uuid,
  _start_date timestamptz DEFAULT NULL,
  _end_date timestamptz DEFAULT NULL
)
RETURNS TABLE (
  commission_id uuid,
  amount numeric,
  rate numeric,
  level integer,
  commission_type text,
  status text,
  created_at timestamptz,
  order_id uuid,
  order_number text,
  order_amount numeric,
  source_user_id uuid,
  source_user_name text,
  source_referral_code text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    c.id,
    c.amount,
    c.rate,
    c.level,
    c.commission_type,
    c.status,
    c.created_at,
    c.order_id,
    o.order_number,
    o.total_amount,
    c.source_user_id,
    p.full_name,
    p.referral_code
  FROM public.commissions c
  LEFT JOIN public.orders o ON o.id = c.order_id
  LEFT JOIN public.profiles p ON p.user_id = c.source_user_id
  WHERE c.beneficiary_id = _user_id
    AND (_start_date IS NULL OR c.created_at >= _start_date)
    AND (_end_date IS NULL OR c.created_at <= _end_date)
  ORDER BY c.created_at DESC;
$$;
