-- Drop and recreate tables to fix schema issues
DROP TABLE IF EXISTS solutions;
DROP TABLE IF EXISTS papers;

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create papers table with correct schema
CREATE TABLE papers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    user_id UUID,
    status TEXT DEFAULT 'completed'
);

-- Create solutions table with correct schema
CREATE TABLE solutions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    paper_id UUID NOT NULL,
    question_id TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    user_id UUID,
    content TEXT DEFAULT ''
);

-- Add foreign key constraint
ALTER TABLE solutions ADD CONSTRAINT solutions_paper_id_fkey 
    FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX papers_user_id_idx ON papers(user_id);
CREATE INDEX papers_created_at_idx ON papers(created_at);
CREATE INDEX solutions_paper_id_idx ON solutions(paper_id);
CREATE INDEX solutions_user_id_idx ON solutions(user_id); 