-- Drop the existing function
DROP FUNCTION IF EXISTS public.get_queue_display(uuid, date);

-- Recreate the function with status and estimated_wait_time columns
CREATE OR REPLACE FUNCTION public.get_queue_display(p_salon_id uuid, p_date date DEFAULT CURRENT_DATE)
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
  ORDER BY qe.position ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_queue_display(uuid, date) TO authenticated;
