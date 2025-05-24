-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create simple papers table
CREATE TABLE IF NOT EXISTS papers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    status TEXT DEFAULT 'pending'
);

-- Create simple solutions table
CREATE TABLE IF NOT EXISTS solutions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    paper_id UUID,
    question_id TEXT,
    file_path TEXT NOT NULL,
    file_type TEXT,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    content TEXT DEFAULT ''
);

-- Make user_id optional for our test environment
ALTER TABLE papers ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE solutions ALTER COLUMN user_id DROP NOT NULL;

-- Fix foreign key constraint
ALTER TABLE solutions DROP CONSTRAINT IF EXISTS solutions_paper_id_fkey;
ALTER TABLE solutions ADD CONSTRAINT solutions_paper_id_fkey 
    FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS papers_created_at_idx ON papers(created_at);
CREATE INDEX IF NOT EXISTS solutions_paper_id_idx ON solutions(paper_id); 