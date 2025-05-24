import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for server operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    console.log('Attempting to insert a test paper...');
    
    // Insert a test paper
    const { data, error } = await supabase
      .from('papers')
      .insert({
        title: 'Test Paper',
        file_path: 'test-paper.pdf',
        file_type: 'pdf',
        file_size: 1024,
        status: 'completed' // Make sure status matches the allowed values in the constraint
      })
      .select();
    
    if (error) {
      console.error('Error inserting test paper:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    console.log('Test paper inserted:', data);
    
    return NextResponse.json({
      success: true,
      message: 'Test paper inserted successfully',
      paper: data[0]
    });
  } catch (error) {
    console.error('Test insert error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
} 