-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Salon owners can view customers" ON public.customers;

-- Create a restricted policy that only allows viewing customers with bookings at their salon
CREATE POLICY "Salon owners can view their salon customers"
ON public.customers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    JOIN public.salons s ON s.id = b.salon_id
    WHERE b.customer_id = customers.id
    AND s.owner_id = auth.uid()
  )
);