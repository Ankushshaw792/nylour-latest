-- =============================================
-- PART 2: REMAINING TABLES & AUTH
-- =============================================

-- 9. Salon owners table
CREATE TABLE public.salon_owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL UNIQUE,
  first_name text, last_name text, phone text,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(),
  status text DEFAULT 'active'
);
ALTER TABLE public.salon_owners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Salon owners manage their profile" ON salon_owners FOR ALL USING (user_id = auth.uid());
CREATE TRIGGER update_salon_owners_updated_at BEFORE UPDATE ON public.salon_owners FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Customers table
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users UNIQUE,
  first_name text, last_name text, phone text, email text,
  avatar_url text, address text, gender text,
  favorite_services jsonb DEFAULT '[]'::jsonb,
  preferred_time text,
  notification_preferences jsonb DEFAULT '{"sms": true, "push": true, "email": true, "queue_updates": true, "booking_reminders": true}'::jsonb,
  total_visits integer DEFAULT 0, total_spent numeric DEFAULT 0.00,
  cancellation_count integer DEFAULT 0, total_cancellation_fees numeric DEFAULT 0.00,
  has_completed_tutorial boolean DEFAULT false,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their customer data" ON customers FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Public can read customer names" ON public.customers AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage all customers" ON public.customers AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::user_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::user_role));
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Bookings table
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid REFERENCES public.salons(id) ON DELETE CASCADE,
  customer_id uuid,
  service_id uuid REFERENCES public.salon_services(id),
  booking_date date NOT NULL,
  booking_time time,
  duration integer,
  total_price numeric,
  status text DEFAULT 'pending',
  notes text,
  party_size integer DEFAULT 1,
  payment_status text DEFAULT 'pending',
  payment_method text,
  payment_reference text,
  cancellation_reason text,
  estimated_service_time integer DEFAULT 30,
  actual_start_time timestamptz,
  actual_end_time timestamptz,
  queue_position integer,
  arrival_deadline timestamptz,
  reviewed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings REPLICA IDENTITY FULL;

CREATE POLICY "Customers can view their bookings" ON public.bookings AS PERMISSIVE FOR SELECT TO authenticated USING (customer_id = auth.uid());
CREATE POLICY "Customers can create their bookings" ON public.bookings AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (customer_id = auth.uid());
CREATE POLICY "Customers can update their bookings" ON public.bookings AS PERMISSIVE FOR UPDATE TO authenticated
  USING (customer_id = auth.uid()) WITH CHECK (customer_id = auth.uid());
CREATE POLICY "Salon owners manage their salon bookings" ON public.bookings FOR ALL
  USING (salon_id IN (SELECT id FROM public.salons WHERE owner_id = auth.uid()))
  WITH CHECK (salon_id IN (SELECT id FROM public.salons WHERE owner_id = auth.uid()));
CREATE POLICY "Salon owners can view their bookings" ON public.bookings FOR SELECT
  USING (EXISTS (SELECT 1 FROM salons WHERE salons.id = bookings.salon_id AND salons.owner_id = auth.uid())
  AND (payment_status = 'completed' OR customer_id IS NULL));
CREATE POLICY "Salon owners can update their bookings" ON public.bookings FOR UPDATE
  USING (EXISTS (SELECT 1 FROM salons WHERE salons.id = bookings.salon_id AND salons.owner_id = auth.uid())
  AND (payment_status = 'completed' OR customer_id IS NULL));
CREATE POLICY "Admins can manage all bookings" ON public.bookings AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::user_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::user_role));

CREATE INDEX idx_bookings_date ON public.bookings (booking_date);
CREATE INDEX idx_bookings_salon_date ON public.bookings (salon_id, booking_date);
CREATE INDEX idx_bookings_customer_status_date ON public.bookings (customer_id, status, booking_date DESC);
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 12. Queue entries table
CREATE TABLE public.queue_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  salon_id uuid REFERENCES public.salons(id) ON DELETE CASCADE,
  customer_id uuid,
  position integer NOT NULL,
  status text DEFAULT 'waiting',
  estimated_wait_time integer,
  check_in_time timestamptz,
  called_time timestamptz,
  service_start_time timestamptz,
  service_end_time timestamptz,
  expires_at timestamptz DEFAULT (now() + interval '1 hour'),
  notification_sent jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.queue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_entries REPLICA IDENTITY FULL;

CREATE POLICY "Users manage their queue entries" ON public.queue_entries FOR ALL USING (customer_id = auth.uid()) WITH CHECK (customer_id = auth.uid());
CREATE POLICY "Salon owners manage their queue entries" ON public.queue_entries FOR ALL
  USING (salon_id IN (SELECT id FROM public.salons WHERE owner_id = auth.uid()))
  WITH CHECK (salon_id IN (SELECT id FROM public.salons WHERE owner_id = auth.uid()));
