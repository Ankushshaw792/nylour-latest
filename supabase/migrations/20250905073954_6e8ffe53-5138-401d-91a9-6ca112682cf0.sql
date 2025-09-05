-- Drop the redundant salons_public view since we can query salons table directly
DROP VIEW IF EXISTS public.salons_public;