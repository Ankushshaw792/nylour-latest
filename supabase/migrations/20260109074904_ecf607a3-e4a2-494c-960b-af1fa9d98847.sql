-- Step 1: Create helper function to check if salon owner has served a customer
CREATE OR REPLACE FUNCTION public.salon_owner_has_customer(p_customer_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM bookings b
    JOIN salons s ON s.id = b.salon_id
    WHERE b.customer_id = p_customer_id 
    AND s.owner_id = auth.uid()
  );
END;
$$;

-- Step 2: Drop the problematic policy causing infinite recursion
DROP POLICY IF EXISTS "Salon owners can view their salon customers" ON customers;

-- Step 3: Recreate with non-recursive approach using the security definer function
CREATE POLICY "Salon owners can view their salon customers"
ON customers FOR SELECT
USING (public.salon_owner_has_customer(id));