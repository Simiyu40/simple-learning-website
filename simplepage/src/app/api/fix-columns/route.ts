import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for server operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    console.log('Fixing missing columns in papers table...');
    
    // Check the current structure of the papers table
    const { data: beforeColumns, error: beforeError } = await supabase
      .from('papers')
      .select('*')
      .limit(1);
    
    console.log('Current papers table columns:', beforeColumns ? Object.keys(beforeColumns[0] || {}) : 'none');
    
    // Add missing status column
    const addStatusColumnQuery = `
      ALTER TABLE papers 
      ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' 
      CHECK (status IN ('pending', 'processing', 'completed', 'failed'));
    `;
    
    const { data: statusResult, error: statusError } = await supabase
      .rpc('pgfunction', { name: 'admin_query', args: { query: addStatusColumnQuery } });
    
    if (statusError) {
      console.error('Error adding status column:', statusError);
      // Try direct query without the check constraint
      const simpleQuery = `ALTER TABLE papers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';`;
      const { data: simpleResult, error: simpleError } = await supabase
        .rpc('pgfunction', { name: 'admin_query', args: { query: simpleQuery } });
        
      if (simpleError) {
        console.error('Simple query error:', simpleError);
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to add status column', 
          details: [statusError, simpleError]
        }, { status: 500 });
      }
    }
    
    // Add missing file_size column
    const addFileSizeQuery = `ALTER TABLE papers ADD COLUMN IF NOT EXISTS file_size BIGINT;`;
    const { error: fileSizeError } = await supabase
      .rpc('pgfunction', { name: 'admin_query', args: { query: addFileSizeQuery } });
    
    if (fileSizeError) {
      console.error('Error adding file_size column:', fileSizeError);
    }
    
    // Add missing timestamp columns if needed
    const addTimestampsQuery = `
      ALTER TABLE papers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());
      ALTER TABLE papers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());
    `;
    const { error: timestampsError } = await supabase
      .rpc('pgfunction', { name: 'admin_query', args: { query: addTimestampsQuery } });
    
    if (timestampsError) {
      console.error('Error adding timestamp columns:', timestampsError);
    }
    
    // Check the current structure after modifications
    const { data: afterColumns, error: afterError } = await supabase
      .from('papers')
      .select('*')
      .limit(1);
    
    console.log('Updated papers table columns:', afterColumns ? Object.keys(afterColumns[0] || {}) : 'none');
    
    // Try to insert a test record
    const { data: insertResult, error: insertError } = await supabase
      .from('papers')
      .insert({
        title: 'Fixed Table Test ' + new Date().toISOString(),
        file_path: 'fixed-test.pdf',
        file_type: 'pdf',
        status: 'completed'
      })
      .select();
    
    return NextResponse.json({
      success: true,
      message: 'Migration attempted',
      beforeColumns: beforeColumns ? Object.keys(beforeColumns[0] || {}) : [],
      afterColumns: afterColumns ? Object.keys(afterColumns[0] || {}) : [],
      testInsert: {
        success: !insertError,
        error: insertError ? insertError.message : null,
        data: insertResult
      }
    });
  } catch (error) {
    console.error('Fix columns error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}