-- Create storage bucket for salon images
INSERT INTO storage.buckets (id, name, public)
VALUES ('salon-images', 'salon-images', true);

-- RLS policy to allow authenticated users to upload
CREATE POLICY "Authenticated users can upload salon images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'salon-images' AND auth.role() = 'authenticated');

-- RLS policy to allow salon owners to delete their images
CREATE POLICY "Salon owners can delete their images"
ON storage.objects FOR DELETE
USING (bucket_id = 'salon-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access
CREATE POLICY "Public read access for salon images"
ON storage.objects FOR SELECT
USING (bucket_id = 'salon-images');

-- Create salon_images table
CREATE TABLE public.salon_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.salon_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view salon images"
ON public.salon_images FOR SELECT USING (true);

CREATE POLICY "Salon owners can manage their images"
ON public.salon_images FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.salons
  WHERE salons.id = salon_images.salon_id
  AND salons.owner_id = auth.uid()
));