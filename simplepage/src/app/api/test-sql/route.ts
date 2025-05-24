import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  console.log('Testing direct SQL execution...');
  
  try {
    // Try to execute a simple SQL query to create a papers table
    const createTableSQL = `
    CREATE TABLE IF NOT EXISTS papers (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      title TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_type TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
    );
    `;
    
    // Try directly running raw SQL
    try {
      const { data: sqlResult, error: sqlError } = await serviceClient.rpc('pgfunction', {
        sql: createTableSQL
      });
      
      console.log('SQL execution result:', sqlError ? 'Error' : 'Success');
      if (sqlError) {
        console.error('SQL error:', sqlError);
      }
    } catch (sqlExecError) {
      console.error('SQL execution error:', sqlExecError);
    }
    
    // Insert a test record directly
    const testTitle = `Test Direct SQL ${Date.now()}`;
    const insertSQL = `
    INSERT INTO papers (title, file_path, file_type, user_id)
    VALUES ('${testTitle}', 'direct-test.pdf', 'pdf', '00000000-0000-0000-0000-000000000000')
    RETURNING *;
    `;
    
    try {
      const { data: insertResult, error: insertError } = await serviceClient.rpc('pgfunction', {
        sql: insertSQL
      });
      
      console.log('Insert result:', insertError ? 'Error' : 'Success');
      if (insertError) {
        console.error('Insert error:', insertError);
      } else {
        console.log('Inserted data:', insertResult);
      }
    } catch (insertExecError) {
      console.error('Insert execution error:', insertExecError);
    }
    
    // Now try to query using the standard Supabase API
    const { data: papers, error: queryError } = await serviceClient
      .from('papers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (queryError) {
      console.error('Error querying papers:', queryError);
      return NextResponse.json({
        success: false,
        error: 'Failed to query papers',
        details: queryError.message
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'SQL test completed',
      papers: papers || []
    });
  } catch (error) {
    console.error('Error in SQL test:', error);
    return NextResponse.json({
      success: false,
      error: 'SQL test failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 