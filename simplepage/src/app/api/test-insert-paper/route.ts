import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for server operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    console.log('Attempting to insert a test paper after DB setup...');
    
    // Insert a test paper with all required fields
    const { data, error } = await supabase
      .from('papers')
      .insert({
        title: 'Demo Paper ' + new Date().toISOString(),
        file_path: 'demo-paper.pdf',
        file_type: 'pdf',
        file_size: 1024,
        status: 'completed'
      })
      .select();
    
    if (error) {
      console.error('Error inserting test paper:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    console.log('Test paper inserted:', data);
    
    // Query the papers table to verify data
    const { data: allPapers, error: queryError } = await supabase
      .from('papers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (queryError) {
      console.error('Error querying papers:', queryError);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Test paper inserted successfully',
      paper: data[0],
      allPapers: allPapers || []
    });
  } catch (error) {
    console.error('Test insert error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}