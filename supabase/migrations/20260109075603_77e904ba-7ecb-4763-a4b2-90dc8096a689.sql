-- Add avatar_url column to customers table
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create the customer-avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('customer-avatars', 'customer-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read customer avatars (public)
CREATE POLICY "Public read access for customer avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'customer-avatars');

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'customer-avatars' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'customer-avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'customer-avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);