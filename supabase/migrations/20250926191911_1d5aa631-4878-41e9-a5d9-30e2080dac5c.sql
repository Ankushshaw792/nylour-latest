-- Fix the expire_old_queue_entries function to use valid enum values
CREATE OR REPLACE FUNCTION public.expire_old_queue_entries()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Update expired queue entries to completed status (not cancelled which is invalid)
  UPDATE public.queue_entries 
  SET status = 'completed'
  WHERE status = 'waiting' 
    AND expires_at < now();
    
  -- Also update related bookings to expired status
  UPDATE public.bookings
  SET status = 'cancelled'
  WHERE status IN ('pending', 'confirmed')
    AND created_at < (now() - interval '1 hour');
END;
$function$