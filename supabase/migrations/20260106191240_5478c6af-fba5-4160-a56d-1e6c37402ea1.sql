-- Function to create queue entry when booking is confirmed
CREATE OR REPLACE FUNCTION public.create_queue_entry_on_booking_confirm()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_position INTEGER;
BEGIN
  -- Only proceed if status changed to 'confirmed'
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    -- Check if queue entry already exists for this booking
    IF NOT EXISTS (SELECT 1 FROM public.queue_entries WHERE booking_id = NEW.id) THEN
      -- Calculate next position
      SELECT COALESCE(MAX(position), 0) + 1 INTO next_position
      FROM public.queue_entries
      WHERE salon_id = NEW.salon_id
        AND status IN ('waiting', 'called', 'in_service');
      
      -- Insert queue entry
      INSERT INTO public.queue_entries (
        booking_id,
        salon_id,
        customer_id,
        position,
        status,
        estimated_wait_time,
        check_in_time
      ) VALUES (
        NEW.id,
        NEW.salon_id,
        NEW.customer_id,
        next_position,
        'waiting',
        next_position * COALESCE((SELECT avg_service_time FROM public.salons WHERE id = NEW.salon_id), 20),
        now()
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on bookings table
DROP TRIGGER IF EXISTS trigger_create_queue_on_confirm ON public.bookings;
CREATE TRIGGER trigger_create_queue_on_confirm
  AFTER INSERT OR UPDATE OF status ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.create_queue_entry_on_booking_confirm();