-- =============================================
-- PART 1: BASE SCHEMA (originally created by Lovable platform)
-- =============================================

-- 1. Create enums
CREATE TYPE public.user_role AS ENUM ('customer', 'salon_owner', 'admin');
CREATE TYPE public.salon_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rejected', 'no_show');
CREATE TYPE public.queue_status AS ENUM ('waiting', 'called', 'completed', 'cancelled', 'in_service');
CREATE TYPE public.notification_type AS ENUM ('booking_confirmation', 'booking_update', 'queue_update', 'service_reminder', 'general');

-- 2. Utility functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 3a. User roles table (must exist before has_role function)
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  role user_role NOT NULL DEFAULT 'customer',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_user_role UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(p_user_id uuid, p_role user_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_user_id AND role = p_role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin'::user_role);
$$;

CREATE POLICY "Users can view their own roles" ON user_roles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert customer role during signup" ON user_roles FOR INSERT WITH CHECK (user_id = auth.uid() AND role = 'customer'::user_role);
CREATE POLICY "Admins can manage all roles" ON public.user_roles AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::user_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::user_role));

-- 3. Profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL UNIQUE,
  first_name text,
  last_name text,
  phone text,
  avatar_url text,
  gender text,
  address text,
  notification_preferences jsonb DEFAULT '{"sms": true, "email": true, "push": true, "queue_updates": true, "booking_reminders": true}'::jsonb,
  total_visits integer DEFAULT 0,
  total_spent numeric(10,2) DEFAULT 0.00,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_gender CHECK (gender IS NULL OR gender IN ('male', 'female', 'other', 'prefer_not_to_say'))
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE INDEX idx_profiles_user_id ON public.profiles (user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. (user_roles already created above)

-- 5. Salons table
CREATE TABLE public.salons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  address text,
  city text,
  phone text,
  email text,
  image_url text,
  status salon_status DEFAULT 'pending',
  owner_id uuid REFERENCES auth.users,
  rating numeric DEFAULT 0,
  total_reviews integer DEFAULT 0,
  is_active boolean DEFAULT true,
  accepts_walkins boolean DEFAULT true,
  avg_service_time integer DEFAULT 30,
  max_queue_size integer DEFAULT 20,
  latitude numeric,
  longitude numeric,
  is_online boolean DEFAULT true,
  accepts_bookings boolean DEFAULT true,
  current_wait_time integer DEFAULT 30,
  last_activity timestamptz DEFAULT now(),
  admin_approved boolean DEFAULT false,
  approved_at timestamptz,
  approved_by uuid,
  has_completed_tutorial boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salons REPLICA IDENTITY FULL;

CREATE POLICY "Public can view active salons" ON public.salons AS PERMISSIVE FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Owners manage their salons" ON salons FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "Admins can manage all salons" ON public.salons AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::user_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::user_role));

CREATE TRIGGER update_salons_updated_at BEFORE UPDATE ON public.salons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Services table (master list)
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text,
  default_duration integer DEFAULT 30,
  default_price numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read services" ON public.services AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can create services" ON public.services FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can manage services" ON public.services AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::user_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::user_role));

-- Insert default services
INSERT INTO public.services (name, description, category, default_duration, default_price) VALUES
  ('Haircut', 'Standard haircut', 'Hair', 30, 50),
  ('Hair Wash', 'Hair wash and conditioning', 'Hair', 15, 20),
  ('Beard Trim', 'Beard trimming and shaping', 'Grooming', 20, 25),
  ('Hair Coloring', 'Full hair coloring', 'Hair', 60, 150),
  ('Hair Styling', 'Hair styling and blowout', 'Hair', 45, 60);

-- 7. Salon services table
CREATE TABLE public.salon_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid REFERENCES public.salons(id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.services(id) ON DELETE CASCADE,
  price numeric NOT NULL,
  duration integer DEFAULT 30,
  is_active boolean DEFAULT true,
  image_url text,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.salon_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read salon services" ON public.salon_services AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Owners manage their salon services" ON public.salon_services FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.salons s WHERE s.id = salon_services.salon_id AND s.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.salons s WHERE s.id = salon_services.salon_id AND s.owner_id = auth.uid()));
CREATE POLICY "Admins can manage all salon services" ON public.salon_services AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::user_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::user_role));
CREATE INDEX idx_salon_services_salon_active ON public.salon_services (salon_id, is_active);

-- 8. Salon hours table
CREATE TABLE public.salon_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid REFERENCES public.salons(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL,
  open_time time NOT NULL,
  close_time time NOT NULL,
  is_closed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.salon_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read salon hours" ON public.salon_hours AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Owners manage their salon hours" ON public.salon_hours FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.salons s WHERE s.id = salon_hours.salon_id AND s.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.salons s WHERE s.id = salon_hours.salon_id AND s.owner_id = auth.uid()));
