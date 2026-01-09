-- Create a trigger function to prevent multiple active bookings per customer
CREATE OR REPLACE FUNCTION public.prevent_multiple_active_bookings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only check for registered customers (not walk-ins)
  IF NEW.customer_id IS NOT NULL THEN
    -- Check if customer already has an active booking
    IF EXISTS (
      SELECT 1 FROM public.bookings
      WHERE customer_id = NEW.customer_id
      AND status IN ('pending', 'confirmed', 'in_progress')
      AND booking_date >= CURRENT_DATE
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
      RAISE EXCEPTION 'You already have an active booking. Please complete or cancel it before making a new booking.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to enforce single active booking on INSERT
CREATE TRIGGER enforce_single_active_booking
BEFORE INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.prevent_multiple_active_bookings();