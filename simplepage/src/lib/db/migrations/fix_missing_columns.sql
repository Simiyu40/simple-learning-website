-- Fix missing columns in papers table
ALTER TABLE papers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed'));
ALTER TABLE papers ADD COLUMN IF NOT EXISTS file_size BIGINT;
ALTER TABLE papers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());
ALTER TABLE papers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());

-- Fix missing columns in solutions table
ALTER TABLE solutions ADD COLUMN IF NOT EXISTS file_size BIGINT;
ALTER TABLE solutions ADD COLUMN IF NOT EXISTS content TEXT DEFAULT '';
ALTER TABLE solutions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());
ALTER TABLE solutions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()); 