-- Fix bookings service relationship to reference salon_services instead of services directly
-- This will fix the query errors in BookingsPage and QueueStatus components

-- First, let's see if we have data to migrate
-- If bookings.service_id currently points to services.id, we need to update it to point to salon_services.id

-- Add foreign key constraint from bookings.service_id to salon_services.id
ALTER TABLE public.bookings 
DROP CONSTRAINT IF EXISTS bookings_service_id_fkey;

-- Add the correct foreign key constraint
ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_service_id_fkey 
FOREIGN KEY (service_id) REFERENCES public.salon_services(id);

-- Add foreign key constraint from queue_entries.service_id to salon_services.id
ALTER TABLE public.queue_entries 
DROP CONSTRAINT IF EXISTS queue_entries_service_id_fkey;

ALTER TABLE public.queue_entries 
ADD CONSTRAINT queue_entries_service_id_fkey 
FOREIGN KEY (service_id) REFERENCES public.salon_services(id);

-- Ensure customers can read their own bookings (in case this policy is missing)
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