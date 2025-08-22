-- Fix security issues: Set search_path for all new functions

-- Fix calculate_queue_position function
CREATE OR REPLACE FUNCTION public.calculate_queue_position(p_salon_id uuid, p_customer_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  position_count integer;
BEGIN
  SELECT COUNT(*) + 1 INTO position_count
  FROM public.queue_entries qe
  WHERE qe.salon_id = p_salon_id 
    AND qe.status = 'waiting'
    AND qe.joined_at < (
      SELECT joined_at FROM public.queue_entries 
      WHERE salon_id = p_salon_id AND customer_id = p_customer_id AND status = 'waiting'
      ORDER BY joined_at DESC LIMIT 1
    );
  
  RETURN COALESCE(position_count, 1);
END;
$$;

-- Fix update_queue_estimated_times function
CREATE OR REPLACE FUNCTION public.update_queue_estimated_times()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.queue_entries 
  SET estimated_wait_time = (
    SELECT COALESCE(
      (SELECT AVG(ss.duration) FROM salon_services ss WHERE ss.salon_id = queue_entries.salon_id) * 
      (calculate_queue_position(queue_entries.salon_id, queue_entries.customer_id) - 1),
      30
    )
  )
  WHERE status = 'waiting';
END;
$$;

-- Fix handle_queue_status_change function
CREATE OR REPLACE FUNCTION public.handle_queue_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Update estimated wait times for all waiting customers when status changes
  PERFORM public.update_queue_estimated_times();
  
  -- Create notification for status change
  IF NEW.status != OLD.status THEN
    INSERT INTO public.notifications (user_id, title, message, type, related_id)
    VALUES (
      NEW.customer_id,
      CASE NEW.status
        WHEN 'in_service' THEN 'Your turn is ready!'
        WHEN 'completed' THEN 'Service completed'
        WHEN 'cancelled' THEN 'Queue entry cancelled'
        ELSE 'Queue status updated'
      END,
      CASE NEW.status
        WHEN 'in_service' THEN 'Please proceed to the salon, your service is ready to begin.'
        WHEN 'completed' THEN 'Thank you for visiting! Please rate your experience.'
        WHEN 'cancelled' THEN 'Your queue entry has been cancelled.'
        ELSE 'Your queue status has been updated to: ' || NEW.status
      END,
      'queue_update',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix update_user_stats function
CREATE OR REPLACE FUNCTION public.update_user_stats(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  visit_count integer;
  total_spending numeric;
BEGIN
  -- Calculate total visits (completed bookings)
  SELECT COUNT(*) INTO visit_count
  FROM public.bookings
  WHERE customer_id = p_user_id AND status = 'completed';
  
  -- Calculate total spending (completed payments)
  SELECT COALESCE(SUM(p.amount), 0) INTO total_spending
  FROM public.payments p
  JOIN public.bookings b ON p.booking_id = b.id
  WHERE b.customer_id = p_user_id AND p.payment_status = 'completed';
  
  -- Update profile
  UPDATE public.profiles
  SET 
    total_visits = visit_count,
    total_spent = total_spending,
    updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;

-- Fix handle_booking_completion function
CREATE OR REPLACE FUNCTION public.handle_booking_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    PERFORM public.update_user_stats(NEW.customer_id);
    
    -- Create completion notification
    INSERT INTO public.notifications (user_id, title, message, type, related_id)
    VALUES (
      NEW.customer_id,
      'Booking completed!',
      'Thank you for your visit! Please rate your experience and book again soon.',
      'booking_confirmation',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;