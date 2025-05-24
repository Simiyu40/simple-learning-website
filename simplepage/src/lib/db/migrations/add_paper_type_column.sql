-- Add paper_type column to papers table if it doesn't exist
ALTER TABLE papers ADD COLUMN IF NOT EXISTS paper_type TEXT DEFAULT 'other';

-- Create an index on the paper_type column for better performance
CREATE INDEX IF NOT EXISTS papers_paper_type_idx ON papers(paper_type);

-- Ensure existing papers have a paper_type set
UPDATE papers SET paper_type = 'other' WHERE paper_type IS NULL;

-- Add comment to the column for documentation
COMMENT ON COLUMN papers.paper_type IS 'Type of paper: exam, assignment, notes, or other'; 