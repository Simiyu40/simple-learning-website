import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for server operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    console.log('Simulating a simple file upload with just basic fields...');
    
    // Create a test filename
    const timestamp = Date.now();
    const fileName = `${timestamp}-test-document.pdf`;
    
    // Insert with only the most basic fields
    const { data, error } = await supabase
      .from('papers')
      .insert({
        title: 'Simple Upload Test',
        file_path: fileName,
        file_type: 'pdf'
      })
      .select();
    
    if (error) {
      console.error('Error inserting test paper:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    console.log('Test paper inserted:', data);
    
    // Get papers to verify
    const papersResponse = await fetch('http://localhost:3000/api/get-papers');
    const papersData = await papersResponse.json();
    
    return NextResponse.json({
      success: true,
      message: 'Test paper created successfully',
      paper: data[0],
      papersFromApi: papersData
    });
  } catch (error) {
    console.error('Test upload error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
} 