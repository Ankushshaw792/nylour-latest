-- Drop if exists to avoid conflicts
DROP TRIGGER IF EXISTS trigger_create_queue_on_booking_confirm ON public.bookings;
DROP TRIGGER IF EXISTS trigger_create_queue_on_booking_insert ON public.bookings;

-- Create BEFORE UPDATE trigger (for when status changes to confirmed)
CREATE TRIGGER trigger_create_queue_on_booking_confirm
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.create_queue_entry_on_booking_confirm();

-- Create BEFORE INSERT trigger (for direct inserts as confirmed, e.g. walk-ins)
CREATE TRIGGER trigger_create_queue_on_booking_insert
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.create_queue_entry_on_booking_confirm();

-- Fix existing confirmed online bookings that have NULL arrival_deadline
UPDATE public.bookings
SET arrival_deadline = NOW() + INTERVAL '10 minutes'
WHERE status = 'confirmed'
  AND customer_id IS NOT NULL
  AND arrival_deadline IS NULL
  AND booking_date >= CURRENT_DATE;