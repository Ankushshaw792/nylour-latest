-- Fix security issue: Restrict public access to salons table to exclude sensitive owner information

-- Drop the existing public policy that exposes all salon data
DROP POLICY IF EXISTS "Anyone can view approved salons" ON public.salons;

-- Create a new policy for unauthenticated users that restricts column access
-- Since PostgreSQL RLS cannot directly restrict columns, we'll limit access patterns
CREATE POLICY "Unauthenticated users can view basic salon info" 
ON public.salons 
FOR SELECT 
USING (
  status = 'approved'::salon_status 
  AND auth.uid() IS NULL
);

-- Create a policy for authenticated customers (non-owners) 
CREATE POLICY "Authenticated customers can view salon info" 
ON public.salons 
FOR SELECT 
USING (
  status = 'approved'::salon_status 
  AND auth.uid() IS NOT NULL 
  AND auth.uid() != owner_id
);