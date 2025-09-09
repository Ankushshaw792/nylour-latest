-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Anyone can view approved salons" ON salons;
DROP POLICY IF EXISTS "Salon owners can manage their salons" ON salons;
DROP POLICY IF EXISTS "Customers can view approved salons" ON salons;
DROP POLICY IF EXISTS "Authenticated customers can view approved salon info" ON salons;
DROP POLICY IF EXISTS "Unauthenticated users can view approved salon info" ON salons;
DROP POLICY IF EXISTS "Salon owners can insert their own salons" ON salons;
DROP POLICY IF EXISTS "Salon owners can update their own salons" ON salons;
DROP POLICY IF EXISTS "Salon owners can view their own salons" ON salons;

DROP POLICY IF EXISTS "Users can view their own customer profile" ON customers;
DROP POLICY IF EXISTS "Users can update their own customer profile" ON customers;
DROP POLICY IF EXISTS "Users can insert their own customer profile" ON customers;
DROP POLICY IF EXISTS "Customers can insert their own profile" ON customers;
DROP POLICY IF EXISTS "Customers can update their own profile" ON customers;
DROP POLICY IF EXISTS "Customers can view their own profile" ON customers;
DROP POLICY IF EXISTS "Customers can manage own profile" ON customers;

DROP POLICY IF EXISTS "Customers can manage their own bookings" ON bookings;
DROP POLICY IF EXISTS "Salon owners can view bookings for their salons" ON bookings;
DROP POLICY IF EXISTS "Salon owners can update bookings for their salons" ON bookings;
DROP POLICY IF EXISTS "Customers can create their own bookings" ON bookings;
DROP POLICY IF EXISTS "Customers can update their own bookings" ON bookings;
DROP POLICY IF EXISTS "Customers can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Customers can manage own bookings" ON bookings;
DROP POLICY IF EXISTS "Salon owners can manage bookings for their salons" ON bookings;

DROP POLICY IF EXISTS "Anyone can view services" ON services;
DROP POLICY IF EXISTS "Anyone can view salon services" ON salon_services;
DROP POLICY IF EXISTS "Salon owners can manage their salon services" ON salon_services;

DROP POLICY IF EXISTS "Customers can view their own queue entries" ON queue_entries;
DROP POLICY IF EXISTS "Salon owners can manage queue entries for their salons" ON queue_entries;
DROP POLICY IF EXISTS "Customers can manage own queue entries" ON queue_entries;

DROP POLICY IF EXISTS "Anyone can view salon hours" ON salon_hours;
DROP POLICY IF EXISTS "Salon owners can manage their salon hours" ON salon_hours;

DROP POLICY IF EXISTS "Salon owners can view their own profile" ON salon_owners;
DROP POLICY IF EXISTS "Salon owners can update their own profile" ON salon_owners;
DROP POLICY IF EXISTS "Salon owners can insert their own profile" ON salon_owners;

-- Now create simple, working policies
CREATE POLICY "Public can view approved salons" ON salons
FOR SELECT USING (status = 'approved'::salon_status AND admin_approved = true);

CREATE POLICY "Owners manage their salons" ON salons
FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "Users manage their customer data" ON customers
FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users manage their bookings" ON bookings
FOR ALL USING (customer_id = auth.uid());

CREATE POLICY "Public can read services" ON services
FOR SELECT USING (true);

CREATE POLICY "Public can read salon services" ON salon_services
FOR SELECT USING (true);

CREATE POLICY "Users manage their queue entries" ON queue_entries
FOR ALL USING (customer_id = auth.uid());

CREATE POLICY "Public can read salon hours" ON salon_hours
FOR SELECT USING (true);

CREATE POLICY "Salon owners manage their profile" ON salon_owners
FOR ALL USING (user_id = auth.uid());