-- Migration script to update existing schema
-- Run this in the Supabase SQL Editor

-- 0. First, add the role column to the profiles table if it doesn't exist
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

-- 1. Update the RLS policies that use raw_user_meta_data to use profiles.role instead

-- Update profiles policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Update jobs policies
DROP POLICY IF EXISTS "Admins can view all jobs" ON jobs;
CREATE POLICY "Admins can view all jobs"
  ON jobs FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Admins can update any job" ON jobs;
CREATE POLICY "Admins can update any job"
  ON jobs FOR UPDATE
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Admins can delete any job" ON jobs;
CREATE POLICY "Admins can delete any job"
  ON jobs FOR DELETE
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Update invoices policies
DROP POLICY IF EXISTS "Admins can manage all invoices" ON invoices;
CREATE POLICY "Admins can manage all invoices"
  ON invoices FOR ALL
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Update notifications policies
DROP POLICY IF EXISTS "Admins can insert notifications" ON notifications;
CREATE POLICY "Admins can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Admins can view all notifications" ON notifications;
CREATE POLICY "Admins can view all notifications"
  ON notifications FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Update files policies
DROP POLICY IF EXISTS "Admins can manage all files" ON files;
CREATE POLICY "Admins can manage all files"
  ON files FOR ALL
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- 2. Update the notify_on_job_status_change function
CREATE OR REPLACE FUNCTION notify_on_job_status_change()
RETURNS TRIGGER AS $$
DECLARE
  admin_id UUID;
  message TEXT;
BEGIN
  -- Only proceed if status has changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  -- Find an admin user from profiles table
  SELECT id INTO admin_id FROM profiles WHERE role = 'admin' LIMIT 1;
  
  -- Create notification for subcontractor
  IF NEW.status = 'in-progress' THEN
    message := 'Your job ' || NEW.job_type || ' at ' || NEW.location || ' is now in progress.';
  ELSIF NEW.status = 'completed' THEN
    message := 'Your job ' || NEW.job_type || ' at ' || NEW.location || ' has been marked as completed.';
  END IF;
  
  IF message IS NOT NULL THEN
    INSERT INTO notifications (recipient_id, sender_id, message, related_entity_type, related_entity_id)
    VALUES (NEW.subcontractor_id, admin_id, message, 'job', NEW.id);
  END IF;
  
  -- Create notification for admin when new job is submitted
  IF NEW.status = 'pending' AND TG_OP = 'INSERT' THEN
    IF admin_id IS NOT NULL THEN
      INSERT INTO notifications (recipient_id, sender_id, message, related_entity_type, related_entity_id)
      VALUES (admin_id, NEW.subcontractor_id, 'New job submission: ' || NEW.job_type || ' at ' || NEW.location, 'job', NEW.id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Migrate existing user roles from auth.users metadata to profiles table
DO $$
DECLARE
  user_record RECORD;
BEGIN
  -- Find users with admin role in metadata and update their profiles
  FOR user_record IN 
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  LOOP
    UPDATE profiles
    SET role = 'admin'
    WHERE id = user_record.id;
    
    RAISE NOTICE 'Updated role to admin for user ID: %', user_record.id;
  END LOOP;
END $$;

-- 4. Set romico@gmail.com as admin
-- First make sure the user exists in profiles
DO $$
DECLARE
  user_id UUID;
BEGIN
  -- Get the user's ID
  SELECT id INTO user_id FROM auth.users WHERE email = 'romico@gmail.com';
  
  IF user_id IS NOT NULL THEN
    -- Update or insert the profile
    INSERT INTO profiles (id, company_name, contact_person, role, created_at, updated_at)
    VALUES (
      user_id, 
      'Admin User', 
      'System Administrator', 
      'admin', 
      NOW(), 
      NOW()
    )
    ON CONFLICT (id) 
    DO UPDATE SET 
      role = 'admin',
      updated_at = NOW();
      
    RAISE NOTICE 'Admin role set for romico@gmail.com';
  ELSE
    RAISE NOTICE 'User romico@gmail.com not found in auth.users';
  END IF;
END
$$;
