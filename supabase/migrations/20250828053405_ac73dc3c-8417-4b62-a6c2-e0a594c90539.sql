-- Security Fix: Role System Repair
-- Add policy to allow system to assign roles during user registration
CREATE POLICY "System can assign default roles during registration" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (
  -- Allow system functions to insert default customer role
  role = 'customer'::user_role
);

-- Update the handle_new_user function to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert into profiles table with error handling
  INSERT INTO public.profiles (user_id, first_name, last_name)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', '')
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Assign default customer role with error handling
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer'::user_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add policy for admins to assign any role (for creating other admins)
CREATE POLICY "Admins can assign any role" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin'::user_role)
);

-- Add unique constraint to prevent duplicate user-role combinations
ALTER TABLE public.user_roles 
ADD CONSTRAINT unique_user_role 
UNIQUE (user_id, role);