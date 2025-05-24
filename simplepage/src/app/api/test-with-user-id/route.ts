import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for server operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    console.log('Testing paper insert with user_id...');
    
    // Create a test UUID for user_id
    const dummyUserId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    
    // Insert with user_id
    const { data, error } = await supabase
      .from('papers')
      .insert({
        title: 'User ID Test',
        file_path: 'user-id-test.pdf',
        file_type: 'pdf',
        user_id: dummyUserId
      })
      .select();
    
    if (error) {
      console.error('Error inserting test paper:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    console.log('Test paper inserted with user_id:', data);
    
    // Get all papers to verify
    const { data: allPapers, error: fetchError } = await supabase
      .from('papers')
      .select('*')
      .limit(10);
    
    return NextResponse.json({
      success: true,
      message: 'Test paper with user_id created successfully',
      paper: data[0],
      allPapers: allPapers || [],
      fetchError: fetchError ? fetchError.message : null
    });
  } catch (error) {
    console.error('Test insert error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
} 