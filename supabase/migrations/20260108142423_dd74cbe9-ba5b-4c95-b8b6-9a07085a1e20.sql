-- Create a trigger function to sync queue_entries status when booking status changes
-- This uses booking_id instead of customer_id, so it works for walk-ins too
CREATE OR REPLACE FUNCTION public.sync_queue_status_on_booking_change()
RETURNS TRIGGER AS $$
BEGIN
  -- When booking status becomes 'in_progress', update queue entry
  IF NEW.status = 'in_progress' AND (OLD.status IS NULL OR OLD.status != 'in_progress') THEN
    UPDATE public.queue_entries 
    SET status = 'in_service', 
        service_start_time = NOW(),
        updated_at = NOW()
    WHERE booking_id = NEW.id 
      AND status = 'waiting';
  END IF;
  
  -- When booking status becomes 'completed', 'cancelled', or 'rejected', mark queue as completed
  IF NEW.status IN ('completed', 'cancelled', 'rejected') 
     AND (OLD.status IS NULL OR OLD.status NOT IN ('completed', 'cancelled', 'rejected')) THEN
    UPDATE public.queue_entries 
    SET status = 'completed', 
        service_end_time = NOW(),
        updated_at = NOW()
    WHERE booking_id = NEW.id 
      AND status IN ('waiting', 'in_service');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the trigger on bookings table
DROP TRIGGER IF EXISTS trigger_sync_queue_on_booking_status ON public.bookings;
CREATE TRIGGER trigger_sync_queue_on_booking_status
AFTER UPDATE OF status ON public.bookings
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.sync_queue_status_on_booking_change();

-- One-time cleanup: Fix all existing queue entries that are stuck
-- (status is 'waiting' or 'in_service' but the booking is already completed/cancelled/rejected)
UPDATE public.queue_entries q
SET status = 'completed', 
    service_end_time = NOW(),
    updated_at = NOW()
FROM public.bookings b
WHERE q.booking_id = b.id
  AND q.status IN ('waiting', 'in_service')
  AND b.status IN ('completed', 'cancelled', 'rejected', 'in_progress');