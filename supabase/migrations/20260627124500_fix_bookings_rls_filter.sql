-- Fix: Remove the payment_status filter from bookings RLS policies
-- Online bookings are created with payment_status = 'pending' and were being hidden

-- 1. Drop existing policies on bookings
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Salon staff can view bookings for their salon" ON bookings;
DROP POLICY IF EXISTS "Users can insert their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
DROP POLICY IF EXISTS "Salon staff can update bookings for their salon" ON bookings;
DROP POLICY IF EXISTS "Salon staff can delete bookings for their salon" ON bookings;

-- 2. Recreate policies without the restrictive payment_status filter

-- Users can view their own bookings
CREATE POLICY "Users can view their own bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = customer_id
  );

-- Salon staff can view all bookings for their salon
CREATE POLICY "Salon staff can view bookings for their salon"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM salons 
      WHERE salons.id = bookings.salon_id 
      AND salons.owner_id = auth.uid()
    )
  );

-- Users can insert their own bookings
CREATE POLICY "Users can insert their own bookings"
  ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = customer_id
  );

-- Salon owner/staff can also insert bookings (for walk-ins)
CREATE POLICY "Salon staff can insert bookings for their salon"
  ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM salons 
      WHERE salons.id = bookings.salon_id 
      AND salons.owner_id = auth.uid()
    )
  );

-- Users can update their own bookings
CREATE POLICY "Users can update their own bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = customer_id
  );

-- Salon staff can update bookings for their salon
CREATE POLICY "Salon staff can update bookings for their salon"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM salons 
      WHERE salons.id = bookings.salon_id 
      AND salons.owner_id = auth.uid()
    )
  );

-- Salon staff can delete bookings for their salon
CREATE POLICY "Salon staff can delete bookings for their salon"
  ON bookings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM salons 
      WHERE salons.id = bookings.salon_id 
      AND salons.owner_id = auth.uid()
    )
  );
