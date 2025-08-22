-- =============================================
-- PHASE 1: ESSENTIAL SCHEMA ENHANCEMENTS
-- =============================================

-- Create enums for new systems
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled');
CREATE TYPE notification_type AS ENUM ('booking_confirmation', 'booking_reminder', 'queue_update', 'payment_receipt', 'queue_ready', 'booking_cancelled', 'general');

-- 1.1 Add Missing Profile Fields
ALTER TABLE public.profiles 
ADD COLUMN gender text,
ADD COLUMN address text,
ADD COLUMN notification_preferences jsonb DEFAULT '{"sms": true, "email": true, "push": true, "queue_updates": true, "booking_reminders": true}'::jsonb,
ADD COLUMN total_visits integer DEFAULT 0,
ADD COLUMN total_spent numeric(10,2) DEFAULT 0.00;

-- 1.3 Create Payment System
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  booking_id uuid NOT NULL,
  amount numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  payment_method text NOT NULL, -- 'card', 'cash', 'digital_wallet', 'upi'
  payment_status payment_status NOT NULL DEFAULT 'pending',
  transaction_id text,
  gateway_response jsonb,
  processed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for payments
CREATE POLICY "Users can view their own payments" ON public.payments
  FOR SELECT USING (user_id IN (
    SELECT auth.uid() UNION
    SELECT customer_id FROM bookings WHERE bookings.id = payments.booking_id AND bookings.customer_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own payments" ON public.payments
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Salon owners can view payments for their salon bookings" ON public.payments
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM bookings b 
    JOIN salons s ON b.salon_id = s.id 
    WHERE b.id = payments.booking_id AND s.owner_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all payments" ON public.payments
  FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

-- 1.4 Add Notification System
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type notification_type NOT NULL DEFAULT 'general',
  related_id uuid, -- Can reference bookings, queue_entries, etc.
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage all notifications" ON public.notifications
  FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

-- =============================================
-- PHASE 2: POPULATE SAMPLE DATA
-- =============================================

-- 2.1 Create Multiple Salons
INSERT INTO public.salons (name, description, address, phone, email, status, image_url, owner_id) VALUES
('Glamour Studio', 'Premium hair and beauty salon offering cutting-edge styles and luxury treatments', '123 Fashion Street, Downtown', '+1-555-0101', 'contact@glamourstudio.com', 'approved', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800', (SELECT id FROM auth.users LIMIT 1)),
('Urban Cuts', 'Modern barbershop with traditional techniques and contemporary styling', '456 Style Avenue, Midtown', '+1-555-0102', 'hello@urbancuts.com', 'approved', 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800', (SELECT id FROM auth.users LIMIT 1)),
('Beauty Bliss Spa', 'Full-service spa and salon specializing in relaxation and rejuvenation', '789 Wellness Way, Uptown', '+1-555-0103', 'info@beautybliss.com', 'approved', 'https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=800', (SELECT id FROM auth.users LIMIT 1)),
('The Hair Lounge', 'Trendy salon known for creative color and avant-garde cuts', '321 Creative Circle, Arts District', '+1-555-0104', 'appointments@hairlounge.com', 'approved', 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800', (SELECT id FROM auth.users LIMIT 1)),
('Classic Barbershop', 'Traditional barbershop experience with hot towel shaves and classic cuts', '654 Heritage Road, Old Town', '+1-555-0105', 'bookings@classicbarber.com', 'approved', 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800', (SELECT id FROM auth.users LIMIT 1)),
('Serenity Salon', 'Peaceful environment focused on natural and organic beauty treatments', '987 Zen Street, Garden District', '+1-555-0106', 'relax@serenitysalon.com', 'approved', 'https://images.unsplash.com/photo-1562322140-8198e5d65203?w=800', (SELECT id FROM auth.users LIMIT 1)),
('Elite Hair Studio', 'High-end salon catering to celebrities and fashion-forward clientele', '147 Luxury Lane, Business District', '+1-555-0107', 'concierge@elitehair.com', 'approved', 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=800', (SELECT id FROM auth.users LIMIT 1)),
('Fresh Look Salon', 'Contemporary salon offering the latest trends in hair and beauty', '258 Modern Street, Tech District', '+1-555-0108', 'style@freshlook.com', 'approved', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800', (SELECT id FROM auth.users LIMIT 1));

-- 2.2 Link Services to Salons with varied pricing
INSERT INTO public.salon_services (salon_id, service_id, price, duration, is_active) 
SELECT 
  s.id as salon_id,
  srv.id as service_id,
  CASE srv.name
    WHEN 'Haircut' THEN 
      CASE s.name
        WHEN 'Glamour Studio' THEN 85.00
        WHEN 'Urban Cuts' THEN 45.00
        WHEN 'Beauty Bliss Spa' THEN 75.00
        WHEN 'The Hair Lounge' THEN 95.00
        WHEN 'Classic Barbershop' THEN 35.00
        WHEN 'Serenity Salon' THEN 65.00
        WHEN 'Elite Hair Studio' THEN 150.00
        WHEN 'Fresh Look Salon' THEN 70.00
      END
    WHEN 'Hair Wash' THEN 
      CASE s.name
        WHEN 'Glamour Studio' THEN 25.00
        WHEN 'Urban Cuts' THEN 15.00
        WHEN 'Beauty Bliss Spa' THEN 30.00
        WHEN 'The Hair Lounge' THEN 28.00
        WHEN 'Classic Barbershop' THEN 12.00
        WHEN 'Serenity Salon' THEN 22.00
        WHEN 'Elite Hair Studio' THEN 40.00
        WHEN 'Fresh Look Salon' THEN 20.00
      END
    WHEN 'Beard Trim' THEN 
      CASE s.name
        WHEN 'Glamour Studio' THEN 35.00
        WHEN 'Urban Cuts' THEN 25.00
        WHEN 'Beauty Bliss Spa' THEN 30.00
        WHEN 'The Hair Lounge' THEN 40.00
        WHEN 'Classic Barbershop' THEN 20.00
        WHEN 'Serenity Salon' THEN 28.00
        WHEN 'Elite Hair Studio' THEN 55.00
        WHEN 'Fresh Look Salon' THEN 32.00
      END
    WHEN 'Hair Coloring' THEN 
      CASE s.name
        WHEN 'Glamour Studio' THEN 180.00
        WHEN 'Urban Cuts' THEN 120.00
        WHEN 'Beauty Bliss Spa' THEN 160.00
        WHEN 'The Hair Lounge' THEN 220.00
        WHEN 'Classic Barbershop' THEN 90.00
        WHEN 'Serenity Salon' THEN 140.00
        WHEN 'Elite Hair Studio' THEN 300.00
        WHEN 'Fresh Look Salon' THEN 165.00
      END
    WHEN 'Hair Styling' THEN 
      CASE s.name
        WHEN 'Glamour Studio' THEN 65.00
        WHEN 'Urban Cuts' THEN 35.00
        WHEN 'Beauty Bliss Spa' THEN 55.00
        WHEN 'The Hair Lounge' THEN 75.00
        WHEN 'Classic Barbershop' THEN 25.00
        WHEN 'Serenity Salon' THEN 50.00
        WHEN 'Elite Hair Studio' THEN 120.00
        WHEN 'Fresh Look Salon' THEN 60.00
      END
    ELSE 50.00
  END as price,
  srv.default_duration,
  true
FROM public.salons s
CROSS JOIN public.services srv
WHERE s.status = 'approved';

-- 2.3 Create Salon Operating Hours
INSERT INTO public.salon_hours (salon_id, day_of_week, open_time, close_time, is_closed)
SELECT 
  s.id,
  generate_series(0, 6) as day_of_week,
  CASE 
    WHEN generate_series(0, 6) = 0 THEN '10:00'::time -- Sunday
    WHEN generate_series(0, 6) = 6 THEN '09:00'::time -- Saturday
    ELSE '09:00'::time -- Monday-Friday
  END as open_time,
  CASE 
    WHEN generate_series(0, 6) = 0 THEN '18:00'::time -- Sunday
    WHEN generate_series(0, 6) = 6 THEN '20:00'::time -- Saturday
    ELSE '19:00'::time -- Monday-Friday
  END as close_time,
  CASE 
    WHEN s.name = 'Classic Barbershop' AND generate_series(0, 6) = 0 THEN true -- Closed Sundays
    ELSE false
  END as is_closed
FROM public.salons s
WHERE s.status = 'approved';

-- =============================================
-- PHASE 3: ENHANCE EXISTING TABLES
-- =============================================

-- 3.1 Bookings Table Enhancements
ALTER TABLE public.bookings 
ADD COLUMN payment_status payment_status DEFAULT 'pending',
ADD COLUMN customer_notes text,
ADD COLUMN salon_notes text,
ADD COLUMN is_walk_in boolean DEFAULT false;

-- 3.2 Queue Entries Enhancements  
ALTER TABLE public.queue_entries
ADD COLUMN actual_wait_time integer, -- in minutes
ADD COLUMN notification_sent jsonb DEFAULT '{}'::jsonb; -- Track which notifications were sent

-- =============================================
-- PHASE 4: DATABASE FUNCTIONS & TRIGGERS
-- =============================================

-- 4.1 Queue Management Functions
CREATE OR REPLACE FUNCTION public.calculate_queue_position(p_salon_id uuid, p_customer_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  position_count integer;
BEGIN
  SELECT COUNT(*) + 1 INTO position_count
  FROM public.queue_entries qe
  WHERE qe.salon_id = p_salon_id 
    AND qe.status = 'waiting'
    AND qe.joined_at < (
      SELECT joined_at FROM public.queue_entries 
      WHERE salon_id = p_salon_id AND customer_id = p_customer_id AND status = 'waiting'
      ORDER BY joined_at DESC LIMIT 1
    );
  
  RETURN COALESCE(position_count, 1);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_queue_estimated_times()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.queue_entries 
  SET estimated_wait_time = (
    SELECT COALESCE(
      (SELECT AVG(ss.duration) FROM salon_services ss WHERE ss.salon_id = queue_entries.salon_id) * 
      (calculate_queue_position(queue_entries.salon_id, queue_entries.customer_id) - 1),
      30
    )
  )
  WHERE status = 'waiting';
END;
$$;

-- Trigger for queue status changes
CREATE OR REPLACE FUNCTION public.handle_queue_status_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update estimated wait times for all waiting customers when status changes
  PERFORM public.update_queue_estimated_times();
  
  -- Create notification for status change
  IF NEW.status != OLD.status THEN
    INSERT INTO public.notifications (user_id, title, message, type, related_id)
    VALUES (
      NEW.customer_id,
      CASE NEW.status
        WHEN 'in_service' THEN 'Your turn is ready!'
        WHEN 'completed' THEN 'Service completed'
        WHEN 'cancelled' THEN 'Queue entry cancelled'
        ELSE 'Queue status updated'
      END,
      CASE NEW.status
        WHEN 'in_service' THEN 'Please proceed to the salon, your service is ready to begin.'
        WHEN 'completed' THEN 'Thank you for visiting! Please rate your experience.'
        WHEN 'cancelled' THEN 'Your queue entry has been cancelled.'
        ELSE 'Your queue status has been updated to: ' || NEW.status
      END,
      'queue_update',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER queue_status_change_trigger
  AFTER UPDATE ON public.queue_entries
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.handle_queue_status_change();

-- 4.2 Statistics Calculation Functions
CREATE OR REPLACE FUNCTION public.update_user_stats(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  visit_count integer;
  total_spending numeric;
BEGIN
  -- Calculate total visits (completed bookings)
  SELECT COUNT(*) INTO visit_count
  FROM public.bookings
  WHERE customer_id = p_user_id AND status = 'completed';
  
  -- Calculate total spending (completed payments)
  SELECT COALESCE(SUM(p.amount), 0) INTO total_spending
  FROM public.payments p
  JOIN public.bookings b ON p.booking_id = b.id
  WHERE b.customer_id = p_user_id AND p.payment_status = 'completed';
  
  -- Update profile
  UPDATE public.profiles
  SET 
    total_visits = visit_count,
    total_spent = total_spending,
    updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;

-- Trigger to update stats when booking status changes
CREATE OR REPLACE FUNCTION public.handle_booking_completion()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    PERFORM public.update_user_stats(NEW.customer_id);
    
    -- Create completion notification
    INSERT INTO public.notifications (user_id, title, message, type, related_id)
    VALUES (
      NEW.customer_id,
      'Booking completed!',
      'Thank you for your visit! Please rate your experience and book again soon.',
      'booking_confirmation',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER booking_completion_trigger
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.handle_booking_completion();

-- Update updated_at triggers for new tables
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- PHASE 5: DATA VALIDATION & CONSTRAINTS
-- =============================================

-- 5.1 Add Proper Constraints
-- Payment amount validation
ALTER TABLE public.payments 
ADD CONSTRAINT payments_amount_positive CHECK (amount > 0);

-- Queue number uniqueness per salon
ALTER TABLE public.queue_entries 
ADD CONSTRAINT unique_queue_number_per_salon UNIQUE (salon_id, queue_number);

-- Booking time validation (basic - can be enhanced with business hours check)
ALTER TABLE public.bookings
ADD CONSTRAINT booking_time_future CHECK (booking_date >= CURRENT_DATE);

-- Valid payment methods
ALTER TABLE public.payments
ADD CONSTRAINT valid_payment_method CHECK (payment_method IN ('card', 'cash', 'digital_wallet', 'upi', 'bank_transfer'));

-- Valid gender values
ALTER TABLE public.profiles
ADD CONSTRAINT valid_gender CHECK (gender IS NULL OR gender IN ('male', 'female', 'other', 'prefer_not_to_say'));

-- 5.2 Indexes for Performance
-- Salon location-based searches (using address text search)
CREATE INDEX idx_salons_address_search ON public.salons USING gin(to_tsvector('english', address));

-- Booking date queries
CREATE INDEX idx_bookings_date ON public.bookings (booking_date);
CREATE INDEX idx_bookings_salon_date ON public.bookings (salon_id, booking_date);

-- Queue management queries
CREATE INDEX idx_queue_entries_salon_status ON public.queue_entries (salon_id, status);
CREATE INDEX idx_queue_entries_customer_status ON public.queue_entries (customer_id, status);

-- Payment queries
CREATE INDEX idx_payments_user_status ON public.payments (user_id, payment_status);
CREATE INDEX idx_payments_booking ON public.payments (booking_id);

-- Notification queries  
CREATE INDEX idx_notifications_user_unread ON public.notifications (user_id, is_read);
CREATE INDEX idx_notifications_user_created ON public.notifications (user_id, created_at DESC);

-- Salon services pricing queries
CREATE INDEX idx_salon_services_salon_active ON public.salon_services (salon_id, is_active);

-- Profile stats queries
CREATE INDEX idx_profiles_user_id ON public.profiles (user_id);

-- Composite indexes for common queries
CREATE INDEX idx_bookings_customer_status_date ON public.bookings (customer_id, status, booking_date DESC);
CREATE INDEX idx_salon_services_price_range ON public.salon_services (salon_id, price) WHERE is_active = true;