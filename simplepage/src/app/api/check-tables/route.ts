import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for server operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    console.log('Checking database with raw SQL...');
    
    // Check if papers table exists and has the expected structure
    const { data: paperResult, error: paperError } = await supabase
      .from('papers')
      .select('id, title, file_path, file_type, status')
      .limit(5);
    
    if (paperError) {
      console.error('Error querying papers table:', paperError);
      return NextResponse.json({ 
        success: false, 
        error: 'Papers table error', 
        details: paperError
      }, { status: 500 });
    }
    
    // Try to insert a test record
    const { data: insertResult, error: insertError } = await supabase
      .from('papers')
      .insert({
        title: 'Test Paper ' + new Date().toISOString(),
        file_path: 'test-document.pdf',
        file_type: 'pdf',
        status: 'completed'
      })
      .select();
    
    // Return all findings
    return NextResponse.json({
      success: true,
      papersTable: {
        exists: true,
        records: paperResult,
        count: paperResult ? paperResult.length : 0
      },
      testInsert: {
        success: !insertError,
        error: insertError ? insertError.message : null,
        data: insertResult
      }
    });
  } catch (error) {
    console.error('Database check error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
} 