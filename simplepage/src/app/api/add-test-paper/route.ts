import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  console.log('Adding test paper directly to database...');
  
  try {
    // Create a test paper entry
    const timestamp = Date.now();
    const testTitle = `Test Paper ${timestamp}`;
    const testPath = `${timestamp}-test-paper.pdf`;
    
    const { data, error } = await serviceClient
      .from('papers')
      .insert({
        title: testTitle,
        file_path: testPath,
        file_type: 'pdf',
        user_id: '00000000-0000-0000-0000-000000000000' // Add dummy user_id
      })
      .select();
    
    if (error) {
      console.error('Error adding test paper:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to add test paper',
        details: error.message
      }, { status: 500 });
    }
    
    console.log('Test paper added successfully:', data);
    
    // Now fetch all papers to verify
    const { data: papers, error: fetchError } = await serviceClient
      .from('papers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (fetchError) {
      console.error('Error fetching papers:', fetchError);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Test paper added successfully',
      paper: data?.[0] || null,
      allPapers: papers || []
    });
  } catch (error) {
    console.error('Error in add test paper:', error);
    return NextResponse.json({
      success: false,
      error: 'Add test paper failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 