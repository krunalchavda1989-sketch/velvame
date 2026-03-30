
ALTER TABLE public.brand_settings 
ADD COLUMN IF NOT EXISTS secondary_color text DEFAULT '#10b981',
ADD COLUMN IF NOT EXISTS accent_color text DEFAULT '#8b5cf6',
ADD COLUMN IF NOT EXISTS success_color text DEFAULT '#22c55e',
ADD COLUMN IF NOT EXISTS warning_color text DEFAULT '#f59e0b',
ADD COLUMN IF NOT EXISTS info_color text DEFAULT '#3b82f6',
ADD COLUMN IF NOT EXISTS danger_color text DEFAULT '#ef4444',
ADD COLUMN IF NOT EXISTS sidebar_color text DEFAULT '#1a1a2e',
ADD COLUMN IF NOT EXISTS stat_color_1 text DEFAULT '#4f46e5',
ADD COLUMN IF NOT EXISTS stat_color_2 text DEFAULT '#10b981',
ADD COLUMN IF NOT EXISTS stat_color_3 text DEFAULT '#f59e0b',
ADD COLUMN IF NOT EXISTS stat_color_4 text DEFAULT '#ec4899';
