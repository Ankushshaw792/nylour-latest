-- Allow salon owners to view customer data for their salon's bookings
CREATE POLICY "Salon owners can view customers from their bookings"
ON public.customers FOR SELECT
USING (
  user_id IN (
    SELECT customer_id 
    FROM public.bookings 
    WHERE salon_id IN (
      SELECT id FROM public.salons WHERE owner_id = auth.uid()
    )
    AND customer_id IS NOT NULL
  )
);