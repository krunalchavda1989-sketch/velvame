
INSERT INTO public.site_settings (key, value)
VALUES ('auth_page_image', '"https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80"')
ON CONFLICT (key) DO NOTHING;
