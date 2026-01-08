-- Drop the existing permissive upload policy
DROP POLICY IF EXISTS "Authenticated users can upload salon images" ON storage.objects;

-- Drop the existing delete policy to replace with more robust version
DROP POLICY IF EXISTS "Salon owners can delete their images" ON storage.objects;

-- Create restricted upload policy - only salon owners can upload to their salon's folder
CREATE POLICY "Salon owners can upload salon images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'salon-images'
  AND auth.uid() IN (SELECT owner_id FROM public.salons)
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.salons WHERE owner_id = auth.uid()
  )
);

-- Create more robust delete policy - salon owners can only delete images from their salon's folder
CREATE POLICY "Salon owners can delete their salon images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'salon-images'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.salons WHERE owner_id = auth.uid()
  )
);

-- Update policy for salon owners to manage (update) their images
DROP POLICY IF EXISTS "Salon owners can update their images" ON storage.objects;

CREATE POLICY "Salon owners can update their salon images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'salon-images'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.salons WHERE owner_id = auth.uid()
  )
);