-- Fix the search_path for the new functions to address security warning
CREATE OR REPLACE FUNCTION public.expire_old_queue_entries()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update expired queue entries to cancelled status
  UPDATE public.queue_entries 
  SET status = 'cancelled'
  WHERE status = 'waiting' 
    AND expires_at < now();
    
  -- Also update related bookings to expired status
  UPDATE public.bookings
  SET status = 'cancelled'
  WHERE status IN ('pending', 'confirmed')
    AND created_at < (now() - interval '1 hour');
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_queue_expiration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.expires_at = NEW.joined_at + interval '1 hour';
  RETURN NEW;
END;
$function$;