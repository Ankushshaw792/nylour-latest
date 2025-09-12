-- Just add the customer access policies without changing foreign keys for now
-- Ensure customers can read their own bookings
DROP POLICY IF EXISTS "Customers can view their bookings" ON public.bookings;
CREATE POLICY "Customers can view their bookings"
ON public.bookings
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (customer_id = auth.uid());

-- Ensure customers can create their own bookings  
DROP POLICY IF EXISTS "Customers can create their bookings" ON public.bookings;
CREATE POLICY "Customers can create their bookings"
ON public.bookings
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (customer_id = auth.uid());

-- Ensure customers can update their own bookings
DROP POLICY IF EXISTS "Customers can update their bookings" ON public.bookings;
CREATE POLICY "Customers can update their bookings"
ON public.bookings
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (customer_id = auth.uid())
WITH CHECK (customer_id = auth.uid());

-- Ensure customers can read queue entries
DROP POLICY IF EXISTS "Customers can view their queue entries" ON public.queue_entries;
CREATE POLICY "Customers can view their queue entries"
ON public.queue_entries
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (customer_id = auth.uid());

-- Make sure customers table has proper read access for queue display
DROP POLICY IF EXISTS "Public can read customer names" ON public.customers;
CREATE POLICY "Public can read customer names"
ON public.customers
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);