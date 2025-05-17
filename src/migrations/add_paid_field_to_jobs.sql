-- Add paid field to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS paid BOOLEAN DEFAULT FALSE;

-- Create index for faster queries on paid status
CREATE INDEX IF NOT EXISTS idx_jobs_paid ON jobs(paid);

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES profiles(id),
  message TEXT NOT NULL,
  related_entity_type TEXT,
  related_entity_id UUID,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries on recipient_id
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);

-- Create index for faster queries on read status
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON notifications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
