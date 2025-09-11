-- Drop existing public policies and recreate them as PERMISSIVE
-- This allows unauthenticated users to view salon data

-- Drop and recreate salon policies
DROP POLICY IF EXISTS "Public can view approved salons" ON public.salons;
CREATE POLICY "Public can view approved salons" 
ON public.salons 
FOR SELECT 
TO public
USING ((status = 'approved'::salon_status) AND (admin_approved = true));

-- Drop and recreate service policies  
DROP POLICY IF EXISTS "Public can read services" ON public.services;
CREATE POLICY "Public can read services" 
ON public.services 
FOR SELECT 
TO public
USING (true);

-- Drop and recreate salon_services policies
DROP POLICY IF EXISTS "Public can read salon services" ON public.salon_services;
CREATE POLICY "Public can read salon services" 
ON public.salon_services 
FOR SELECT 
TO public  
USING (true);

-- Drop and recreate salon_hours policies
DROP POLICY IF EXISTS "Public can read salon hours" ON public.salon_hours;
CREATE POLICY "Public can read salon hours" 
ON public.salon_hours 
FOR SELECT 
TO public
USING (true);