-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Fix papers table
CREATE TABLE IF NOT EXISTS papers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT,
    paper_type TEXT DEFAULT 'other',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    user_id UUID,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Fix solutions table
CREATE TABLE IF NOT EXISTS solutions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    paper_id UUID NOT NULL,
    question_id TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    user_id UUID,
    content TEXT DEFAULT ''
);

-- Add missing columns if they exist
ALTER TABLE papers ADD COLUMN IF NOT EXISTS file_size BIGINT;
ALTER TABLE papers ADD COLUMN IF NOT EXISTS paper_type TEXT DEFAULT 'other';
ALTER TABLE papers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed'));
ALTER TABLE papers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());
ALTER TABLE papers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());

ALTER TABLE solutions ADD COLUMN IF NOT EXISTS file_size BIGINT;
ALTER TABLE solutions ADD COLUMN IF NOT EXISTS content TEXT DEFAULT '';
ALTER TABLE solutions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());
ALTER TABLE solutions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());

-- Set NOT NULL constraints to be safer (better for development)
ALTER TABLE papers ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE solutions ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE solutions ALTER COLUMN paper_id DROP NOT NULL;

-- Fix foreign key constraint if needed
ALTER TABLE solutions DROP CONSTRAINT IF EXISTS solutions_paper_id_fkey;
ALTER TABLE solutions ADD CONSTRAINT solutions_paper_id_fkey 
    FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS papers_user_id_idx ON papers(user_id);
CREATE INDEX IF NOT EXISTS papers_created_at_idx ON papers(created_at);
CREATE INDEX IF NOT EXISTS papers_paper_type_idx ON papers(paper_type);
CREATE INDEX IF NOT EXISTS solutions_paper_id_idx ON solutions(paper_id);
CREATE INDEX IF NOT EXISTS solutions_user_id_idx ON solutions(user_id); 