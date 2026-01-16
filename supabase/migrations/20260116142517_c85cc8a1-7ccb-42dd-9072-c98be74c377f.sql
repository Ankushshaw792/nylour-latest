-- Drop existing salon owner policies on bookings
DROP POLICY IF EXISTS "Salon owners can view their bookings" ON public.bookings;
DROP POLICY IF EXISTS "Salon owners can update their bookings" ON public.bookings;

-- Create new policies that require payment_status = 'completed' for online bookings
-- Walk-ins (customer_id IS NULL) are visible immediately
CREATE POLICY "Salon owners can view their bookings"
ON public.bookings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM salons
    WHERE salons.id = bookings.salon_id
    AND salons.owner_id = auth.uid()
  )
  AND (payment_status = 'completed' OR customer_id IS NULL)
);

CREATE POLICY "Salon owners can update their bookings"
ON public.bookings
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM salons
    WHERE salons.id = bookings.salon_id
    AND salons.owner_id = auth.uid()
  )
  AND (payment_status = 'completed' OR customer_id IS NULL)
);

-- Update booking_services policy for salon owners to match
DROP POLICY IF EXISTS "Salon owners can view booking services" ON public.booking_services;

CREATE POLICY "Salon owners can view booking services"
ON public.booking_services
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM bookings b
    JOIN salons s ON s.id = b.salon_id
    WHERE b.id = booking_services.booking_id
    AND s.owner_id = auth.uid()
    AND (b.payment_status = 'completed' OR b.customer_id IS NULL)
  )
);