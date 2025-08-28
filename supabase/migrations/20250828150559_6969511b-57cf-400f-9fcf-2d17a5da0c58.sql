-- Add missing booking status values
ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'rejected';
ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'in_progress';