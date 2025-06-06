-- migrations/005_add_invoice_settings.sql
CREATE TABLE invoice_settings (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add the specific setting for "to whom it may concern" text with a default value
INSERT INTO invoice_settings (setting_key, setting_value)
VALUES ('invoice_recipient_text', 'To Whom It May Concern,')
ON CONFLICT (setting_key) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE invoice_settings ENABLE ROW LEVEL SECURITY;

-- Grant access to authenticated users (adjust based on your actual roles/policies)
-- Assuming an 'is_admin' function exists or similar check for admin role
CREATE POLICY "Allow admin read access" ON invoice_settings
    FOR SELECT USING (auth.role() = 'authenticated' AND is_admin(auth.uid()));

CREATE POLICY "Allow admin update access" ON invoice_settings
    FOR UPDATE USING (auth.role() = 'authenticated' AND is_admin(auth.uid()));

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function on update
CREATE TRIGGER update_invoice_settings_updated_at
BEFORE UPDATE ON invoice_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();