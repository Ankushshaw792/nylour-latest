-- Create function to recalculate queue positions after status changes
CREATE OR REPLACE FUNCTION public.recalculate_queue_positions()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate positions for all active entries in this salon
  WITH ranked_entries AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY check_in_time ASC) as new_position
    FROM public.queue_entries
    WHERE salon_id = COALESCE(NEW.salon_id, OLD.salon_id)
      AND status IN ('waiting', 'called', 'in_service')
  )
  UPDATE public.queue_entries qe
  SET position = re.new_position,
      estimated_wait_time = (re.new_position - 1) * 
        COALESCE((SELECT avg_service_time FROM public.salons WHERE id = qe.salon_id), 30),
      updated_at = NOW()
  FROM ranked_entries re
  WHERE qe.id = re.id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-recalculate positions when status changes
DROP TRIGGER IF EXISTS trigger_recalculate_positions ON public.queue_entries;
CREATE TRIGGER trigger_recalculate_positions
  AFTER UPDATE OF status ON public.queue_entries
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.recalculate_queue_positions();

-- Fix all existing queue positions now (one-time cleanup)
WITH ranked_entries AS (
  SELECT 
    id,
    salon_id,
    ROW_NUMBER() OVER (PARTITION BY salon_id ORDER BY check_in_time ASC) as new_position
  FROM public.queue_entries
  WHERE status IN ('waiting', 'called', 'in_service')
)
UPDATE public.queue_entries qe
SET position = re.new_position,
    estimated_wait_time = (re.new_position - 1) * 
      COALESCE((SELECT avg_service_time FROM public.salons WHERE id = qe.salon_id), 30),
    updated_at = NOW()
FROM ranked_entries re
WHERE qe.id = re.id;