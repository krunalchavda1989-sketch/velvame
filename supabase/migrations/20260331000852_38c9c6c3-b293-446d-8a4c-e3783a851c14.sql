
ALTER TABLE public.category_section_settings
  ADD COLUMN IF NOT EXISTS cat_name_font text NOT NULL DEFAULT 'inherit',
  ADD COLUMN IF NOT EXISTS cat_name_size integer NOT NULL DEFAULT 14,
  ADD COLUMN IF NOT EXISTS cat_name_color text NOT NULL DEFAULT '#000000',
  ADD COLUMN IF NOT EXISTS title_alignment text NOT NULL DEFAULT 'left';
