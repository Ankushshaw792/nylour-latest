-- Fix missing INSERT policy for queue_entries table
-- The existing "Users manage their queue entries" policy has USING but no WITH CHECK
-- For INSERT operations, we need WITH CHECK expression

DROP POLICY IF EXISTS "Users manage their queue entries" ON public.queue_entries;

-- Recreate with proper WITH CHECK for INSERT operations
CREATE POLICY "Users manage their queue entries" 
ON public.queue_entries 
FOR ALL
USING (customer_id = auth.uid())
WITH CHECK (customer_id = auth.uid());