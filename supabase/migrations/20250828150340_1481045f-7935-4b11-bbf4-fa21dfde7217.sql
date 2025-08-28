-- Phase 1: Database Enhancements for Real-time Salon Dashboard (Fixed)

-- Add salon status and booking control fields
ALTER TABLE public.salons 
ADD COLUMN IF NOT EXISTS is_online boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS accepts_bookings boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS current_wait_time integer DEFAULT 30,
ADD COLUMN IF NOT EXISTS max_queue_size integer DEFAULT 20,
ADD COLUMN IF NOT EXISTS last_activity timestamp with time zone DEFAULT now();

-- Add booking management fields  
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS estimated_service_time integer DEFAULT 30,
ADD COLUMN IF NOT EXISTS actual_start_time timestamp with time zone,
ADD COLUMN IF NOT EXISTS actual_end_time timestamp with time zone,
ADD COLUMN IF NOT EXISTS queue_position integer;

-- Enable real-time for key tables
ALTER TABLE public.bookings REPLICA IDENTITY FULL;
ALTER TABLE public.queue_entries REPLICA IDENTITY FULL;
ALTER TABLE public.salons REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Function to update salon activity timestamp
CREATE OR REPLACE FUNCTION update_salon_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.salons 
  SET last_activity = now()
  WHERE id = NEW.salon_id;
  RETURN NEW;
END;
$function$;

-- Trigger to update salon activity on bookings
DROP TRIGGER IF EXISTS update_salon_activity_on_booking ON public.bookings;
CREATE TRIGGER update_salon_activity_on_booking
  AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_salon_activity();

-- Function to handle booking status changes with notifications
CREATE OR REPLACE FUNCTION handle_booking_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Send notification to customer on status change
  IF NEW.status != OLD.status THEN
    INSERT INTO public.notifications (user_id, title, message, type, related_id)
    VALUES (
      NEW.customer_id,
      CASE NEW.status
        WHEN 'confirmed' THEN 'Booking Confirmed!'
        WHEN 'rejected' THEN 'Booking Declined'
        WHEN 'in_progress' THEN 'Your Service Has Started'
        WHEN 'completed' THEN 'Service Completed'
        WHEN 'cancelled' THEN 'Booking Cancelled'
        ELSE 'Booking Status Updated'
      END,
      CASE NEW.status
        WHEN 'confirmed' THEN 'Your booking has been confirmed by the salon. Please arrive on time.'
        WHEN 'rejected' THEN 'Sorry, your booking could not be confirmed. Please try a different time.'
        WHEN 'in_progress' THEN 'Your service is now in progress. Please proceed to the salon.'
        WHEN 'completed' THEN 'Thank you for your visit! Please rate your experience.'
        WHEN 'cancelled' THEN 'Your booking has been cancelled.'
        ELSE 'Your booking status has been updated to: ' || NEW.status
      END,
      'booking_update',
      NEW.id
    );

    -- Update queue position if confirmed
    IF NEW.status = 'confirmed' AND OLD.status = 'pending' THEN
      UPDATE public.bookings 
      SET queue_position = (
        SELECT COALESCE(MAX(queue_position), 0) + 1 
        FROM public.bookings 
        WHERE salon_id = NEW.salon_id 
        AND status IN ('confirmed', 'in_progress')
        AND booking_date = NEW.booking_date
      )
      WHERE id = NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Trigger for booking status changes
DROP TRIGGER IF EXISTS on_booking_status_change ON public.bookings;
CREATE TRIGGER on_booking_status_change
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION handle_booking_status_change();

-- Function to send next customer notification
CREATE OR REPLACE FUNCTION notify_next_customer(p_salon_id uuid, p_message text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  next_customer_id uuid;
  next_booking_id uuid;
BEGIN
  -- Find the next customer in queue
  SELECT customer_id, id INTO next_customer_id, next_booking_id
  FROM public.bookings
  WHERE salon_id = p_salon_id 
    AND status = 'confirmed'
    AND booking_date = CURRENT_DATE
  ORDER BY queue_position ASC, created_at ASC
  LIMIT 1;

  IF next_customer_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, related_id)
    VALUES (
      next_customer_id,
      'Your Turn is Next!',
      COALESCE(p_message, 'Please get ready, your service will begin shortly.'),
      'queue_update',
      next_booking_id
    );
  END IF;
END;
$function$;