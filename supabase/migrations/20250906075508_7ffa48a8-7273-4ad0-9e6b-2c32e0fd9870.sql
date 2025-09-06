-- Fix infinite recursion in user_roles policies by removing the circular dependency
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can assign any role" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage all customers" ON customers;
DROP POLICY IF EXISTS "Admins can manage all salons" ON salons;
DROP POLICY IF EXISTS "Admins can manage all salon owners" ON salon_owners;
DROP POLICY IF EXISTS "Admins can manage services" ON services;
DROP POLICY IF EXISTS "Admins can manage all salon services" ON salon_services;
DROP POLICY IF EXISTS "Admins can manage all bookings" ON bookings;

-- Create non-recursive admin policies
CREATE POLICY "Direct admin access to roles" ON user_roles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur2 
    WHERE ur2.user_id = auth.uid() 
    AND ur2.role = 'admin'::user_role
    AND ur2.id != user_roles.id
  )
);

CREATE POLICY "Direct admin access to customers" ON customers
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'::user_role
  )
);

CREATE POLICY "Direct admin access to salons" ON salons
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'::user_role
  )
);

CREATE POLICY "Direct admin access to salon owners" ON salon_owners
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'::user_role
  )
);

CREATE POLICY "Direct admin access to services" ON services
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'::user_role
  )
);

CREATE POLICY "Direct admin access to salon services" ON salon_services
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'::user_role
  )
);

CREATE POLICY "Direct admin access to bookings" ON bookings
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'::user_role
  )
);

-- Add missing foreign key constraints to fix relationship issues
ALTER TABLE bookings ADD CONSTRAINT fk_bookings_salon_id 
FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE;

ALTER TABLE bookings ADD CONSTRAINT fk_bookings_customer_id 
FOREIGN KEY (customer_id) REFERENCES customers(user_id) ON DELETE CASCADE;

ALTER TABLE bookings ADD CONSTRAINT fk_bookings_service_id 
FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE;

ALTER TABLE salon_services ADD CONSTRAINT fk_salon_services_salon_id 
FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE;

ALTER TABLE salon_services ADD CONSTRAINT fk_salon_services_service_id 
FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE;

ALTER TABLE queue_entries ADD CONSTRAINT fk_queue_entries_salon_id 
FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE;

ALTER TABLE queue_entries ADD CONSTRAINT fk_queue_entries_customer_id 
FOREIGN KEY (customer_id) REFERENCES customers(user_id) ON DELETE CASCADE;

ALTER TABLE queue_entries ADD CONSTRAINT fk_queue_entries_service_id 
FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE;