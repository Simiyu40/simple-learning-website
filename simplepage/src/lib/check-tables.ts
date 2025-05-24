import { supabase } from './supabase';

export async function checkTables() {
  console.log('Checking Supabase tables...');
  
  try {
    // Check if papers table exists
    const { data: papers, error: papersError } = await supabase
      .from('papers')
      .select('id, title, created_at, user_id, file_path, file_type')
      .limit(1);
    
    if (papersError) {
      console.error('Error checking papers table:', papersError);
      console.error('This might indicate that the papers table does not exist or has a different structure.');
      return false;
    }
    
    if (!papers) {
      console.error('Papers table exists but returned no data');
      return false;
    }
    
    console.log('Papers table exists and has the correct structure.');
    
    // Check if solutions table exists
    const { data: solutions, error: solutionsError } = await supabase
      .from('solutions')
      .select('id, paper_id, question_id, created_at, user_id, file_path, file_type')
      .limit(1);
    
    if (solutionsError) {
      console.error('Error checking solutions table:', solutionsError);
      console.error('This might indicate that the solutions table does not exist or has a different structure.');
      return false;
    }
    
    if (!solutions) {
      console.error('Solutions table exists but returned no data');
      return false;
    }
    
    console.log('Solutions table exists and has the correct structure.');
    return true;
  } catch (err) {
    console.error('Exception when checking tables:', err);
    return false;
  }
}

async function checkDatabaseConnection() {
  try {
    // Test the connection
    const { error } = await supabase.from('papers').select('count').single();
    
    if (error) {
      console.error('Error connecting to database:', error.message);
      return false;
    }

    console.log('Successfully connected to database!');
    return true;
  } catch (err) {
    console.error('Error:', err);
    return false;
  }
}

async function createTables() {
  try {
    // Split the migration SQL into separate statements
    const migrationStatements = [
      `CREATE TABLE IF NOT EXISTS papers (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          title TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
          user_id UUID NOT NULL,
          file_path TEXT NOT NULL,
          file_size BIGINT NOT NULL,
          file_type TEXT NOT NULL,
          status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
      )`,
      `CREATE TABLE IF NOT EXISTS solutions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
          user_id UUID NOT NULL,
          content TEXT NOT NULL
      )`,
      'CREATE INDEX IF NOT EXISTS papers_user_id_idx ON papers(user_id)',
      'CREATE INDEX IF NOT EXISTS papers_created_at_idx ON papers(created_at)',
      'CREATE INDEX IF NOT EXISTS solutions_paper_id_idx ON solutions(paper_id)',
      'CREATE INDEX IF NOT EXISTS solutions_user_id_idx ON solutions(user_id)'
    ];

    // Execute each statement separately using rpc
    for (const sql of migrationStatements) {
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
      
      if (error) {
        console.error('Error creating tables:', error.message);
        return false;
      }
    }

    console.log('Tables created or verified successfully!');
    return true;
  } catch (err) {
    console.error('Error creating tables:', err);
    return false;
  }
}

// Export functions to be used elsewhere
export { checkDatabaseConnection, createTables };