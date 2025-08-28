-- Fix the security definer view issue by recreating without SECURITY DEFINER
DROP VIEW IF EXISTS public.salons_public;

-- Create a standard view (not security definer) for public salon information
CREATE VIEW public.salons_public AS
SELECT 
  id,
  name,
  description,
  address,
  image_url,
  status,
  created_at,
  updated_at
FROM public.salons
WHERE status = 'approved'::salon_status;

-- Grant select permissions on the view to authenticated and anon users
GRANT SELECT ON public.salons_public TO authenticated, anon;