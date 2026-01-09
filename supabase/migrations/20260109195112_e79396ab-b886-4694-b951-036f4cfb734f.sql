-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Create policy: Salon owners can notify customers in their queue
CREATE POLICY "Salon owners can notify their queue customers"
ON public.notifications
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM queue_entries qe
    JOIN salons s ON s.id = qe.salon_id
    JOIN customers c ON c.id = qe.customer_id
    WHERE c.user_id = notifications.user_id
    AND s.owner_id = auth.uid()
    AND qe.status IN ('waiting', 'called', 'in_service')
  )
);

-- Note: SECURITY DEFINER functions (like expire_overdue_arrivals, add_walkin_first_position, notify_next_customer) 
-- bypass RLS by default, so they will continue to work for system-generated notifications