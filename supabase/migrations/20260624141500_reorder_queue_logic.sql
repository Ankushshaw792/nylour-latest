-- 1. Drop existing functions so we can recreate them with updated logic
DROP FUNCTION IF EXISTS public.add_walkin_first_position(uuid, uuid, text, text);
DROP FUNCTION IF EXISTS public.recalculate_queue_positions();

-- 2. Recreate recalculate_queue_positions to sort by status first, then check_in_time ASC.
-- This ensures that starting a service (setting status to 'in_service') automatically
-- reshuffles the queue and moves the active customer to position 1, pushing others down.
CREATE OR REPLACE FUNCTION public.recalculate_queue_positions()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_salon_id uuid;
  v_date date;
END;
$$;
-- We will implement the full body next, but first let's drop and recreate.
-- Actually let's write the full body directly:
CREATE OR REPLACE FUNCTION public.recalculate_queue_positions()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_salon_id uuid;
  v_date date;
BEGIN
  v_salon_id := COALESCE(NEW.salon_id, OLD.salon_id);
  v_date := DATE(COALESCE(NEW.check_in_time, OLD.check_in_time, NOW()));
  
  -- Update positions first, ordered by status (in_service -> called -> waiting) then check_in_time
  WITH ranked_entries AS (
    SELECT id, ROW_NUMBER() OVER (
      ORDER BY 
        CASE status 
          WHEN 'in_service' THEN 1 
          WHEN 'called' THEN 2 
          WHEN 'waiting' THEN 3 
          ELSE 4 
        END ASC,
        check_in_time ASC
    ) as new_position 
    FROM public.queue_entries 
    WHERE salon_id = v_salon_id 
      AND status IN ('waiting', 'called', 'in_service')
      AND DATE(check_in_time) = v_date
  )
  UPDATE public.queue_entries qe 
  SET position = re.new_position 
  FROM ranked_entries re 
  WHERE qe.id = re.id;
  
  -- Now calculate and update estimated wait times for all waiting/called entries
  UPDATE public.queue_entries qe
  SET estimated_wait_time = public.calculate_queue_entry_wait_time(qe.id),
      updated_at = NOW()
  WHERE qe.salon_id = v_salon_id 
    AND qe.status IN ('waiting', 'called')
    AND DATE(check_in_time) = v_date;
    
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Recreate trigger on queue_entries to fire on check_in_time updates as well.
-- This is crucial for manual reordering and walk-in first position updates.
DROP TRIGGER IF EXISTS trigger_recalculate_positions ON public.queue_entries;
CREATE TRIGGER trigger_recalculate_positions 
  AFTER INSERT OR DELETE OR UPDATE OF status, check_in_time ON public.queue_entries 
  FOR EACH ROW 
  EXECUTE FUNCTION public.recalculate_queue_positions();

-- 3. Recreate add_walkin_first_position without the duplicate insert race condition.
-- Instead, let the AFTER INSERT trigger on bookings handle the queue entry insert,
-- and then we simply update its check_in_time to be 1 second before the earliest active entry today.
CREATE OR REPLACE FUNCTION public.add_walkin_first_position(
  p_salon_id uuid,
  p_service_id uuid,
  p_customer_name text,
  p_phone text DEFAULT NULL
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  new_booking_id uuid;
  service_price decimal;
  v_earliest_time timestamptz;
  v_new_check_in timestamptz;
BEGIN
  -- Get service price
  SELECT price INTO service_price FROM public.salon_services WHERE id = p_service_id;

  -- Insert booking (trigger trigger_create_queue_on_booking_insert will automatically insert the queue entry)
  INSERT INTO public.bookings (
    salon_id, service_id, customer_id, booking_date, booking_time,
    status, total_price, notes
  )
  VALUES (
    p_salon_id, p_service_id, NULL, CURRENT_DATE, NOW()::TIME,
    'confirmed', COALESCE(service_price, 0),
    'Walk-in: ' || p_customer_name || COALESCE(' | Phone: ' || p_phone, '')
  )
  RETURNING id INTO new_booking_id;

  -- Find the earliest check_in_time of other active entries today
  SELECT MIN(check_in_time) INTO v_earliest_time
  FROM public.queue_entries
  WHERE salon_id = p_salon_id
    AND status IN ('waiting', 'called', 'in_service')
    AND DATE(check_in_time) = CURRENT_DATE
    AND booking_id != new_booking_id;

  -- Set check-in time of the new walk-in to 1 second before the earliest
  IF v_earliest_time IS NOT NULL THEN
    v_new_check_in := v_earliest_time - INTERVAL '1 second';
  ELSE
    v_new_check_in := NOW();
  END IF;

  -- Update check_in_time of the newly created queue entry.
  -- This fires trigger_recalculate_positions and places it at position 1.
  UPDATE public.queue_entries
  SET check_in_time = v_new_check_in
  WHERE booking_id = new_booking_id;

  RETURN new_booking_id;
END;
$$;

-- 4. Create the move_queue_entry RPC function to swap two adjacent entries' check_in_times.
CREATE OR REPLACE FUNCTION public.move_queue_entry(p_booking_id uuid, p_direction text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_curr_entry record;
  v_swap_entry record;
  v_temp_time timestamptz;
BEGIN
  -- Get current entry
  SELECT id, salon_id, position, check_in_time 
  INTO v_curr_entry
  FROM public.queue_entries
  WHERE booking_id = p_booking_id
    AND status IN ('waiting', 'called', 'in_service')
    AND DATE(check_in_time) = CURRENT_DATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Queue entry not found or not active';
  END IF;

  -- Find adjacent entry based on direction
  IF p_direction = 'up' THEN
    SELECT id, check_in_time
    INTO v_swap_entry
    FROM public.queue_entries
    WHERE salon_id = v_curr_entry.salon_id
      AND status IN ('waiting', 'called', 'in_service')
      AND DATE(check_in_time) = CURRENT_DATE
      AND position = v_curr_entry.position - 1;
  ELSIF p_direction = 'down' THEN
    SELECT id, check_in_time
    INTO v_swap_entry
    FROM public.queue_entries
    WHERE salon_id = v_curr_entry.salon_id
      AND status IN ('waiting', 'called', 'in_service')
      AND DATE(check_in_time) = CURRENT_DATE
      AND position = v_curr_entry.position + 1;
  ELSE
    RAISE EXCEPTION 'Invalid direction. Must be up or down';
  END IF;

  -- Swap check_in_times if neighbor exists
  IF FOUND THEN
    v_temp_time := v_curr_entry.check_in_time;
    
    UPDATE public.queue_entries
    SET check_in_time = v_swap_entry.check_in_time
    WHERE id = v_curr_entry.id;
    
    UPDATE public.queue_entries
    SET check_in_time = v_temp_time
    WHERE id = v_swap_entry.id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.move_queue_entry(uuid, text) TO authenticated;
