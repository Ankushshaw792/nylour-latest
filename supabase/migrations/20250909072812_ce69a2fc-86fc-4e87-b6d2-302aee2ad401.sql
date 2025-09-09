-- Re-enable RLS with simple, non-recursive policies

-- Enable RLS on all tables
ALTER TABLE salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_owners ENABLE ROW LEVEL SECURITY;

-- Simple policies for salons
CREATE POLICY "Anyone can view approved salons" ON salons
FOR SELECT USING (status = 'approved' AND admin_approved = true);

CREATE POLICY "Salon owners can manage their salons" ON salons
FOR ALL USING (owner_id = auth.uid());

-- Simple policies for customers
CREATE POLICY "Users can view their own customer profile" ON customers
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own customer profile" ON customers
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own customer profile" ON customers
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Simple policies for bookings
CREATE POLICY "Customers can manage their own bookings" ON bookings
FOR ALL USING (customer_id = auth.uid());

CREATE POLICY "Salon owners can view bookings for their salons" ON bookings
FOR SELECT USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));

CREATE POLICY "Salon owners can update bookings for their salons" ON bookings
FOR UPDATE USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));

-- Simple policies for services (public read)
CREATE POLICY "Anyone can view services" ON services
FOR SELECT USING (true);

-- Simple policies for salon_services
CREATE POLICY "Anyone can view salon services" ON salon_services
FOR SELECT USING (true);

CREATE POLICY "Salon owners can manage their salon services" ON salon_services
FOR ALL USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));

-- Simple policies for queue_entries
CREATE POLICY "Customers can view their own queue entries" ON queue_entries
FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "Salon owners can manage queue entries for their salons" ON queue_entries
FOR ALL USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));

-- Simple policies for salon_hours
CREATE POLICY "Anyone can view salon hours" ON salon_hours
FOR SELECT USING (true);

CREATE POLICY "Salon owners can manage their salon hours" ON salon_hours
FOR ALL USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));

-- Simple policies for salon_owners
CREATE POLICY "Salon owners can view their own profile" ON salon_owners
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Salon owners can update their own profile" ON salon_owners
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Salon owners can insert their own profile" ON salon_owners
FOR INSERT WITH CHECK (user_id = auth.uid());