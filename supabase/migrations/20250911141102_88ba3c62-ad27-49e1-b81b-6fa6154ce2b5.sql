-- Create/replace helper functions with SECURITY DEFINER to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  select public.has_role(auth.uid(), 'admin'::user_role);
$$;

-- Rewrite admin policies across tables to use has_role()/is_admin() and avoid recursive queries

-- BOOKINGS
DROP POLICY IF EXISTS "Admins can manage all bookings" ON public.bookings;
CREATE POLICY "Admins can manage all bookings"
ON public.bookings
AS PERMISSIVE
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::user_role));

-- CUSTOMERS
DROP POLICY IF EXISTS "Admins can manage all customers" ON public.customers;
CREATE POLICY "Admins can manage all customers"
ON public.customers
AS PERMISSIVE
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::user_role));

-- SALONS
DROP POLICY IF EXISTS "Admins can manage all salons" ON public.salons;
CREATE POLICY "Admins can manage all salons"
ON public.salons
AS PERMISSIVE
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::user_role));

-- Public can view active salons (simplify to is_active = true)
DROP POLICY IF EXISTS "Public can view approved salons" ON public.salons;
DROP POLICY IF EXISTS "Public can view active salons" ON public.salons;
CREATE POLICY "Public can view active salons"
ON public.salons
AS PERMISSIVE
FOR SELECT
TO public
USING (is_active = true);

-- SERVICES
DROP POLICY IF EXISTS "Admins can manage services" ON public.services;
CREATE POLICY "Admins can manage services"
ON public.services
AS PERMISSIVE
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::user_role));

-- SALON_SERVICES
DROP POLICY IF EXISTS "Admins can manage all salon services" ON public.salon_services;
CREATE POLICY "Admins can manage all salon services"
ON public.salon_services
AS PERMISSIVE
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::user_role));

-- USER_ROLES: remove recursive policy and replace with function-based
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
AS PERMISSIVE
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::user_role));

-- Ensure existing public read policies remain for services/salon_services/salon_hours
-- (recreate permissive public read if missing)
DROP POLICY IF EXISTS "Public can read services" ON public.services;
CREATE POLICY "Public can read services"
ON public.services
AS PERMISSIVE
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Public can read salon services" ON public.salon_services;
CREATE POLICY "Public can read salon services"
ON public.salon_services
AS PERMISSIVE
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Public can read salon hours" ON public.salon_hours;
CREATE POLICY "Public can read salon hours"
ON public.salon_hours
AS PERMISSIVE
FOR SELECT
TO public
USING (true);
