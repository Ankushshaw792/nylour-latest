-- Update notification type used by handle_booking_status_change to valid enum values
CREATE OR REPLACE FUNCTION public.handle_booking_status_change()
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
      -- Use valid notification_type values only
      CASE NEW.status
        WHEN 'confirmed' THEN 'booking_confirmation'::notification_type
        ELSE 'general'::notification_type
      END,
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