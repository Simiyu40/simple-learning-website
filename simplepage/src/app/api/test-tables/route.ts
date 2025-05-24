import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for server operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    console.log('Checking if tables exist in the database...');
    
    // Use raw SQL to check table existence
    const { data: tablesData, error: tablesError } = await supabase
      .from('pg_catalog.pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');
    
    if (tablesError) {
      console.error('Error checking tables:', tablesError);
      
      // Try direct SQL method
      const { data: sqlData, error: sqlError } = await supabase.rpc('exec', { 
        query: 'SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = \'public\''
      });
      
      if (sqlError) {
        console.error('SQL error:', sqlError);
        return NextResponse.json({ 
          success: false, 
          error: 'Could not query tables', 
          details: [tablesError, sqlError]
        }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        method: 'rpc exec',
        tables: sqlData
      });
    }
    
    // Insert a test paper to see if it works
    if (tablesData && tablesData.some(t => t.tablename === 'papers')) {
      const { data: insertData, error: insertError } = await supabase
        .from('papers')
        .insert({
          title: 'Test Paper',
          file_path: 'test-paper.pdf',
          file_type: 'pdf'
        })
        .select();
      
      return NextResponse.json({
        success: true,
        tables: tablesData,
        testInsert: {
          success: !insertError,
          error: insertError ? insertError.message : null,
          data: insertData
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      tables: tablesData || []
    });
  } catch (error) {
    console.error('Table check error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
} 