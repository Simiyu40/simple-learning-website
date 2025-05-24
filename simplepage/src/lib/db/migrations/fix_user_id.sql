-- Make user_id nullable in papers table
ALTER TABLE papers ALTER COLUMN user_id DROP NOT NULL;

-- Make user_id nullable in solutions table
ALTER TABLE solutions ALTER COLUMN user_id DROP NOT NULL; 