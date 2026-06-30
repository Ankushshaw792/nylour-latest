-- SQL Migration: Stylist-Level Queue and Booking System
-- File: 20260625131000_stylist_level_queues.sql

-- 1. Drop existing functions so we can recreate them with updated logic
DROP FUNCTION IF EXISTS public.create_queue_entry_on_booking_insert() CASCADE;
DROP FUNCTION IF EXISTS public.recalculate_queue_positions() CASCADE;
DROP FUNCTION IF EXISTS public.calculate_queue_entry_wait_time(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_queue_display(uuid, date) CASCADE;
DROP FUNCTION IF EXISTS public.get_queue_display(uuid, date, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.add_walkin_first_position(uuid, uuid, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.add_walkin_first_position(uuid, uuid, text, text, uuid) CASCADE;

-- 2. Recreate calculate_queue_entry_wait_time function (Stylist-scoped)
CREATE OR REPLACE FUNCTION public.calculate_queue_entry_wait_time(p_queue_entry_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_salon_id uuid;
  v_staff_id uuid;
  v_check_in_time timestamptz;
  v_total_wait integer := 0;
  v_avg_service_time integer;
  v_ahead_record RECORD;
BEGIN
  -- Get salon_id, staff_id, and check_in_time of the target entry
  SELECT salon_id, staff_id, check_in_time INTO v_salon_id, v_staff_id, v_check_in_time 
  FROM public.queue_entries WHERE id = p_queue_entry_id;
  
  -- If there is no stylist assigned, return 0
  IF v_staff_id IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Get the salon's avg_service_time setting (default to 30 if null or 0)
  SELECT COALESCE(NULLIF(avg_service_time, 0), 30) INTO v_avg_service_time 
  FROM public.salons WHERE id = v_salon_id;
  
  -- Loop through all entries ahead in the queue FOR THE SAME STYLIST (same day, older check_in, active status)
  FOR v_ahead_record IN 
    SELECT qe.id, qe.booking_id, qe.status, qe.service_start_time
    FROM public.queue_entries qe
    WHERE qe.salon_id = v_salon_id 
      AND qe.staff_id = v_staff_id
      AND qe.status IN ('waiting', 'called', 'in_service')
      AND qe.check_in_time < v_check_in_time
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

-- 3. Recreate recalculate_queue_positions trigger function (Stylist-partitioned)
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
  -- - 'called' and 'waiting' entries get sequential positions starting from 1, partitioned by staff_id.
  WITH active_entries AS (
    SELECT id,
      ROW_NUMBER() OVER (
        PARTITION BY staff_id
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

-- Recreate trigger on queue_entries
DROP TRIGGER IF EXISTS trigger_recalculate_positions ON public.queue_entries;
CREATE TRIGGER trigger_recalculate_positions 
  AFTER INSERT OR DELETE OR UPDATE OF status, check_in_time, staff_id ON public.queue_entries 
  FOR EACH ROW 
  EXECUTE FUNCTION public.recalculate_queue_positions();

-- 4. Recreate create_queue_entry_on_booking_insert (with Auto-Assign 'Any Stylist' logic)
CREATE OR REPLACE FUNCTION public.create_queue_entry_on_booking_insert()
RETURNS TRIGGER AS $$
DECLARE
  next_position INTEGER;
  v_staff_id UUID;
BEGIN
  -- Only proceed if booking is confirmed
  IF NEW.status = 'confirmed' THEN
    -- Set arrival_deadline for online bookings if not set
    IF NEW.customer_id IS NOT NULL AND NEW.arrival_deadline IS NULL THEN
      UPDATE public.bookings 
      SET arrival_deadline = NOW() + INTERVAL '10 minutes'
      WHERE id = NEW.id;
    END IF;
    
    -- Check if queue entry already exists for this booking
    IF NOT EXISTS (SELECT 1 FROM public.queue_entries WHERE booking_id = NEW.id) THEN
      v_staff_id := NEW.staff_id;
      
      -- Auto-assign staff_id if not selected (representing Any Stylist / fastest option)
      IF v_staff_id IS NULL THEN
        SELECT id INTO v_staff_id
        FROM (
          SELECT ss.id, COALESCE(COUNT(qe.id), 0) as active_count
          FROM public.salon_staff ss
          LEFT JOIN public.queue_entries qe ON qe.staff_id = ss.id AND qe.status IN ('waiting', 'called', 'in_service')
          WHERE ss.salon_id = NEW.salon_id AND ss.is_active = TRUE
          GROUP BY ss.id
          ORDER BY active_count ASC, ss.name ASC
          LIMIT 1
        ) least_busy;
        
        -- Update the booking record to reflect the assigned stylist
        UPDATE public.bookings 
        SET staff_id = v_staff_id
        WHERE id = NEW.id;
      END IF;
      
      -- Calculate next position for this specific stylist's queue
      SELECT COALESCE(MAX(position), 0) + 1 INTO next_position
      FROM public.queue_entries
      WHERE salon_id = NEW.salon_id
        AND staff_id = v_staff_id
        AND status IN ('waiting', 'called', 'in_service');
      
      -- Insert queue entry with staff_id copied from booking
      INSERT INTO public.queue_entries (
        booking_id,
        salon_id,
        customer_id,
        staff_id,
        position,
        status,
        estimated_wait_time,
        check_in_time
      ) VALUES (
        NEW.id,
        NEW.salon_id,
        NEW.customer_id,
        v_staff_id,
        next_position,
        'waiting',
        0, -- recalculated dynamically
        now()
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate trigger on bookings
DROP TRIGGER IF EXISTS trigger_create_queue_on_booking_insert ON public.bookings;
CREATE TRIGGER trigger_create_queue_on_booking_insert
  AFTER INSERT OR UPDATE OF status ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.create_queue_entry_on_booking_insert();

-- 5. Recreate get_queue_display RPC (with optional p_staff_id support)
CREATE OR REPLACE FUNCTION public.get_queue_display(
  p_salon_id uuid, 
  p_date date DEFAULT CURRENT_DATE,
  p_staff_id uuid DEFAULT NULL
)
RETURNS TABLE (
  queue_entry_id uuid,
  booking_id uuid,
  queue_position integer,
  queue_status text,
  check_in_time timestamptz,
  display_name text,
  service_summary text,
  is_walk_in boolean,
  avatar_url text,
  party_size integer,
  estimated_wait_time integer
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  current_user_id uuid;
BEGIN
  SELECT c.id INTO current_user_id FROM customers c WHERE c.user_id = auth.uid();
  
  RETURN QUERY
  SELECT 
    qe.id, 
    qe.booking_id, 
    qe.position, 
    qe.status::text,
    qe.check_in_time,
    CASE 
      WHEN qe.customer_id IS NULL OR b.notes LIKE 'Walk-in:%' THEN COALESCE(NULLIF(TRIM(SPLIT_PART(SPLIT_PART(b.notes, 'Walk-in:', 2), ' - ', 1)), ''), 'Walk-in')
      WHEN c.first_name IS NOT NULL AND c.first_name != '' THEN c.first_name || COALESCE(' ' || LEFT(c.last_name, 1) || '.', '') 
      ELSE 'Customer' 
    END,
    COALESCE(
      (SELECT CASE WHEN COUNT(*) = 1 THEN MAX(srv.name) ELSE MAX(srv.name) || ' +' || (COUNT(*) - 1)::text || ' more' END 
       FROM booking_services bs 
       JOIN salon_services ss ON ss.id = bs.salon_service_id 
       JOIN services srv ON srv.id = ss.service_id 
       WHERE bs.booking_id = b.id),
      (SELECT srv.name 
       FROM salon_services ss 
       JOIN services srv ON srv.id = ss.service_id 
       WHERE ss.id = b.service_id), 
      'Service'
    ),
    (qe.customer_id IS NULL OR b.notes LIKE 'Walk-in:%'),
    CASE WHEN qe.customer_id = current_user_id THEN c.avatar_url ELSE NULL END,
    COALESCE(b.party_size, 1),
    COALESCE(qe.estimated_wait_time, 0)
  FROM queue_entries qe 
  LEFT JOIN bookings b ON b.id = qe.booking_id 
  LEFT JOIN customers c ON c.id = qe.customer_id
  WHERE qe.salon_id = p_salon_id 
    AND qe.status IN ('waiting', 'called', 'in_service') 
    AND DATE(qe.check_in_time) = p_date 
    AND (p_staff_id IS NULL OR qe.staff_id = p_staff_id)
  ORDER BY qe.position ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_queue_display(uuid, date, uuid) TO authenticated;

-- 6. Recreate add_walkin_first_position RPC (with stylist-specific logic)
CREATE OR REPLACE FUNCTION public.add_walkin_first_position(
  p_salon_id uuid,
  p_service_id uuid,
  p_customer_name text,
  p_phone text DEFAULT NULL,
  p_staff_id uuid DEFAULT NULL
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  new_booking_id uuid;
  service_price decimal;
  v_earliest_time timestamptz;
  v_new_check_in timestamptz;
  v_staff_id uuid := p_staff_id;
BEGIN
  -- Get service price
  SELECT price INTO service_price FROM public.salon_services WHERE id = p_service_id;

  -- If no staff member selected, auto-assign fastest stylist
  IF v_staff_id IS NULL THEN
    SELECT id INTO v_staff_id
    FROM (
      SELECT ss.id, COALESCE(COUNT(qe.id), 0) as active_count
      FROM public.salon_staff ss
      LEFT JOIN public.queue_entries qe ON qe.staff_id = ss.id AND qe.status IN ('waiting', 'called', 'in_service')
      WHERE ss.salon_id = p_salon_id AND ss.is_active = TRUE
      GROUP BY ss.id
      ORDER BY active_count ASC, ss.name ASC
      LIMIT 1
    ) least_busy;
  END IF;

  -- Insert booking (trigger trigger_create_queue_on_booking_insert will automatically insert the queue entry)
  INSERT INTO public.bookings (
    salon_id, service_id, customer_id, staff_id, booking_date, booking_time,
    status, total_price, notes
  )
  VALUES (
    p_salon_id, p_service_id, NULL, v_staff_id, CURRENT_DATE, NOW()::TIME,
    'confirmed', COALESCE(service_price, 0),
    'Walk-in: ' || p_customer_name || COALESCE(' | Phone: ' || p_phone, '')
  )
  RETURNING id INTO new_booking_id;

  -- Find the earliest check_in_time of other active waiting/called entries today FOR THE SAME STYLIST
  SELECT MIN(check_in_time) INTO v_earliest_time
  FROM public.queue_entries
  WHERE salon_id = p_salon_id
    AND staff_id = v_staff_id
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

GRANT EXECUTE ON FUNCTION public.add_walkin_first_position(uuid, uuid, text, text, uuid) TO authenticated;
