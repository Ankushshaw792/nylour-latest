-- Add cancellation_reason column to bookings table
ALTER TABLE public.bookings ADD COLUMN cancellation_reason text;