CREATE INDEX idx_queue_entries_salon_status ON public.queue_entries (salon_id, status);
CREATE INDEX idx_queue_entries_customer_status ON public.queue_entries (customer_id, status);
CREATE TRIGGER update_queue_entries_updated_at BEFORE UPDATE ON public.queue_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 13. Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  title text NOT NULL, message text NOT NULL,
  type notification_type NOT NULL DEFAULT 'general',
  related_id uuid,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Salon owners can notify their queue customers" ON public.notifications FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM queue_entries qe JOIN salons s ON s.id = qe.salon_id JOIN customers c ON c.id = qe.customer_id
    WHERE c.user_id = notifications.user_id AND s.owner_id = auth.uid() AND qe.status IN ('waiting', 'called', 'in_service'))
);
CREATE INDEX idx_notifications_user_unread ON public.notifications (user_id, is_read);
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 14. Favorites table
CREATE TABLE public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL, salon_id uuid NOT NULL REFERENCES public.salons(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, salon_id)
);
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites REPLICA IDENTITY FULL;
CREATE POLICY "Users can manage their own favorites" ON public.favorites FOR ALL USING (user_id = auth.uid());

-- 15. Reviews table
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid REFERENCES public.salons(id),
  customer_id uuid REFERENCES public.customers(id),
  booking_id uuid REFERENCES public.bookings(id),
  rating integer NOT NULL, comment text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Customers can create reviews" ON public.reviews FOR INSERT WITH CHECK (true);

-- 16. Salon images table
CREATE TABLE public.salon_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid REFERENCES public.salons(id) ON DELETE CASCADE,
  image_url text NOT NULL, caption text,
  display_order integer DEFAULT 0, is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.salon_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view salon images" ON public.salon_images FOR SELECT USING (true);
CREATE POLICY "Salon owners can manage their images" ON public.salon_images FOR ALL
  USING (EXISTS (SELECT 1 FROM public.salons WHERE salons.id = salon_images.salon_id AND salons.owner_id = auth.uid()));

-- 17. Booking services table
CREATE TABLE public.booking_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  salon_service_id uuid NOT NULL REFERENCES public.salon_services(id),
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  unit_duration integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.booking_services ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_booking_services_booking_id ON public.booking_services(booking_id);
CREATE POLICY "Customers can view their booking services" ON public.booking_services FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.bookings b JOIN public.customers c ON c.id = b.customer_id WHERE b.id = booking_services.booking_id AND c.user_id = auth.uid()));
CREATE POLICY "Customers can insert their booking services" ON public.booking_services FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.bookings b JOIN public.customers c ON c.id = b.customer_id WHERE b.id = booking_services.booking_id AND c.user_id = auth.uid()));
CREATE POLICY "Salon owners can view booking services" ON public.booking_services FOR SELECT
  USING (EXISTS (SELECT 1 FROM bookings b JOIN salons s ON s.id = b.salon_id WHERE b.id = booking_services.booking_id AND s.owner_id = auth.uid() AND (b.payment_status = 'completed' OR b.customer_id IS NULL)));

-- 18. Booking companions table
CREATE TABLE public.booking_companions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  name text NOT NULL, phone text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.booking_companions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their booking companions" ON public.booking_companions FOR ALL USING (true);

-- 19. Booking cancellations table
CREATE TABLE public.booking_cancellations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL,
  cancelled_at timestamptz DEFAULT now(),
  cancellation_fee numeric DEFAULT 5.00,
  reason text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.booking_cancellations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own cancellations" ON public.booking_cancellations FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "System can create cancellation records" ON public.booking_cancellations FOR INSERT WITH CHECK (customer_id = auth.uid());

-- 20. Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.salons;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.favorites;

-- 21. Storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('service-images', 'service-images', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('salon-images', 'salon-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('customer-avatars', 'customer-avatars', true) ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Service images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'service-images');
CREATE POLICY "Salon owners can upload service images" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'service-images' AND auth.uid() IN (SELECT owner_id FROM public.salons));
CREATE POLICY "Public read access for salon images" ON storage.objects FOR SELECT USING (bucket_id = 'salon-images');
CREATE POLICY "Salon owners can upload salon images" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'salon-images' AND auth.uid() IN (SELECT owner_id FROM public.salons)
  AND (storage.foldername(name))[1] IN (SELECT id::text FROM public.salons WHERE owner_id = auth.uid()));
CREATE POLICY "Salon owners can delete their salon images" ON storage.objects FOR DELETE
  USING (bucket_id = 'salon-images' AND (storage.foldername(name))[1] IN (SELECT id::text FROM public.salons WHERE owner_id = auth.uid()));
CREATE POLICY "Public read access for customer avatars" ON storage.objects FOR SELECT USING (bucket_id = 'customer-avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'customer-avatars' AND auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE
  USING (bucket_id = 'customer-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
