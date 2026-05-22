-- ========================================================
-- SEED DATA: DEMO SALON FOR NYLOUR
-- Run this in the Supabase SQL Editor to seed a demo salon
-- ========================================================

-- 1. Insert a Demo Salon
-- Note: is_active is set to true and admin_approved is set to true
INSERT INTO public.salons (
  id,
  name,
  description,
  address,
  city,
  phone,
  email,
  image_url,
  status,
  rating,
  total_reviews,
  is_active,
  accepts_walkins,
  avg_service_time,
  max_queue_size,
  latitude,
  longitude,
  is_online,
  accepts_bookings,
  current_wait_time,
  admin_approved
) VALUES (
  'd3b07384-d113-4ec5-a50d-d421e428c0b5',
  'Glamour & Co. Luxury Salon',
  'Welcome to Glamour & Co., your premier destination for high-end grooming, luxury haircuts, and comprehensive styling services. Experience premium comfort and expert care.',
  '123, Park Street, Near City Center',
  'Kolkata',
  '+91 98765 43210',
  'contact@glamourco.com',
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1000&auto=format&fit=crop',
  'approved',
  4.8,
  128,
  true,
  true,
  30,
  25,
  22.572646,  -- Default coordinates near Kolkata center
  88.363895,
  true,
  true,
  15,
  true
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  is_active = true,
  admin_approved = true;

-- 2. Link Default Services to the Demo Salon
-- First let's get the master service IDs and map them with custom prices
INSERT INTO public.salon_services (id, salon_id, service_id, price, duration, is_active, display_order)
SELECT 
  gen_random_uuid(),
  'd3b07384-d113-4ec5-a50d-d421e428c0b5',
  id,
  CASE name
    WHEN 'Haircut' THEN 250
    WHEN 'Hair Wash' THEN 150
    WHEN 'Beard Trim' THEN 100
    WHEN 'Hair Coloring' THEN 800
    WHEN 'Hair Styling' THEN 300
    ELSE 200
  END,
  default_duration,
  true,
  CASE name
    WHEN 'Haircut' THEN 1
    WHEN 'Hair Wash' THEN 2
    WHEN 'Beard Trim' THEN 3
    WHEN 'Hair Coloring' THEN 4
    WHEN 'Hair Styling' THEN 5
    ELSE 6
  END
FROM public.services
WHERE name IN ('Haircut', 'Hair Wash', 'Beard Trim', 'Hair Coloring', 'Hair Styling')
ON CONFLICT DO NOTHING;

-- 3. Insert Salon Hours (Open Mon-Sun 9:00 AM - 9:00 PM)
INSERT INTO public.salon_hours (salon_id, day_of_week, open_time, close_time, is_closed) VALUES
  ('d3b07384-d113-4ec5-a50d-d421e428c0b5', 0, '09:00:00', '21:00:00', false),
  ('d3b07384-d113-4ec5-a50d-d421e428c0b5', 1, '09:00:00', '21:00:00', false),
  ('d3b07384-d113-4ec5-a50d-d421e428c0b5', 2, '09:00:00', '21:00:00', false),
  ('d3b07384-d113-4ec5-a50d-d421e428c0b5', 3, '09:00:00', '21:00:00', false),
  ('d3b07384-d113-4ec5-a50d-d421e428c0b5', 4, '09:00:00', '21:00:00', false),
  ('d3b07384-d113-4ec5-a50d-d421e428c0b5', 5, '09:00:00', '21:00:00', false),
  ('d3b07384-d113-4ec5-a50d-d421e428c0b5', 6, '09:00:00', '21:00:00', false)
ON CONFLICT DO NOTHING;

-- 4. Insert a Salon Image
INSERT INTO public.salon_images (salon_id, image_url, caption, display_order, is_primary) VALUES (
  'd3b07384-d113-4ec5-a50d-d421e428c0b5',
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1000&auto=format&fit=crop',
  'Main Salon Interior',
  1,
  true
) ON CONFLICT DO NOTHING;
