
INSERT INTO public.site_settings (key, value)
VALUES ('testimonial_section_bg_color', '"#ffffff"'::jsonb)
ON CONFLICT (key) DO NOTHING;
