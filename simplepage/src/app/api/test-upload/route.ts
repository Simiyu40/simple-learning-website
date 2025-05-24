import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for server operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    console.log('Simulating a paper upload...');
    
    // Create a test file name
    const timestamp = Date.now();
    const fileName = `${timestamp}-test-document.pdf`;
    
    // Insert a paper record
    const { data, error } = await supabase
      .from('papers')
      .insert({
        title: 'Test Upload ' + new Date().toISOString().split('T')[0],
        file_path: fileName,
        file_type: 'pdf',
        status: 'completed'
      })
      .select();
    
    if (error) {
      console.error('Error inserting test paper:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    console.log('Test paper inserted:', data);
    
    // Fetch all papers to verify
    const { data: allPapers, error: fetchError } = await supabase
      .from('papers')
      .select('id, title, file_path, file_type, status')
      .order('created_at', { ascending: false });
    
    return NextResponse.json({
      success: true,
      message: 'Test paper upload simulated successfully',
      paper: data[0],
      allPapers: allPapers || [],
      fetchError: fetchError ? fetchError.message : null
    });
  } catch (error) {
    console.error('Test upload error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
} 