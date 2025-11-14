-- Create booking_cancellations table to track cancellations
CREATE TABLE public.booking_cancellations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL,
  cancelled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  cancellation_fee NUMERIC NOT NULL DEFAULT 5.00,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on booking_cancellations
ALTER TABLE public.booking_cancellations ENABLE ROW LEVEL SECURITY;

-- RLS policy: Users can view their own cancellations
CREATE POLICY "Users can view their own cancellations"
ON public.booking_cancellations
FOR SELECT
USING (customer_id = auth.uid());

-- RLS policy: System can create cancellation records
CREATE POLICY "System can create cancellation records"
ON public.booking_cancellations
FOR INSERT
WITH CHECK (customer_id = auth.uid());

-- Add cancellation tracking fields to customers table
ALTER TABLE public.customers
ADD COLUMN cancellation_count INTEGER DEFAULT 0,
ADD COLUMN total_cancellation_fees NUMERIC DEFAULT 0.00;

-- Function to check if customer has active booking
CREATE OR REPLACE FUNCTION public.check_active_booking(p_customer_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.bookings
    WHERE customer_id = p_customer_id
      AND status IN ('pending', 'confirmed', 'in_progress')
      AND booking_date >= CURRENT_DATE
  );
END;
$$;

-- Function to apply cancellation fee and update records
CREATE OR REPLACE FUNCTION public.apply_cancellation_fee(p_booking_id UUID, p_customer_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cancellation_fee NUMERIC := 5.00;
BEGIN
  -- Insert cancellation record
  INSERT INTO public.booking_cancellations (booking_id, customer_id, cancellation_fee, reason)
  VALUES (p_booking_id, p_customer_id, v_cancellation_fee, p_reason);
  
  -- Update customer cancellation stats
  UPDATE public.customers
  SET 
    cancellation_count = cancellation_count + 1,
    total_cancellation_fees = total_cancellation_fees + v_cancellation_fee,
    updated_at = now()
  WHERE user_id = p_customer_id;
  
  -- Update booking status to cancelled
  UPDATE public.bookings
  SET 
    status = 'cancelled',
    updated_at = now()
  WHERE id = p_booking_id;
  
  -- Create notification for customer
  INSERT INTO public.notifications (user_id, title, message, type, related_id)
  VALUES (
    p_customer_id,
    'Booking Cancelled',
    'Your booking has been cancelled. A cancellation fee of ₹5 has been applied to your account.',
    'general',
    p_booking_id
  );
END;
$$;