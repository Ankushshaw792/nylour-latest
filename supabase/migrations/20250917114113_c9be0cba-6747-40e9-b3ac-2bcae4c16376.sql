-- Add expires_at field to queue_entries table for 1-hour expiration
ALTER TABLE public.queue_entries 
ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '1 hour');

-- Update existing records to have expiration time
UPDATE public.queue_entries 
SET expires_at = joined_at + interval '1 hour' 
WHERE expires_at IS NULL;

-- Create function to automatically expire old queue entries
CREATE OR REPLACE FUNCTION public.expire_old_queue_entries()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Create a trigger to automatically set expires_at on new queue entries
CREATE OR REPLACE FUNCTION public.set_queue_expiration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.expires_at = NEW.joined_at + interval '1 hour';
  RETURN NEW;
END;
$function$;

CREATE TRIGGER set_queue_expiration_trigger
  BEFORE INSERT ON public.queue_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.set_queue_expiration();