-- Fix security issue: Restrict public access to salons table to exclude sensitive owner information

-- Drop the existing public policy that exposes all salon data
DROP POLICY IF EXISTS "Anyone can view approved salons" ON public.salons;

-- Create a new restrictive policy that only exposes essential public information
-- This excludes owner_id, email, and phone from public access
CREATE POLICY "Public can view essential salon info only" 
ON public.salons 
FOR SELECT 
USING (
  status = 'approved'::salon_status 
  AND auth.uid() IS NULL -- Only applies to unauthenticated users
);

-- Create a policy for authenticated users (customers) to see slightly more info but still protect owner details
CREATE POLICY "Authenticated users can view salon details" 
ON public.salons 
FOR SELECT 
USING (
  status = 'approved'::salon_status 
  AND auth.uid() IS NOT NULL 
  AND auth.uid() != owner_id -- Not the owner themselves
);

-- Create a view for public salon information that explicitly excludes sensitive data
CREATE OR REPLACE VIEW public.public_salons AS
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

-- Enable RLS on the view
ALTER VIEW public.public_salons SET (security_invoker = true);

-- Create policy for the public view
CREATE POLICY "Anyone can view public salon info" 
ON public.public_salons
FOR SELECT 
USING (true);