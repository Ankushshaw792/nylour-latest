
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  favorite_services TEXT[],
  preferred_time TEXT,
  cancellation_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create salons table
CREATE TABLE public.salons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  image_url TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  rating DECIMAL(2, 1) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  avg_service_time INTEGER DEFAULT 30,
  max_queue_size INTEGER DEFAULT 20,
  accepts_walkins BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create services table (master list)
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  default_duration INTEGER DEFAULT 30,
  default_price DECIMAL(10, 2),
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create salon_services table (services offered by each salon)
CREATE TABLE public.salon_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL,
  duration INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create salon_hours table
CREATE TABLE public.salon_hours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  is_closed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.salon_services(id),
  booking_date DATE NOT NULL,
  booking_time TIME,
  duration INTEGER,
  total_price DECIMAL(10, 2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  reviewed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create queue_entries table
CREATE TABLE public.queue_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'called', 'in_service', 'completed', 'cancelled', 'no_show')),
  estimated_wait_time INTEGER,
  check_in_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
  called_time TIMESTAMP WITH TIME ZONE,
  service_start_time TIMESTAMP WITH TIME ZONE,
  service_end_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'general' CHECK (type IN ('general', 'booking', 'queue', 'promotion', 'reminder')),
  is_read BOOLEAN DEFAULT false,
  related_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create favorites table
CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, salon_id)
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salon_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salon_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customers
CREATE POLICY "Users can view their own customer profile" ON public.customers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own customer profile" ON public.customers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own customer profile" ON public.customers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Salon owners can view customers" ON public.customers FOR SELECT USING (EXISTS (SELECT 1 FROM public.salons WHERE owner_id = auth.uid()));

-- RLS Policies for salons (public read, owner write)
CREATE POLICY "Anyone can view active salons" ON public.salons FOR SELECT USING (is_active = true);
CREATE POLICY "Owners can manage their salons" ON public.salons FOR ALL USING (auth.uid() = owner_id);

-- RLS Policies for services (public read)
CREATE POLICY "Anyone can view services" ON public.services FOR SELECT USING (true);

-- RLS Policies for salon_services (public read)
CREATE POLICY "Anyone can view salon services" ON public.salon_services FOR SELECT USING (true);
CREATE POLICY "Salon owners can manage their services" ON public.salon_services FOR ALL USING (
  EXISTS (SELECT 1 FROM public.salons WHERE id = salon_id AND owner_id = auth.uid())
);

-- RLS Policies for salon_hours (public read)
CREATE POLICY "Anyone can view salon hours" ON public.salon_hours FOR SELECT USING (true);
CREATE POLICY "Salon owners can manage their hours" ON public.salon_hours FOR ALL USING (
  EXISTS (SELECT 1 FROM public.salons WHERE id = salon_id AND owner_id = auth.uid())
);

-- RLS Policies for bookings
CREATE POLICY "Customers can view their bookings" ON public.bookings FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.customers WHERE id = customer_id AND user_id = auth.uid())
);
CREATE POLICY "Customers can create bookings" ON public.bookings FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.customers WHERE id = customer_id AND user_id = auth.uid())
);
CREATE POLICY "Customers can update their bookings" ON public.bookings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.customers WHERE id = customer_id AND user_id = auth.uid())
);
CREATE POLICY "Salon owners can view their bookings" ON public.bookings FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.salons WHERE id = salon_id AND owner_id = auth.uid())
);
CREATE POLICY "Salon owners can update their bookings" ON public.bookings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.salons WHERE id = salon_id AND owner_id = auth.uid())
);

-- RLS Policies for queue_entries
CREATE POLICY "Customers can view their queue entries" ON public.queue_entries FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.customers WHERE id = customer_id AND user_id = auth.uid())
);
CREATE POLICY "Salon owners can manage queue" ON public.queue_entries FOR ALL USING (
  EXISTS (SELECT 1 FROM public.salons WHERE id = salon_id AND owner_id = auth.uid())
);
CREATE POLICY "Anyone can view queue for a salon" ON public.queue_entries FOR SELECT USING (true);

-- RLS Policies for notifications
CREATE POLICY "Users can view their notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- RLS Policies for favorites
CREATE POLICY "Users can view their favorites" ON public.favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their favorites" ON public.favorites FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for reviews
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Customers can create reviews" ON public.reviews FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.customers WHERE id = customer_id AND user_id = auth.uid())
);

-- Create function to check active booking
CREATE OR REPLACE FUNCTION public.check_active_booking(p_customer_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.bookings
    WHERE customer_id = p_customer_id
    AND status IN ('pending', 'confirmed', 'in_progress')
    AND booking_date >= CURRENT_DATE
  );
END;
$$;

-- Create function to apply cancellation fee
CREATE OR REPLACE FUNCTION public.apply_cancellation_fee(p_booking_id UUID, p_customer_id UUID, p_reason TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update booking status
  UPDATE public.bookings SET status = 'cancelled', notes = p_reason, updated_at = now()
  WHERE id = p_booking_id;
  
  -- Update queue entry if exists
  UPDATE public.queue_entries SET status = 'cancelled', updated_at = now()
  WHERE booking_id = p_booking_id;
  
  -- Increment cancellation count
  UPDATE public.customers SET cancellation_count = cancellation_count + 1, updated_at = now()
  WHERE id = p_customer_id;
END;
$$;

-- Create function to calculate wait time
CREATE OR REPLACE FUNCTION public.calculate_wait_time(p_salon_id UUID, p_position INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  avg_time INTEGER;
BEGIN
  SELECT COALESCE(avg_service_time, 30) INTO avg_time FROM public.salons WHERE id = p_salon_id;
  RETURN p_position * avg_time;
END;
$$;

-- Create function to notify next customer
CREATE OR REPLACE FUNCTION public.notify_next_customer(p_salon_id UUID, p_message TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_entry RECORD;
  notification_message TEXT;
BEGIN
  -- Get next waiting customer
  SELECT qe.*, c.user_id 
  INTO next_entry
  FROM public.queue_entries qe
  JOIN public.customers c ON c.id = qe.customer_id
  WHERE qe.salon_id = p_salon_id AND qe.status = 'waiting'
  ORDER BY qe.position ASC
  LIMIT 1;
  
  IF next_entry IS NOT NULL THEN
    notification_message := COALESCE(p_message, 'You are next! Please be ready.');
    
    INSERT INTO public.notifications (user_id, title, message, type, related_id)
    VALUES (next_entry.user_id, 'Your Turn is Coming!', notification_message, 'queue', next_entry.id);
  END IF;
END;
$$;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_salons_updated_at BEFORE UPDATE ON public.salons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_queue_entries_updated_at BEFORE UPDATE ON public.queue_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default services
INSERT INTO public.services (name, description, default_duration, default_price, category) VALUES
('Haircut', 'Standard haircut for men', 30, 200, 'Hair'),
('Beard Trim', 'Beard trimming and shaping', 15, 100, 'Beard'),
('Hair Wash', 'Hair wash with shampoo and conditioner', 15, 50, 'Hair'),
('Shave', 'Clean shave with hot towel', 20, 150, 'Shave'),
('Hair Color', 'Hair coloring service', 60, 500, 'Hair'),
('Facial', 'Basic facial treatment', 45, 400, 'Face'),
('Head Massage', 'Relaxing head massage', 20, 150, 'Massage');

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
