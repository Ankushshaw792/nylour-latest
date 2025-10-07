-- 1) Add missing enum value for queue_status to fix "invalid input value for enum queue_status: 'in_service'"
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid 
    WHERE t.typname = 'queue_status' AND e.enumlabel = 'in_service'
  ) THEN
    ALTER TYPE public.queue_status ADD VALUE 'in_service';
  END IF;
END$$;

-- 2) Allow salon owners to manage queue entries for their salon (prevents RLS errors when updating statuses)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'queue_entries' 
      AND policyname = 'Salon owners manage their queue entries'
  ) THEN
    CREATE POLICY "Salon owners manage their queue entries"
    ON public.queue_entries
    FOR ALL
    USING (
      salon_id IN (
        SELECT id FROM public.salons WHERE owner_id = auth.uid()
      )
    )
    WITH CHECK (
      salon_id IN (
        SELECT id FROM public.salons WHERE owner_id = auth.uid()
      )
    );
  END IF;
END$$;