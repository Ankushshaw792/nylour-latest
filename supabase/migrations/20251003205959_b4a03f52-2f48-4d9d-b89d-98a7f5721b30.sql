-- Add image_url column to salon_services table
ALTER TABLE public.salon_services 
ADD COLUMN image_url TEXT;

-- Create storage bucket for service images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'service-images',
  'service-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);

-- RLS policies for service images bucket
CREATE POLICY "Service images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'service-images');

CREATE POLICY "Salon owners can upload service images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'service-images' 
  AND auth.uid() IN (
    SELECT owner_id FROM public.salons
  )
);

CREATE POLICY "Salon owners can update their service images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'service-images'
  AND auth.uid() IN (
    SELECT owner_id FROM public.salons
  )
);

CREATE POLICY "Salon owners can delete their service images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'service-images'
  AND auth.uid() IN (
    SELECT owner_id FROM public.salons
  )
);