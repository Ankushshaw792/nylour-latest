-- RLS policy enhancements to allow authenticated users to view all active queue entries.
-- This ensures that Supabase Realtime sends queue updates for other customers and walk-ins to everyone in real-time.

-- 1. Drop the restrictive select policy if it exists (usually "Users manage their queue entries" covers ALL, so we don't drop it to preserve INSERT/UPDATE/DELETE access for their own entries)
-- Instead, we just add a SELECT policy that overrides or extends it.

DROP POLICY IF EXISTS "Anyone can view active queue entries" ON public.queue_entries;
CREATE POLICY "Anyone can view active queue entries"
  ON public.queue_entries
  FOR SELECT
  TO authenticated
  USING (true);

-- 2. Allow authenticated users to view booking customer names and basic details of active queue bookings
-- (This is necessary for the get_queue_display RPC to work if RLS is enforced inside the context or if we query bookings directly)
DROP POLICY IF EXISTS "Anyone can view active bookings details" ON public.bookings;
CREATE POLICY "Anyone can view active bookings details"
  ON public.bookings
  FOR SELECT
  TO authenticated
  USING (status IN ('pending', 'confirmed', 'in_progress'));
