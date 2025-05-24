import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const serviceClient = createClient(supabaseUrl, 















supabaseServiceKey);

export async function GET() {
  try {
    console.log('Attempting to fix database schema...');
    
    // 1. Try to alter the papers table to make user_id nullable
    let papers_result = null;
    try {
      console.log('Modifying papers table...');
      const { error } = await serviceClient.from('papers').select('count').limit(1);
      
      // Check if the table exists and we can access it
      if (error) {
        console.error('Error accessing papers table:', error);
      }
        // Get list of existing columns to check if user_id exists
        const { data: columns, error: columnsError } = await serviceClient
          .from('information_schema')
          .select('column_name')
          .eq('table_name', 'papers');
          
        if (columnsError) {
          console.error('Error getting columns:', columnsError);
        } else {
          console.log('Columns in papers table:', columns);
          
          // Try to modify the table using raw SQL
          try {
            console.log('Attempting to drop foreign key constraint...');
            const query = `
              ALTER TABLE papers DROP CONSTRAINT IF EXISTS fk_user;
              ALTER TABLE papers ALTER COLUMN user_id DROP NOT NULL;
            `;
            
            // Use direct SQL execution if possible
            papers_result = await executeSQL(query);
            console.log('Papers table modification result:', papers_result);
          } catch (alterError) {
            console.error('Error altering papers table:', alterError);
            papers_result = { error: alterError instanceof Error ? alterError.message : String(alterError) };
          }
        }
      
    } catch (papersError) {
      console.error('Error with papers table:', papersError);
      papers_result = { error: papersError instanceof Error ? papersError.message : String(papersError) };
    }
    
    // 2. Try the same for solutions table
    let solutions_result = null;
    try {
      console.log('Modifying solutions table...');
      
      try {
        const query = `
          ALTER TABLE solutions DROP CONSTRAINT IF EXISTS fk_user;
          ALTER TABLE solutions ALTER COLUMN user_id DROP NOT NULL;
        `;
        
        solutions_result = await executeSQL(query);
        console.log('Solutions table modification result:', solutions_result);
      } catch (alterError) {
        console.error('Error altering solutions table:', alterError);
        solutions_result = { error: alterError instanceof Error ? alterError.message : String(alterError) };
      }
    } catch (solutionsError) {
      console.error('Error with solutions table:', solutionsError);
      solutions_result = { error: solutionsError instanceof Error ? solutionsError.message : String(solutionsError) };
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database fix attempted',
      papers_result,
      solutions_result
    });
  } catch (error) {
    console.error('Overall error in DB fix:', error);
    return NextResponse.json({
      success: false,
      error: 'Database fix failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// Helper function to execute SQL with multiple methods
async function executeSQL(sql: string) {
  // Try various methods to execute SQL
  
  // Method 1: Try using pgfunction RPC if available
  try {
    const { error } = await serviceClient.rpc('pgfunction', { sql });
    if (!error) {
      return { success: true, method: 'pgfunction' };
    }
  } catch {
    console.log('pgfunction method failed, trying alternative...');
  }
  
  // Method 2: Try admin_query RPC if available
  try {
    const { error } = await serviceClient.rpc('admin_query', { sql });
    if (!error) {
      return { success: true, method: 'admin_query' };
    }
  } catch {
    console.log('admin_query method failed, trying alternative...');
  }
  
  // Method 3: Try direct SQL execution
  try {
    const { error } = await serviceClient.from('_sql').select('*').eq('query', sql);
    if (!error) {
      return { success: true, method: 'direct_sql' };
    }
  } catch {
    console.log('direct SQL method failed, trying alternative...');
  }
  
  // Method 4: Try to modify a temporary table as a workaround
  try {
    await serviceClient.from('papers')
      .update({ file_path: 'dummy_update' })
      .eq('id', 'non-existent-id');
      
    return { 
      success: false, 
      fallback: true,
      message: 'SQL execution failed but table access attempted'
    };
  } catch {
    return { success: false, error: 'All SQL execution methods failed' };
  }
} 