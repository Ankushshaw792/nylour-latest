-- 1. Create salon_staff table
CREATE TABLE IF NOT EXISTS public.salon_staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Add staff_id columns to bookings and queue_entries
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES public.salon_staff(id) ON DELETE SET NULL;

ALTER TABLE public.queue_entries 
ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES public.salon_staff(id) ON DELETE SET NULL;

-- 3. Update create_queue_entry_on_booking_insert function to copy staff_id
CREATE OR REPLACE FUNCTION public.create_queue_entry_on_booking_insert()
RETURNS TRIGGER AS $$
DECLARE
  next_position INTEGER;
BEGIN
  -- Only proceed if booking is confirmed
  IF NEW.status = 'confirmed' THEN
    -- Set arrival_deadline for online bookings if not set
    IF NEW.customer_id IS NOT NULL AND NEW.arrival_deadline IS NULL THEN
      UPDATE public.bookings 
      SET arrival_deadline = NOW() + INTERVAL '10 minutes'
      WHERE id = NEW.id;
    END IF;
    
    -- Check if queue entry already exists for this booking
    IF NOT EXISTS (SELECT 1 FROM public.queue_entries WHERE booking_id = NEW.id) THEN
      -- Calculate next position
      SELECT COALESCE(MAX(position), 0) + 1 INTO next_position
      FROM public.queue_entries
      WHERE salon_id = NEW.salon_id
        AND status IN ('waiting', 'called', 'in_service');
      
      -- Insert queue entry with staff_id copied from booking
      INSERT INTO public.queue_entries (
        booking_id,
        salon_id,
        customer_id,
        staff_id,
        position,
        status,
        estimated_wait_time,
        check_in_time
      ) VALUES (
        NEW.id,
        NEW.salon_id,
        NEW.customer_id,
        NEW.staff_id,
        next_position,
        'waiting',
        next_position * COALESCE((SELECT avg_service_time FROM public.salons WHERE id = NEW.salon_id), 20),
        now()
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Enable RLS on salon_staff
ALTER TABLE public.salon_staff ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view active staff" ON public.salon_staff;
DROP POLICY IF EXISTS "Salon owners can view all staff of their salons" ON public.salon_staff;
DROP POLICY IF EXISTS "Salon owners can manage staff of their salons" ON public.salon_staff;

-- Create RLS Policies for salon_staff
CREATE POLICY "Anyone can view active staff" ON public.salon_staff
FOR SELECT USING (is_active = true);

CREATE POLICY "Salon owners can view all staff of their salons" ON public.salon_staff
FOR SELECT USING (salon_id IN (SELECT id FROM public.salons WHERE owner_id = auth.uid()));

CREATE POLICY "Salon owners can manage staff of their salons" ON public.salon_staff
FOR ALL USING (salon_id IN (SELECT id FROM public.salons WHERE owner_id = auth.uid()))
WITH CHECK (salon_id IN (SELECT id FROM public.salons WHERE owner_id = auth.uid()));

-- 5. Set up trigger to pre-populate 3 default stylists when a salon is registered
CREATE OR REPLACE FUNCTION public.create_default_staff_for_salon()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.salon_staff (salon_id, name, avatar_url, is_active)
  VALUES 
    (NEW.id, 'Alex', 'https://api.dicebear.com/7.x/adventurer/svg?seed=Alex', true),
    (NEW.id, 'Jordan', 'https://api.dicebear.com/7.x/adventurer/svg?seed=Jordan', true),
    (NEW.id, 'Taylor', 'https://api.dicebear.com/7.x/adventurer/svg?seed=Taylor', true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_create_default_staff_on_salon_insert ON public.salons;
CREATE TRIGGER trigger_create_default_staff_on_salon_insert
  AFTER INSERT ON public.salons
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_staff_for_salon();

-- 6. Pre-populate default stylists for all existing salons
INSERT INTO public.salon_staff (salon_id, name, avatar_url, is_active)
SELECT s.id, 'Alex', 'https://api.dicebear.com/7.x/adventurer/svg?seed=Alex', true
FROM public.salons s
WHERE NOT EXISTS (SELECT 1 FROM public.salon_staff ss WHERE ss.salon_id = s.id AND ss.name = 'Alex');

INSERT INTO public.salon_staff (salon_id, name, avatar_url, is_active)
SELECT s.id, 'Jordan', 'https://api.dicebear.com/7.x/adventurer/svg?seed=Jordan', true
FROM public.salons s
WHERE NOT EXISTS (SELECT 1 FROM public.salon_staff ss WHERE ss.salon_id = s.id AND ss.name = 'Jordan');

INSERT INTO public.salon_staff (salon_id, name, avatar_url, is_active)
SELECT s.id, 'Taylor', 'https://api.dicebear.com/7.x/adventurer/svg?seed=Taylor', true
FROM public.salons s
WHERE NOT EXISTS (SELECT 1 FROM public.salon_staff ss WHERE ss.salon_id = s.id AND ss.name = 'Taylor');

-- 7. Add trigger to update staff updated_at
DROP TRIGGER IF EXISTS update_salon_staff_updated_at ON public.salon_staff;
CREATE TRIGGER update_salon_staff_updated_at
  BEFORE UPDATE ON public.salon_staff
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Enable realtime for the new table
ALTER PUBLICATION supabase_realtime ADD TABLE public.salon_staff;
ALTER TABLE public.salon_staff REPLICA IDENTITY FULL;
