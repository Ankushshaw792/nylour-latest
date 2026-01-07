-- Allow authenticated users to insert new services (for custom services during registration)
CREATE POLICY "Authenticated users can create services"
ON public.services
FOR INSERT
TO authenticated
WITH CHECK (true);