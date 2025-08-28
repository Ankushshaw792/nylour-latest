-- Create Admin User Script
-- This script should be run by a user with admin privileges to create the first admin user
-- Replace 'USER_ID_HERE' with the actual user ID from auth.users table

-- Example usage:
-- 1. First, register a user through the normal signup process
-- 2. Get their user ID from the auth.users table or Supabase dashboard
-- 3. Run this script with their user ID to make them an admin

-- Insert admin role for a specific user
-- REPLACE 'USER_ID_HERE' with the actual UUID of the user you want to make admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('USER_ID_HERE', 'admin'::user_role)
ON CONFLICT (user_id, role) DO NOTHING;

-- Example query to find user IDs (for reference):
-- SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC;