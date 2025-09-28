-- Enhanced wait time calculation function
CREATE OR REPLACE FUNCTION public.calculate_dynamic_wait_time(p_salon_id uuid, p_customer_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  customer_position integer;
  total_wait_minutes integer := 0;
  service_duration integer;
  current_service_remaining integer := 0;
BEGIN
  -- Get customer's position in queue
  SELECT 
    ROW_NUMBER() OVER (ORDER BY qe.joined_at) INTO customer_position
  FROM public.queue_entries qe
  WHERE qe.salon_id = p_salon_id 
    AND qe.status = 'waiting'
    AND qe.customer_id = p_customer_id;
  
  -- If not found or first in line, return 0
  IF customer_position IS NULL OR customer_position <= 1 THEN
    RETURN 0;
  END IF;
  
  -- Calculate total wait time based on services ahead
  SELECT 
    COALESCE(SUM(ss.duration), 30 * (customer_position - 1)) INTO total_wait_minutes
  FROM public.queue_entries qe
  JOIN public.salon_services ss ON qe.service_id = ss.service_id AND ss.salon_id = qe.salon_id
  WHERE qe.salon_id = p_salon_id 
    AND qe.status = 'waiting'
    AND qe.joined_at < (
      SELECT joined_at 
      FROM public.queue_entries 
      WHERE salon_id = p_salon_id AND customer_id = p_customer_id AND status = 'waiting'
    );
  
  -- Add time for any current service in progress
  SELECT COALESCE(
    GREATEST(0, ss.duration - EXTRACT(EPOCH FROM (now() - qe.started_at))/60),
    0
  ) INTO current_service_remaining
  FROM public.queue_entries qe
  JOIN public.salon_services ss ON qe.service_id = ss.service_id AND ss.salon_id = qe.salon_id
  WHERE qe.salon_id = p_salon_id 
    AND qe.status = 'in_service'
  LIMIT 1;
  
  RETURN COALESCE(total_wait_minutes + current_service_remaining, 0);
END;
$function$;

-- Enhanced queue position calculation
CREATE OR REPLACE FUNCTION public.calculate_queue_position(p_salon_id uuid, p_customer_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  position_count integer;
BEGIN
  SELECT ROW_NUMBER() OVER (ORDER BY qe.joined_at) INTO position_count
  FROM public.queue_entries qe
  WHERE qe.salon_id = p_salon_id 
    AND qe.status = 'waiting'
    AND qe.customer_id = p_customer_id;
  
  RETURN COALESCE(position_count, 1);
END;
$function$;

-- Update estimated times for all queue entries
CREATE OR REPLACE FUNCTION public.update_queue_estimated_times()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.queue_entries 
  SET estimated_wait_time = public.calculate_dynamic_wait_time(salon_id, customer_id)
  WHERE status = 'waiting';
END;
$function$;