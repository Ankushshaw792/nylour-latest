-- Function to send proximity notifications
CREATE OR REPLACE FUNCTION public.send_proximity_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  entry_record RECORD;
  wait_minutes integer;
BEGIN
  -- Check all waiting queue entries
  FOR entry_record IN 
    SELECT qe.*, c.first_name, c.last_name
    FROM public.queue_entries qe
    JOIN public.customers c ON qe.customer_id = c.user_id
    WHERE qe.status = 'waiting'
  LOOP
    wait_minutes := public.calculate_dynamic_wait_time(entry_record.salon_id, entry_record.customer_id);
    
    -- Send 20-minute notification
    IF wait_minutes <= 20 AND wait_minutes > 15 
       AND NOT (entry_record.notification_sent->>'"twenty_min"')::boolean THEN
      INSERT INTO public.notifications (user_id, title, message, type, related_id)
      VALUES (
        entry_record.customer_id,
        'Almost Your Turn!',
        'Your service will begin in approximately 20 minutes. Please prepare to head to the salon.',
        'queue_update',
        entry_record.id
      );
      
      UPDATE public.queue_entries 
      SET notification_sent = notification_sent || '"{"twenty_min": true}"'
      WHERE id = entry_record.id;
    END IF;
    
    -- Send 5-minute notification
    IF wait_minutes <= 5 AND wait_minutes > 0
       AND NOT (entry_record.notification_sent->>'"five_min"')::boolean THEN
      INSERT INTO public.notifications (user_id, title, message, type, related_id)
      VALUES (
        entry_record.customer_id,
        'You are Next!',
        'Please head to the salon now. Your service will begin in about 5 minutes.',
        'queue_update',
        entry_record.id
      );
      
      UPDATE public.queue_entries 
      SET notification_sent = notification_sent || '"{"five_min": true}"'
      WHERE id = entry_record.id;
    END IF;
  END LOOP;
END;
$function$;

-- Function for salon owners to send custom notifications
CREATE OR REPLACE FUNCTION public.send_custom_notification(
  p_salon_id uuid,
  p_message text,
  p_title text DEFAULT 'Message from Salon'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if user is salon owner
  IF NOT EXISTS (
    SELECT 1 FROM public.salons 
    WHERE id = p_salon_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only salon owners can send notifications';
  END IF;
  
  -- Send notification to all waiting customers
  INSERT INTO public.notifications (user_id, title, message, type, related_id)
  SELECT 
    qe.customer_id,
    p_title,
    p_message,
    'general',
    qe.id
  FROM public.queue_entries qe
  WHERE qe.salon_id = p_salon_id 
    AND qe.status = 'waiting';
END;
$function$;