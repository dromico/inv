-- Add line_items column to store detailed job items as JSON
ALTER TABLE public.jobs
ADD COLUMN line_items jsonb;

-- Optional: Add a comment to the column for clarity
COMMENT ON COLUMN public.jobs.line_items IS 'Stores an array of job line items, each with item_name, unit_quantity, unit_price, and total.';