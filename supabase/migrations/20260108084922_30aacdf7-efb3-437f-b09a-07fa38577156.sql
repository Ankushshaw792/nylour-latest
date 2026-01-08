-- Tighten customer booking updates so customers cannot self-confirm bookings
-- 1) Replace the existing UPDATE policy for customers
DROP POLICY IF EXISTS "Customers can update their bookings" ON public.bookings;

CREATE POLICY "Customers can update their bookings"
ON public.bookings
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.customers
    WHERE customers.id = bookings.customer_id
      AND customers.user_id = auth.uid()
  )
)
WITH CHECK (
  -- After the update, the booking must still belong to this customer...
  EXISTS (
    SELECT 1
    FROM public.customers
    WHERE customers.id = bookings.customer_id
      AND customers.user_id = auth.uid()
  )
  -- ...and customers may only update while the booking is still pending
  AND bookings.status = 'pending'
);
