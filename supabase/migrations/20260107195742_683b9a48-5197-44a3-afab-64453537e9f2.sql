-- Allow salon owners to create walk-in/manual bookings
CREATE POLICY "Salon owners can create walk-in bookings"
ON public.bookings
FOR INSERT
WITH CHECK (
  customer_id IS NULL
  AND EXISTS (
    SELECT 1
    FROM public.salons
    WHERE salons.id = bookings.salon_id
      AND salons.owner_id = auth.uid()
  )
);
