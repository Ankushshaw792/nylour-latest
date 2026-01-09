-- Add party_size column to bookings
ALTER TABLE bookings ADD COLUMN party_size INTEGER DEFAULT 1;

-- Create booking_companions table
CREATE TABLE public.booking_companions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.booking_companions ENABLE ROW LEVEL SECURITY;

-- Allow customers to manage companions for their bookings
CREATE POLICY "Customers can manage their booking companions"
ON public.booking_companions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM bookings b
    JOIN customers c ON c.id = b.customer_id
    WHERE b.id = booking_companions.booking_id
    AND c.user_id = auth.uid()
  )
);

-- Allow salon owners to view companions
CREATE POLICY "Salon owners can view booking companions"
ON public.booking_companions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM bookings b
    JOIN salons s ON s.id = b.salon_id
    WHERE b.id = booking_companions.booking_id
    AND s.owner_id = auth.uid()
  )
);