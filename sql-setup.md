-- SQL Setup for Subcontractor Work Management System

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types for job and invoice status
CREATE TYPE job_status AS ENUM ('pending', 'in-progress', 'completed');
CREATE TYPE invoice_status AS ENUM ('unpaid', 'paid', 'overdue');
CREATE TYPE notification_entity_type AS ENUM ('job', 'invoice', 'system');

-- Create profiles table for user information
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_person TEXT,
  phone_number TEXT,
  address TEXT,
  role TEXT DEFAULT 'subcontractor' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create jobs table
CREATE TABLE jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  subcontractor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  job_type TEXT NOT NULL,
  location TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status job_status DEFAULT 'pending' NOT NULL,
  unit NUMERIC NOT NULL,
  unit_price NUMERIC NOT NULL,
  total NUMERIC GENERATED ALWAYS AS (unit * unit_price) STORED,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ
);

-- Create invoices table
CREATE TABLE invoices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  issued_date DATE NOT NULL,
  due_date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  status invoice_status DEFAULT 'unpaid' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ
);

-- Create notifications table
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE NOT NULL,
  related_entity_type notification_entity_type,
  related_entity_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create files table (optional)
CREATE TABLE files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  content_type TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, company_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'company_name', 'User ' || NEW.id::text));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when a user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at timestamp
CREATE TRIGGER update_profiles_modified
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_jobs_modified
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_invoices_modified
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Function to create a notification when job status changes
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

-- Create trigger for job notifications
CREATE TRIGGER job_notification_trigger
  AFTER INSERT OR UPDATE OF status ON jobs
  FOR EACH ROW EXECUTE FUNCTION notify_on_job_status_change();

-- Function to create invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  count_invoices INTEGER;
  invoice_number TEXT;
BEGIN
  -- Get current year
  year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  -- Count existing invoices for this year
  SELECT COUNT(*) INTO count_invoices
  FROM invoices
  WHERE invoice_number LIKE 'INV-' || year_part || '-%';
  
  -- Generate invoice number (INV-YYYY-XXXX format)
  invoice_number := 'INV-' || year_part || '-' || LPAD(CAST(count_invoices + 1 AS TEXT), 4, '0');
  
  -- Set the invoice number
  NEW.invoice_number := invoice_number;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for invoice number generation
CREATE TRIGGER generate_invoice_number_trigger
  BEFORE INSERT ON invoices
  FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();

-- Row Level Security Policies

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Jobs policies
CREATE POLICY "Subcontractors can view their own jobs"
  ON jobs FOR SELECT
  USING (auth.uid() = subcontractor_id);

CREATE POLICY "Subcontractors can insert their own jobs"
  ON jobs FOR INSERT
  WITH CHECK (auth.uid() = subcontractor_id);

CREATE POLICY "Subcontractors can update their pending jobs"
  ON jobs FOR UPDATE
  USING (auth.uid() = subcontractor_id AND status = 'pending');

CREATE POLICY "Subcontractors can delete their pending jobs"
  ON jobs FOR DELETE
  USING (auth.uid() = subcontractor_id AND status = 'pending');

CREATE POLICY "Admins can view all jobs"
  ON jobs FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can update any job"
  ON jobs FOR UPDATE
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can delete any job"
  ON jobs FOR DELETE
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Invoices policies
CREATE POLICY "Subcontractors can view their own invoices"
  ON invoices FOR SELECT
  USING (
    auth.uid() IN (SELECT subcontractor_id FROM jobs WHERE id = invoices.job_id)
  );

CREATE POLICY "Admins can manage all invoices"
  ON invoices FOR ALL
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = recipient_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = recipient_id);

CREATE POLICY "Admins can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can view all notifications"
  ON notifications FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Files policies
CREATE POLICY "Subcontractors can view files for their own jobs"
  ON files FOR SELECT
  USING (
    auth.uid() IN (SELECT subcontractor_id FROM jobs WHERE id = files.job_id)
  );

CREATE POLICY "Subcontractors can insert files for their own jobs"
  ON files FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT subcontractor_id FROM jobs WHERE id = files.job_id)
  );

CREATE POLICY "Subcontractors can delete files for their own jobs"
  ON files FOR DELETE
  USING (
    auth.uid() IN (SELECT subcontractor_id FROM jobs WHERE id = files.job_id)
  );

CREATE POLICY "Admins can manage all files"
  ON files FOR ALL
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Note: Admin user creation should be done by updating the profiles table
-- To create an admin user in Supabase:
-- 1. Go to Authentication > Users in the Supabase dashboard
-- 2. Click "Add User" and create a user with email and password
-- 3. Then run the following SQL to set the user as admin:
--    UPDATE profiles
--    SET role = 'admin'
--    WHERE id = (SELECT id FROM auth.users WHERE email = 'your-admin-email@example.com');
