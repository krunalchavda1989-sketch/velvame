
-- Binary MLM positions table
CREATE TABLE public.binary_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.binary_positions(id),
  sponsor_id uuid REFERENCES public.binary_positions(id),
  position text NOT NULL DEFAULT 'left',
  left_bv numeric NOT NULL DEFAULT 0,
  right_bv numeric NOT NULL DEFAULT 0,
  total_left_bv numeric NOT NULL DEFAULT 0,
  total_right_bv numeric NOT NULL DEFAULT 0,
  carry_forward_left numeric NOT NULL DEFAULT 0,
  carry_forward_right numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Binary payouts table
CREATE TABLE public.binary_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  weak_leg_bv numeric NOT NULL DEFAULT 0,
  strong_leg_bv numeric NOT NULL DEFAULT 0,
  matching_amount numeric NOT NULL DEFAULT 0,
  payout_percentage numeric NOT NULL DEFAULT 10,
  period_start timestamptz,
  period_end timestamptz,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Binary settings table for admin configuration
CREATE TABLE public.binary_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matching_percentage numeric NOT NULL DEFAULT 10,
  cap_amount numeric NOT NULL DEFAULT 50000,
  min_bv_for_payout numeric NOT NULL DEFAULT 100,
  payout_frequency text NOT NULL DEFAULT 'weekly',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.binary_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.binary_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.binary_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for binary_positions
CREATE POLICY "Users can view own binary position" ON public.binary_positions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage binary positions" ON public.binary_positions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS policies for binary_payouts
CREATE POLICY "Users can view own binary payouts" ON public.binary_payouts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage binary payouts" ON public.binary_payouts
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS policies for binary_settings
CREATE POLICY "Anyone can view binary settings" ON public.binary_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage binary settings" ON public.binary_settings
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default binary settings
INSERT INTO public.binary_settings (matching_percentage, cap_amount, min_bv_for_payout, payout_frequency)
VALUES (10, 50000, 100, 'weekly');
