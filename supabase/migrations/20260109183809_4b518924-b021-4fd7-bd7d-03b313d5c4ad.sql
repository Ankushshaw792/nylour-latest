-- Drop the problematic INSERT trigger that runs BEFORE insert
DROP TRIGGER IF EXISTS trigger_create_queue_on_booking_insert ON public.bookings;

-- Create separate function for AFTER INSERT (only creates queue entry, doesn't modify NEW)
CREATE OR REPLACE FUNCTION public.create_queue_entry_on_booking_insert()
RETURNS TRIGGER AS $$
DECLARE
  next_position INTEGER;
BEGIN
  -- Only proceed if booking is confirmed and has an online customer
  IF NEW.status = 'confirmed' THEN
    -- Set arrival_deadline for online bookings if not set
    IF NEW.customer_id IS NOT NULL AND NEW.arrival_deadline IS NULL THEN
      UPDATE public.bookings 
      SET arrival_deadline = NOW() + INTERVAL '10 minutes'
      WHERE id = NEW.id;
    END IF;
    
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create AFTER INSERT trigger (booking row exists, so FK constraint is satisfied)
CREATE TRIGGER trigger_create_queue_on_booking_insert
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.create_queue_entry_on_booking_insert();