-- Add RLS policies for salon owners to manage their salon hours
CREATE POLICY "Owners manage their salon hours"
ON public.salon_hours
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.salons s 
    WHERE s.id = salon_hours.salon_id 
    AND s.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.salons s 
    WHERE s.id = salon_hours.salon_id 
    AND s.owner_id = auth.uid()
  )
);

-- Add RLS policies for salon owners to manage their salon services
CREATE POLICY "Owners manage their salon services"
ON public.salon_services
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.salons s 
    WHERE s.id = salon_services.salon_id 
    AND s.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.salons s 
    WHERE s.id = salon_services.salon_id 
    AND s.owner_id = auth.uid()
  )
);