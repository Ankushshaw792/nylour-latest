-- Create separate authentication tables for salon owners and customers

-- Create salon_owners table for salon owner authentication
CREATE TABLE public.salon_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'active'
);

-- Create customers table for customer authentication  
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  total_visits INTEGER DEFAULT 0,
  total_spent NUMERIC DEFAULT 0.00,
  gender TEXT,
  notification_preferences JSONB DEFAULT '{"sms": true, "push": true, "email": true, "queue_updates": true, "booking_reminders": true}'::jsonb
);

-- Add approval columns to salons table
ALTER TABLE public.salons ADD COLUMN admin_approved BOOLEAN DEFAULT false;
ALTER TABLE public.salons ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.salons ADD COLUMN approved_by UUID;

-- Enable RLS on new tables
ALTER TABLE public.salon_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- RLS policies for salon_owners
CREATE POLICY "Salon owners can view their own profile" 
ON public.salon_owners 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Salon owners can update their own profile" 
ON public.salon_owners 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Salon owners can insert their own profile" 
ON public.salon_owners 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all salon owners" 
ON public.salon_owners 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role));

-- RLS policies for customers
CREATE POLICY "Customers can view their own profile" 
ON public.customers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Customers can update their own profile" 
ON public.customers 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Customers can insert their own profile" 
ON public.customers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all customers" 
ON public.customers 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role));

-- Update triggers for updated_at columns
CREATE TRIGGER update_salon_owners_updated_at
BEFORE UPDATE ON public.salon_owners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle salon owner registration
CREATE OR REPLACE FUNCTION public.handle_salon_owner_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into salon_owners table
  INSERT INTO public.salon_owners (user_id, first_name, last_name)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', '')
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Assign salon_owner role if user has salon_owner metadata
  IF NEW.raw_user_meta_data ->> 'user_type' = 'salon_owner' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'salon_owner'::user_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_salon_owner_signup: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to handle customer registration
CREATE OR REPLACE FUNCTION public.handle_customer_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into customers table if not salon owner
  IF NEW.raw_user_meta_data ->> 'user_type' != 'salon_owner' OR NEW.raw_user_meta_data ->> 'user_type' IS NULL THEN
    INSERT INTO public.customers (user_id, first_name, last_name)
    VALUES (
      NEW.id, 
      COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
      COALESCE(NEW.raw_user_meta_data ->> 'last_name', '')
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Assign customer role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'customer'::user_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_customer_signup: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update the existing handle_new_user function to route based on user type
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle salon owner signup
  PERFORM public.handle_salon_owner_signup() WHERE NEW.raw_user_meta_data ->> 'user_type' = 'salon_owner';
  
  -- Handle customer signup (default)
  PERFORM public.handle_customer_signup() WHERE NEW.raw_user_meta_data ->> 'user_type' != 'salon_owner' OR NEW.raw_user_meta_data ->> 'user_type' IS NULL;
  
  -- Still insert into profiles for backward compatibility
  INSERT INTO public.profiles (user_id, first_name, last_name)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', '')
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update salons table RLS policies to include approved salons in customer view
DROP POLICY IF EXISTS "Authenticated customers can view salon info" ON public.salons;
CREATE POLICY "Authenticated customers can view approved salon info" 
ON public.salons 
FOR SELECT 
USING ((status = 'approved'::salon_status) AND admin_approved = true AND (auth.uid() IS NOT NULL) AND (auth.uid() <> owner_id));

DROP POLICY IF EXISTS "Unauthenticated users can view basic salon info" ON public.salons;
CREATE POLICY "Unauthenticated users can view approved salon info" 
ON public.salons 
FOR SELECT 
USING ((status = 'approved'::salon_status) AND admin_approved = true AND (auth.uid() IS NULL));