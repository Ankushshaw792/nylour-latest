-- 1. Drop existing functions so we can recreate them with updated logic
DROP FUNCTION IF EXISTS public.add_walkin_first_position(uuid, uuid, text, text);
DROP FUNCTION IF EXISTS public.recalculate_queue_positions();
DROP FUNCTION IF EXISTS public.move_queue_entry(uuid, text);
DROP FUNCTION IF EXISTS public.reorder_queue_entry(uuid, timestamptz);

-- 2. Recreate recalculate_queue_positions.
-- - Customers currently 'in_service' get position 0.
-- - Customers in 'called' or 'waiting' get sequential positions starting from 1.
CREATE OR REPLACE FUNCTION public.recalculate_queue_positions()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_salon_id uuid;
  v_date date;
BEGIN
  v_salon_id := COALESCE(NEW.salon_id, OLD.salon_id);
  v_date := DATE(COALESCE(NEW.check_in_time, OLD.check_in_time, NOW()));
  
  -- Update positions:
  -- - 'in_service' entries get position 0 (since they are actively being served).
  -- - 'called' and 'waiting' entries get sequential positions starting from 1.
  WITH active_entries AS (
    SELECT id,
      ROW_NUMBER() OVER (
        ORDER BY 
          CASE status 
            WHEN 'called' THEN 1 
            WHEN 'waiting' THEN 2 
            ELSE 3 
          END ASC,
          check_in_time ASC
      ) as waiting_rank
    FROM public.queue_entries
    WHERE salon_id = v_salon_id 
      AND status IN ('waiting', 'called')
      AND DATE(check_in_time) = v_date
  ),
  ranked_entries AS (
    SELECT id, 0 as new_position 
    FROM public.queue_entries
    WHERE salon_id = v_salon_id 
      AND status = 'in_service'
      AND DATE(check_in_time) = v_date
    UNION ALL
    SELECT id, waiting_rank as new_position
    FROM active_entries
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
DROP TRIGGER IF EXISTS trigger_recalculate_positions ON public.queue_entries;
CREATE TRIGGER trigger_recalculate_positions 
  AFTER INSERT OR DELETE OR UPDATE OF status, check_in_time ON public.queue_entries 
  FOR EACH ROW 
  EXECUTE FUNCTION public.recalculate_queue_positions();

-- 3. Recreate add_walkin_first_position.
-- It inserts the booking which automatically creates the queue entry,
-- then shifts its check_in_time to 1 second before the earliest active waiting/called entry.
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

  -- Find the earliest check_in_time of other active waiting/called entries today
  SELECT MIN(check_in_time) INTO v_earliest_time
  FROM public.queue_entries
  WHERE salon_id = p_salon_id
    AND status IN ('waiting', 'called')
    AND DATE(check_in_time) = CURRENT_DATE
    AND booking_id != new_booking_id;

  -- Set check-in time of the new walk-in to 1 second before the earliest
  IF v_earliest_time IS NOT NULL THEN
    v_new_check_in := v_earliest_time - INTERVAL '1 second';
  ELSE
    v_new_check_in := NOW();
  END IF;

  -- Update check_in_time of the newly created queue entry
  UPDATE public.queue_entries
  SET check_in_time = v_new_check_in
  WHERE booking_id = new_booking_id;

  RETURN new_booking_id;
END;
$$;

-- 4. Create the reorder_queue_entry RPC function to update a queue entry's check_in_time.
CREATE OR REPLACE FUNCTION public.reorder_queue_entry(p_booking_id uuid, p_new_time timestamptz)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE public.queue_entries
  SET check_in_time = p_new_time
  WHERE booking_id = p_booking_id
    AND status IN ('waiting', 'called');
END;
$$;

GRANT EXECUTE ON FUNCTION public.reorder_queue_entry(uuid, timestamptz) TO authenticated;
