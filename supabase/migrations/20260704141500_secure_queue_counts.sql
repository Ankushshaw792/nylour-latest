-- Create SECURE functions to fetch active queue entries bypassing RLS restrictions.
-- This ensures queue count calculations are correct and identical for all users.

-- 1. Helper to get active queue entries for multiple salons today (timezone safe)
CREATE OR REPLACE FUNCTION public.get_active_salon_queues(
  p_salon_ids uuid[], 
  p_date_start timestamptz
)
RETURNS TABLE (
  id uuid,
  salon_id uuid,
  status text,
  staff_id uuid
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT qe.id, qe.salon_id, qe.status::text, qe.staff_id
  FROM public.queue_entries qe
  WHERE qe.salon_id = ANY(p_salon_ids)
    AND qe.status IN ('waiting', 'called', 'in_service')
    AND qe.check_in_time >= p_date_start;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_active_salon_queues(uuid[], timestamptz) TO authenticated, anon;


-- 2. Helper to get full queue details for a single salon today (timezone safe)
CREATE OR REPLACE FUNCTION public.get_active_queue_entries(
  p_salon_id uuid, 
  p_date_start timestamptz
)
RETURNS TABLE (
  id uuid,
  booking_id uuid,
  salon_id uuid,
  customer_id uuid,
  queue_position integer,
  status text,
  estimated_wait_time integer,
  check_in_time timestamptz,
  staff_id uuid
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT qe.id, qe.booking_id, qe.salon_id, qe.customer_id, qe.position, qe.status::text, qe.estimated_wait_time, qe.check_in_time, qe.staff_id
  FROM public.queue_entries qe
  WHERE qe.salon_id = p_salon_id
    AND qe.status IN ('waiting', 'called', 'in_service')
    AND qe.check_in_time >= p_date_start;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_active_queue_entries(uuid, timestamptz) TO authenticated, anon;
