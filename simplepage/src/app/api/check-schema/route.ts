import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  console.log('Checking database schema...');
  
  const results: {
    tables: any | null;
    columns: any | null;
    papers_columns: any | null;
    solutions_columns: any | null;
    error: string | null;
  } = {
    tables: null,
    columns: null,
    papers_columns: null,
    solutions_columns: null,
    error: null
  };
  
  try {
    // Check which tables exist
    try {
      const { data: tables, error } = await serviceClient.rpc('admin_query', {
        sql: `
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public'
          ORDER BY table_name;
        `
      });
      
      results.tables = tables;
      
      if (error) {
        console.error('Error checking tables:', error);
        results.error = `Error checking tables: ${error.message}`;
      }
    } catch (tablesError) {
      console.error('Exception checking tables:', tablesError);
      results.error = `Exception checking tables: ${tablesError instanceof Error ? tablesError.message : String(tablesError)}`;
    }
    
    // Check papers table columns
    try {
      const { data: papersColumns, error } = await serviceClient.rpc('admin_query', {
        sql: `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = 'papers'
          ORDER BY ordinal_position;
        `
      });
      
      results.papers_columns = papersColumns;
      
      if (error) {
        console.error('Error checking papers columns:', error);
      }
    } catch (columnsError) {
      console.error('Exception checking papers columns:', columnsError);
    }
    
    // Check solutions table columns
    try {
      const { data: solutionsColumns, error } = await serviceClient.rpc('admin_query', {
        sql: `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = 'solutions'
          ORDER BY ordinal_position;
        `
      });
      
      results.solutions_columns = solutionsColumns;
      
      if (error) {
        console.error('Error checking solutions columns:', error);
      }
    } catch (columnsError) {
      console.error('Exception checking solutions columns:', columnsError);
    }
    
    // Check if we can directly query the papers table
    try {
      const { data, error } = await serviceClient
        .from('papers')
        .select('*')
        .limit(1);
        
      if (error) {
        console.error('Error querying papers table:', error);
        results.error = `Error querying papers table: ${error.message}`;
      } else {
        console.log('Successfully queried papers table');
      }
    } catch (queryError) {
      console.error('Exception querying papers table:', queryError);
    }
    
    return NextResponse.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Error checking schema:', error);
    return NextResponse.json({
      success: false,
      error: 'Schema check failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 