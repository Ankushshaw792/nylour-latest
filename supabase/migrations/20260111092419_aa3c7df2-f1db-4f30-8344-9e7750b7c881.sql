-- Add tutorial tracking to customers table
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS has_completed_tutorial BOOLEAN DEFAULT false;

-- Add tutorial tracking to salons table
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS has_completed_tutorial BOOLEAN DEFAULT false;