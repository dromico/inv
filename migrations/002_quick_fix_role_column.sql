-- Quick fix for adding role column and setting romico@gmail.com as admin
-- Run this in the Supabase SQL Editor

-- 1. Add the role column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'subcontractor' NOT NULL;
    RAISE NOTICE 'Added role column to profiles table';
  ELSE
    RAISE NOTICE 'Role column already exists in profiles table';
  END IF;
END $$;

-- 2. Set romico@gmail.com as admin
DO $$
DECLARE
  user_id UUID;
BEGIN
  -- Get the user's ID
  SELECT id INTO user_id FROM auth.users WHERE email = 'romico@gmail.com';
    IF user_id IS NOT NULL THEN
    -- Update or insert the profile
    UPDATE profiles 
    SET role = 'admin' 
    WHERE id = user_id;
    
    -- Check if any rows were affected by the update
    DECLARE user_count INTEGER;
    
    IF user_count = 0 THEN
      -- If no rows were updated, the profile doesn't exist yet
      INSERT INTO profiles (id, company_name, contact_person, role, created_at, updated_at)
      VALUES (
        user_id, 
        'Admin User', 
        'System Administrator', 
        'admin', 
        NOW(), 
        NOW()
      );
      RAISE NOTICE 'Created admin profile for romico@gmail.com';
    ELSE
      RAISE NOTICE 'Updated existing profile for romico@gmail.com to admin';
    END IF;
  ELSE
    RAISE NOTICE 'User romico@gmail.com not found in auth.users';
  END IF;
END
$$;
