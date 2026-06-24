-- 1. Drop existing functions to avoid signature conflicts
DROP FUNCTION IF EXISTS public.recalculate_queue_positions() CASCADE;
DROP FUNCTION IF EXISTS public.calculate_queue_entry_wait_time(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.handle_queue_position_change() CASCADE;

-- 2. Create the updated recalculate_queue_positions function
CREATE OR REPLACE FUNCTION public.recalculate_queue_positions()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_salon_id uuid;
  v_date date;
BEGIN
  v_salon_id := COALESCE(NEW.salon_id, OLD.salon_id);
  v_date := DATE(COALESCE(NEW.check_in_time, OLD.check_in_time, NOW()));
  
  -- Update positions:
  -- - 'in_service' entries get sequential positions starting from 1 (ordered by service_start_time, check_in_time)
  -- - 'called' and 'waiting' entries get sequential positions starting after the last 'in_service' entry
  WITH in_service_entries AS (
    SELECT id,
      ROW_NUMBER() OVER (
        ORDER BY COALESCE(service_start_time, check_in_time) ASC, check_in_time ASC
      ) as service_rank
    FROM public.queue_entries
    WHERE salon_id = v_salon_id 
      AND status = 'in_service'
      AND DATE(check_in_time) = v_date
  ),
  waiting_entries AS (
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
    SELECT id, service_rank as new_position
    FROM in_service_entries
    UNION ALL
    SELECT id, (waiting_rank + (SELECT COALESCE(MAX(service_rank), 0) FROM in_service_entries)) as new_position
    FROM waiting_entries
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

-- Recreate trigger on queue_entries to fire on status and check_in_time updates
CREATE TRIGGER trigger_recalculate_positions 
  AFTER INSERT OR DELETE OR UPDATE OF status, check_in_time ON public.queue_entries 
  FOR EACH ROW 
  EXECUTE FUNCTION public.recalculate_queue_positions();

-- 3. Create the updated calculate_queue_entry_wait_time function using position directly
CREATE OR REPLACE FUNCTION public.calculate_queue_entry_wait_time(p_queue_entry_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_salon_id uuid;
  v_position integer;
  v_check_in_time timestamptz;
  v_total_wait integer := 0;
  v_avg_service_time integer;
  v_ahead_record RECORD;
BEGIN
  -- Get salon_id, position, and check_in_time of the target entry
  SELECT salon_id, position, check_in_time INTO v_salon_id, v_position, v_check_in_time 
  FROM public.queue_entries WHERE id = p_queue_entry_id;
  
  -- Get the salon's avg_service_time setting (default to 30 if null or 0)
  SELECT COALESCE(NULLIF(avg_service_time, 0), 30) INTO v_avg_service_time 
  FROM public.salons WHERE id = v_salon_id;
  
  -- Loop through all entries ahead in the queue (position < target position, active status)
  FOR v_ahead_record IN 
    SELECT qe.id, qe.booking_id, qe.status, qe.service_start_time
    FROM public.queue_entries qe
    WHERE qe.salon_id = v_salon_id 
      AND qe.status IN ('waiting', 'called', 'in_service')
      AND qe.position < v_position
      AND DATE(qe.check_in_time) = DATE(v_check_in_time)
  LOOP
    DECLARE
      v_duration integer := v_avg_service_time; -- Use the salon's avg_service_time as the default
    BEGIN
      IF v_ahead_record.booking_id IS NOT NULL THEN
        -- If it is an online customer, get the actual service duration
        -- If it's a walk-in, force it to use v_avg_service_time (which defaults to 30)
        IF EXISTS (
          SELECT 1 FROM public.bookings 
          WHERE id = v_ahead_record.booking_id 
            AND (customer_id IS NULL OR notes LIKE 'Walk-in:%')
        ) THEN
          v_duration := v_avg_service_time;
        ELSE
          SELECT COALESCE(NULLIF(duration, 0), v_avg_service_time) INTO v_duration 
          FROM public.bookings WHERE id = v_ahead_record.booking_id;
        END IF;
      END IF;
      
      -- Subtract elapsed time if the booking is currently 'in_service'
      IF v_ahead_record.status = 'in_service' AND v_ahead_record.service_start_time IS NOT NULL THEN
        DECLARE
          v_elapsed integer;
        BEGIN
          v_elapsed := EXTRACT(EPOCH FROM (NOW() - v_ahead_record.service_start_time)) / 60;
          v_duration := GREATEST(0, v_duration - v_elapsed);
        END;
      END IF;
      
      v_total_wait := v_total_wait + v_duration;
    END;
  END LOOP;
  
  RETURN v_total_wait;
END;
$$;

-- 4. Create the updated handle_queue_position_change function resolving user_id
CREATE OR REPLACE FUNCTION public.handle_queue_position_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- If position changes, and status is waiting/called, and customer_id is not null (online customer)
  IF (OLD.position IS NULL OR NEW.position != OLD.position)
     AND NEW.status IN ('waiting', 'called')
     AND NEW.customer_id IS NOT NULL THEN
     
    -- Get the auth user_id for this customer
    SELECT user_id INTO v_user_id 
    FROM public.customers 
    WHERE id = NEW.customer_id;
    
    IF v_user_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, type, related_id)
      VALUES (
        v_user_id,
        'Queue Position Updated ⏱️',
        'Your position in the queue has changed to #' || NEW.position || '.',
        'queue_update',
        NEW.booking_id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate trigger on queue_entries for position updates
CREATE TRIGGER trigger_queue_position_change
  BEFORE UPDATE OF position ON public.queue_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_queue_position_change();
