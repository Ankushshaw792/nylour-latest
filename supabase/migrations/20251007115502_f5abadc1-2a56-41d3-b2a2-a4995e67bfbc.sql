-- Fix security linter warning: set search_path and use SECURITY DEFINER
-- Also correct function logic to check salons ownership properly
CREATE OR REPLACE FUNCTION public.is_salon_owner_of(p_salon_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.salons s
    WHERE s.id = p_salon_id
      AND s.owner_id = auth.uid()
  );
$$;