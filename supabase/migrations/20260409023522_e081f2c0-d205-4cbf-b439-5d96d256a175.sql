
CREATE TABLE public.system_feature_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  feature_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.system_feature_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage feature log"
ON public.system_feature_log
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view feature log"
ON public.system_feature_log
FOR SELECT
TO authenticated
USING (true);

CREATE INDEX idx_feature_log_date ON public.system_feature_log (feature_date DESC);
