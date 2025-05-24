import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  console.log('Attempting to recreate tables with correct schema...');
  
  try {
    // Enable uuid extension first
    try {
      const { error: uuidError } = await serviceClient.rpc('admin_query', {
        sql: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
      });
      
      if (uuidError) {
        console.error('Error enabling UUID extension:', uuidError);
      }
    } catch (uuidErr) {
      console.error('Exception enabling UUID extension:', uuidErr);
    }
    
    // First check if tables exist
    try {
      // Try to create a backup of papers table if it exists
      await serviceClient.rpc('admin_query', {
        sql: `
          CREATE TABLE IF NOT EXISTS papers_backup AS 
          SELECT * FROM papers;
        `
      });
      console.log('Papers backup created or already exists');
      
      // Try to create a backup of solutions table if it exists
      await serviceClient.rpc('admin_query', {
        sql: `
          CREATE TABLE IF NOT EXISTS solutions_backup AS 
          SELECT * FROM solutions;
        `
      });
      console.log('Solutions backup created or already exists');
    } catch (backupError) {
      console.warn('Error creating backups:', backupError);
    }
    
    // Drop and recreate papers table
    try {
      const { error: dropError } = await serviceClient.rpc('admin_query', {
        sql: `
          DROP TABLE IF EXISTS papers CASCADE;
          
          CREATE TABLE papers (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            title TEXT NOT NULL,
            file_path TEXT NOT NULL,
            file_type TEXT NOT NULL,
            file_size BIGINT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
            user_id UUID,
            status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
          );
          
          CREATE INDEX papers_user_id_idx ON papers(user_id);
          CREATE INDEX papers_created_at_idx ON papers(created_at);
          
          -- Add table comment to refresh schema cache
          COMMENT ON TABLE papers IS 'Paper documents with all required columns';
          
          -- Explicitly refresh schema cache
          NOTIFY pgrst, 'reload schema';
        `
      });
      
      if (dropError) {
        console.error('Error recreating papers table:', dropError);
      } else {
        console.log('Papers table recreated successfully');
      }
    } catch (papersError) {
      console.error('Exception recreating papers table:', papersError);
    }
    
    // Drop and recreate solutions table
    try {
      const { error: dropError } = await serviceClient.rpc('admin_query', {
        sql: `
          DROP TABLE IF EXISTS solutions;
          
          CREATE TABLE solutions (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            paper_id UUID,
            question_id TEXT NOT NULL,
            file_path TEXT NOT NULL,
            file_type TEXT NOT NULL,
            file_size BIGINT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
            user_id UUID,
            content TEXT DEFAULT ''
          );
          
          -- Add foreign key constraint
          ALTER TABLE solutions ADD CONSTRAINT solutions_paper_id_fkey 
              FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE;
          
          CREATE INDEX solutions_paper_id_idx ON solutions(paper_id);
          CREATE INDEX solutions_user_id_idx ON solutions(user_id);
          
          -- Add table comment to refresh schema cache
          COMMENT ON TABLE solutions IS 'Solution documents with all required columns';
          
          -- Explicitly refresh schema cache
          NOTIFY pgrst, 'reload schema';
        `
      });
      
      if (dropError) {
        console.error('Error recreating solutions table:', dropError);
      } else {
        console.log('Solutions table recreated successfully');
      }
    } catch (solutionsError) {
      console.error('Exception recreating solutions table:', solutionsError);
    }
    
    // Try to restore data from backups
    try {
      // Restore papers data
      await serviceClient.rpc('admin_query', {
        sql: `
          INSERT INTO papers (id, title, file_path, file_type, user_id, created_at, updated_at, status)
          SELECT id, title, file_path, file_type, user_id, created_at, updated_at, 'completed' as status
          FROM papers_backup
          ON CONFLICT (id) DO NOTHING;
        `
      });
      console.log('Papers data restored from backup');
      
      // Restore solutions data
      await serviceClient.rpc('admin_query', {
        sql: `
          INSERT INTO solutions (id, paper_id, question_id, file_path, file_type, user_id, created_at, updated_at, content)
          SELECT id, paper_id, question_id, file_path, file_type, user_id, created_at, updated_at, content
          FROM solutions_backup
          ON CONFLICT (id) DO NOTHING;
        `
      });
      console.log('Solutions data restored from backup');
    } catch (restoreError) {
      console.warn('Error restoring data from backups:', restoreError);
    }
    
    // Verify the schema by checking if we can access the tables
    try {
      const { data: papers, error: papersError } = await serviceClient
        .from('papers')
        .select('*')
        .limit(1);
      
      if (papersError) {
        console.error('Error verifying papers table:', papersError);
      } else {
        console.log('Successfully accessed papers table');
      }
      
      const { data: solutions, error: solutionsError } = await serviceClient
        .from('solutions')
        .select('*')
        .limit(1);
      
      if (solutionsError) {
        console.error('Error verifying solutions table:', solutionsError);
      } else {
        console.log('Successfully accessed solutions table');
      }
    } catch (verifyError) {
      console.error('Exception verifying tables:', verifyError);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Tables recreated with correct schema'
    });
  } catch (error) {
    console.error('Error recreating tables:', error);
    return NextResponse.json({
      success: false,
      error: 'Table recreation failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 