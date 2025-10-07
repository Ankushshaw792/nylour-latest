-- Step 1: Make customer_id nullable to support walk-in bookings
ALTER TABLE public.bookings 
ALTER COLUMN customer_id DROP NOT NULL;

-- Step 2: Add RLS policy for salon owners to manage their salon bookings
CREATE POLICY "Salon owners manage their salon bookings"
ON public.bookings FOR ALL
USING (
  salon_id IN (
    SELECT id FROM public.salons WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  salon_id IN (
    SELECT id FROM public.salons WHERE owner_id = auth.uid()
  )
);

-- Step 3: Add RLS policy for salon owners to create walk-in bookings
CREATE POLICY "Salon owners can create walk-in bookings"
ON public.bookings FOR INSERT
WITH CHECK (
  salon_id IN (
    SELECT id FROM public.salons WHERE owner_id = auth.uid()
  )
);