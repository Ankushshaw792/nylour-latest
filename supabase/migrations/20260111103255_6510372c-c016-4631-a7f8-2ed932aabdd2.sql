-- Create booking_services table for multi-service bookings
CREATE TABLE public.booking_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  salon_service_id UUID NOT NULL REFERENCES public.salon_services(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  unit_duration INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_booking_services_booking_id ON public.booking_services(booking_id);
CREATE INDEX idx_booking_services_salon_service_id ON public.booking_services(salon_service_id);

-- Enable RLS
ALTER TABLE public.booking_services ENABLE ROW LEVEL SECURITY;

-- RLS: Customers can view their booking services
CREATE POLICY "Customers can view their booking services"
ON public.booking_services
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    JOIN public.customers c ON c.id = b.customer_id
    WHERE b.id = booking_services.booking_id
    AND c.user_id = auth.uid()
  )
);

-- RLS: Customers can insert booking services for their bookings
CREATE POLICY "Customers can insert their booking services"
ON public.booking_services
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bookings b
    JOIN public.customers c ON c.id = b.customer_id
    WHERE b.id = booking_services.booking_id
    AND c.user_id = auth.uid()
  )
);

-- RLS: Salon owners can view booking services for their salon's bookings
CREATE POLICY "Salon owners can view booking services"
ON public.booking_services
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    JOIN public.salons s ON s.id = b.salon_id
    WHERE b.id = booking_services.booking_id
    AND s.owner_id = auth.uid()
  )
);

-- Backfill existing bookings into booking_services
INSERT INTO public.booking_services (booking_id, salon_service_id, quantity, unit_price, unit_duration)
SELECT 
  b.id,
  b.service_id,
  1,
  COALESCE(ss.price, 0),
  COALESCE(ss.duration, 30)
FROM public.bookings b
JOIN public.salon_services ss ON ss.id = b.service_id
WHERE b.service_id IS NOT NULL
ON CONFLICT DO NOTHING;