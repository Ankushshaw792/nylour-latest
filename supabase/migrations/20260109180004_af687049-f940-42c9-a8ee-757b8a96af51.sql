-- Add arrival_deadline column to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS arrival_deadline TIMESTAMP WITH TIME ZONE NULL;

-- Modify the trigger function to set arrival_deadline when booking is confirmed
CREATE OR REPLACE FUNCTION public.create_queue_entry_on_booking_confirm()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  next_position INTEGER;
BEGIN
  -- Only proceed if status changed to 'confirmed'
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    -- Set arrival_deadline for online bookings (10 minutes from now)
    IF NEW.customer_id IS NOT NULL AND NEW.arrival_deadline IS NULL THEN
      NEW.arrival_deadline := NOW() + INTERVAL '10 minutes';
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
$$;

-- Create function to expire overdue arrivals
CREATE OR REPLACE FUNCTION public.expire_overdue_arrivals()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  expired_booking RECORD;
  customer_user_id UUID;
BEGIN
  -- Find and process all overdue bookings
  FOR expired_booking IN
    SELECT b.id, b.customer_id, b.salon_id, s.name as salon_name
    FROM public.bookings b
    JOIN public.salons s ON s.id = b.salon_id
    WHERE b.status = 'confirmed'
      AND b.arrival_deadline IS NOT NULL
      AND b.arrival_deadline < NOW()
  LOOP
    -- Update booking status to cancelled
    UPDATE public.bookings 
    SET status = 'cancelled', 
        notes = COALESCE(notes || ' | ', '') || 'Auto-cancelled: Did not arrive within 10 minutes',
        updated_at = NOW()
    WHERE id = expired_booking.id;
    
    -- Update queue entry
    UPDATE public.queue_entries 
    SET status = 'completed',
        updated_at = NOW()
    WHERE booking_id = expired_booking.id;
    
    -- Reorder remaining queue positions
    WITH ranked AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY position) as new_pos
      FROM public.queue_entries
      WHERE salon_id = expired_booking.salon_id
        AND status IN ('waiting', 'called', 'in_service')
    )
    UPDATE public.queue_entries qe
    SET position = ranked.new_pos
    FROM ranked
    WHERE qe.id = ranked.id;
    
    -- Get user_id for notification
    SELECT user_id INTO customer_user_id
    FROM public.customers
    WHERE id = expired_booking.customer_id;
    
    -- Create notification for customer
    IF customer_user_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, type, related_id)
      VALUES (
        customer_user_id,
        'Booking Cancelled',
        'Your booking at ' || expired_booking.salon_name || ' was cancelled as you did not arrive within 10 minutes.',
        'booking',
        expired_booking.id
      );
    END IF;
  END LOOP;
END;
$$;

-- Create function to add walk-in to first position
CREATE OR REPLACE FUNCTION public.add_walkin_first_position(
  p_salon_id UUID,
  p_service_id UUID,
  p_customer_name TEXT,
  p_phone TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_booking_id UUID;
  service_price DECIMAL;
  affected_customer_id UUID;
  affected_user_id UUID;
BEGIN
  -- Get service price
  SELECT price INTO service_price
  FROM public.salon_services
  WHERE id = p_service_id;
  
  -- Check if there's an online customer at position 1 with arrival_deadline
  SELECT qe.customer_id INTO affected_customer_id
  FROM public.queue_entries qe
  JOIN public.bookings b ON b.id = qe.booking_id
  WHERE qe.salon_id = p_salon_id
    AND qe.position = 1
    AND qe.status = 'waiting'
    AND b.arrival_deadline IS NOT NULL
    AND b.arrival_deadline > NOW();
  
  -- Shift all positions up by 1
  UPDATE public.queue_entries
  SET position = position + 1
  WHERE salon_id = p_salon_id
    AND status IN ('waiting', 'called', 'in_service');
  
  -- Create walk-in booking
  INSERT INTO public.bookings (
    salon_id,
    service_id,
    customer_id,
    booking_date,
    booking_time,
    status,
    total_amount,
    notes
  ) VALUES (
    p_salon_id,
    p_service_id,
    NULL,
    CURRENT_DATE,
    NOW()::TIME,
    'confirmed',
    COALESCE(service_price, 0),
    'Walk-in: ' || p_customer_name || COALESCE(' | Phone: ' || p_phone, '')
  )
  RETURNING id INTO new_booking_id;
  
  -- Create queue entry at position 1
  INSERT INTO public.queue_entries (
    booking_id,
    salon_id,
    customer_id,
    position,
    status,
    estimated_wait_time,
    check_in_time
  ) VALUES (
    new_booking_id,
    p_salon_id,
    NULL,
    1,
    'waiting',
    0,
    NOW()
  );
  
  -- Notify the affected online customer if they were at position 1
  IF affected_customer_id IS NOT NULL THEN
    SELECT user_id INTO affected_user_id
    FROM public.customers
    WHERE id = affected_customer_id;
    
    IF affected_user_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, type)
      VALUES (
        affected_user_id,
        'Queue Position Changed',
        'A walk-in customer arrived. Your position is now #2 in the queue.',
        'queue'
      );
    END IF;
  END IF;
  
  RETURN new_booking_id;
END;
$$;