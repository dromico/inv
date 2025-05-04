-- Create the invoices table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    subcontractor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    invoice_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    total_amount NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'generated', -- e.g., 'generated', 'sent', 'paid'
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for frequently queried columns
CREATE INDEX idx_invoices_job_id ON invoices(job_id);
CREATE INDEX idx_invoices_subcontractor_id ON invoices(subcontractor_id);
CREATE INDEX idx_invoices_status ON invoices(status);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update updated_at on row update
CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Policies for admin users
-- Admins can view all invoices
CREATE POLICY "Allow admin read access" ON invoices
    FOR SELECT USING (is_admin(auth.uid()));

-- Admins can create invoices (implicitly handled by the route logic, but good to have)
CREATE POLICY "Allow admin insert access" ON invoices
    FOR INSERT WITH CHECK (is_admin(auth.uid()));

-- Admins can update invoices (e.g., change status)
CREATE POLICY "Allow admin update access" ON invoices
    FOR UPDATE USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- Admins can delete invoices (optional, consider if needed)
CREATE POLICY "Allow admin delete access" ON invoices
    FOR DELETE USING (is_admin(auth.uid()));

-- Policies for subcontractors (optional, if they need to view their own invoices)
-- Subcontractors can view their own invoices
-- CREATE POLICY "Allow subcontractor read access" ON invoices
--     FOR SELECT USING (auth.uid() = subcontractor_id);

COMMENT ON TABLE invoices IS 'Stores generated invoice records.';
COMMENT ON COLUMN invoices.status IS 'Current status of the invoice (e.g., generated, sent, paid).';