
-- Popups main table
CREATE TABLE public.popups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'offer',
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  btn1_text TEXT NOT NULL DEFAULT '',
  btn1_link TEXT NOT NULL DEFAULT '',
  btn2_text TEXT NOT NULL DEFAULT '',
  btn2_action TEXT NOT NULL DEFAULT 'close',
  bg_color TEXT NOT NULL DEFAULT '#ffffff',
  overlay_color TEXT NOT NULL DEFAULT '#000000',
  overlay_opacity INTEGER NOT NULL DEFAULT 50,
  width INTEGER NOT NULL DEFAULT 500,
  position TEXT NOT NULL DEFAULT 'center',
  show_close_btn BOOLEAN NOT NULL DEFAULT true,
  close_on_overlay BOOLEAN NOT NULL DEFAULT true,
  status BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.popups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage popups" ON public.popups FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active popups" ON public.popups FOR SELECT TO anon, authenticated
  USING (status = true);

-- Popup conditions table
CREATE TABLE public.popup_conditions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  popup_id UUID NOT NULL REFERENCES public.popups(id) ON DELETE CASCADE,
  include_exclude TEXT NOT NULL DEFAULT 'include',
  scope TEXT NOT NULL DEFAULT 'entire_site',
  page_type TEXT NOT NULL DEFAULT 'all',
  specific_page TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.popup_conditions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage popup_conditions" ON public.popup_conditions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view popup_conditions" ON public.popup_conditions FOR SELECT TO anon, authenticated
  USING (true);

-- Popup triggers table (one row per popup)
CREATE TABLE public.popup_triggers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  popup_id UUID NOT NULL REFERENCES public.popups(id) ON DELETE CASCADE UNIQUE,
  on_page_load BOOLEAN NOT NULL DEFAULT true,
  page_load_delay INTEGER NOT NULL DEFAULT 0,
  on_scroll BOOLEAN NOT NULL DEFAULT false,
  scroll_direction TEXT NOT NULL DEFAULT 'down',
  scroll_percent INTEGER NOT NULL DEFAULT 50,
  on_scroll_to_element BOOLEAN NOT NULL DEFAULT false,
  element_selector TEXT NOT NULL DEFAULT '',
  on_click BOOLEAN NOT NULL DEFAULT false,
  click_count INTEGER NOT NULL DEFAULT 1,
  after_inactivity BOOLEAN NOT NULL DEFAULT false,
  inactivity_seconds INTEGER NOT NULL DEFAULT 30,
  on_exit_intent BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE public.popup_triggers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage popup_triggers" ON public.popup_triggers FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view popup_triggers" ON public.popup_triggers FOR SELECT TO anon, authenticated
  USING (true);

-- Popup advanced rules table (one row per popup)
CREATE TABLE public.popup_advanced_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  popup_id UUID NOT NULL REFERENCES public.popups(id) ON DELETE CASCADE UNIQUE,
  show_after_pageviews BOOLEAN NOT NULL DEFAULT false,
  pageview_count INTEGER NOT NULL DEFAULT 3,
  show_after_sessions BOOLEAN NOT NULL DEFAULT false,
  session_count INTEGER NOT NULL DEFAULT 2,
  show_max_times BOOLEAN NOT NULL DEFAULT false,
  max_times INTEGER NOT NULL DEFAULT 1,
  arriving_from_url BOOLEAN NOT NULL DEFAULT false,
  referrer_url TEXT NOT NULL DEFAULT '',
  arriving_from_source BOOLEAN NOT NULL DEFAULT false,
  traffic_source TEXT NOT NULL DEFAULT 'any',
  hide_logged_in BOOLEAN NOT NULL DEFAULT false,
  show_on_devices BOOLEAN NOT NULL DEFAULT false,
  device_type TEXT NOT NULL DEFAULT 'all'
);

ALTER TABLE public.popup_advanced_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage popup_advanced_rules" ON public.popup_advanced_rules FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view popup_advanced_rules" ON public.popup_advanced_rules FOR SELECT TO anon, authenticated
  USING (true);
