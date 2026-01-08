-- Add image_url and display_order columns to salon_services for image support and drag-to-reorder
ALTER TABLE public.salon_services ADD COLUMN image_url TEXT;
ALTER TABLE public.salon_services ADD COLUMN display_order INTEGER DEFAULT 0;