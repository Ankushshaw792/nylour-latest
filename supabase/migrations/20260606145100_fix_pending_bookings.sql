-- Update check_active_booking to only consider bookings with completed payments as active
CREATE OR REPLACE FUNCTION public.check_active_booking(p_customer_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN 
  RETURN EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE customer_id = p_customer_id 
      AND status IN ('pending', 'confirmed', 'in_progress') 
      AND payment_status = 'completed'
      AND booking_date >= CURRENT_DATE
  ); 
END;
$$;

-- Update prevent_multiple_active_bookings trigger to only check against completed bookings
CREATE OR REPLACE FUNCTION public.prevent_multiple_active_bookings()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.customer_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE customer_id = NEW.customer_id 
        AND status IN ('pending', 'confirmed', 'in_progress') 
        AND payment_status = 'completed'
        AND booking_date >= CURRENT_DATE 
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
      RAISE EXCEPTION 'You already have an active booking.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
