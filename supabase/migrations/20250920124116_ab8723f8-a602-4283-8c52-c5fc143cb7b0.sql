-- Add favorite_services and preferred_time fields to customers table
ALTER TABLE public.customers 
ADD COLUMN favorite_services JSONB DEFAULT '[]'::jsonb,
ADD COLUMN preferred_time TEXT;