
-- Drop the old 2-param overload that conflicts
DROP FUNCTION IF EXISTS public.get_genealogy_tree(uuid, integer);
