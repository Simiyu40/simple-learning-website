-- Add missing file_size column to papers table
ALTER TABLE papers ADD COLUMN IF NOT EXISTS file_size BIGINT;

-- Add missing file_size column to solutions table
ALTER TABLE solutions ADD COLUMN IF NOT EXISTS file_size BIGINT;

-- Make sure both table definitions update in the schema cache
COMMENT ON TABLE papers IS 'Paper documents';
COMMENT ON TABLE solutions IS 'Solution documents'; 