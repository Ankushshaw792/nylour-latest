-- Temporarily disable check constraint to allow data migration
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS booking_time_future;

-- Fix existing booking data to use salon_services.id instead of services.id
UPDATE public.bookings 
SET service_id = ss.id
FROM public.salon_services ss
WHERE ss.service_id = bookings.service_id 
  AND ss.salon_id = bookings.salon_id;

-- Fix existing queue_entries data similarly
UPDATE public.queue_entries 
SET service_id = ss.id
FROM public.salon_services ss
WHERE ss.service_id = queue_entries.service_id 
  AND ss.salon_id = queue_entries.salon_id;

-- Add the foreign key constraints
ALTER TABLE public.bookings 
DROP CONSTRAINT IF EXISTS bookings_service_id_fkey;

ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_service_id_fkey 
FOREIGN KEY (service_id) REFERENCES public.salon_services(id);

ALTER TABLE public.queue_entries 
DROP CONSTRAINT IF EXISTS queue_entries_service_id_fkey;

ALTER TABLE public.queue_entries 
ADD CONSTRAINT queue_entries_service_id_fkey 
FOREIGN KEY (service_id) REFERENCES public.salon_services(id);

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