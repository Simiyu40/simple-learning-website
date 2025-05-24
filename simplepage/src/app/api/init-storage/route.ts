import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for server operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    console.log('Initializing storage buckets...');
    
    // Create papers bucket if it doesn't exist
    const { data: papersBucket, error: papersError } = await supabase.storage
      .createBucket('papers', {
        public: true, // Make the bucket public
        fileSizeLimit: 52428800, // 50MB limit
      });
    
    if (papersError && !papersError.message.includes('already exists')) {
      console.error('Error creating papers bucket:', papersError);
    } else {
      console.log('Papers bucket created or already exists');
    }
    
    // Create solutions bucket if it doesn't exist
    const { data: solutionsBucket, error: solutionsError } = await supabase.storage
      .createBucket('solutions', {
        public: true, // Make the bucket public
        fileSizeLimit: 52428800, // 50MB limit
      });
    
    if (solutionsError && !solutionsError.message.includes('already exists')) {
      console.error('Error creating solutions bucket:', solutionsError);
    } else {
      console.log('Solutions bucket created or already exists');
    }
    
    // Update bucket policies to make them public
    const { error: policyError } = await supabase.storage
      .getBucket('papers');
    
    if (policyError) {
      console.error('Error getting papers bucket policy:', policyError);
    }
    
    // Try inserting a test file
    const testBuffer = Buffer.from('Test file content');
    const { data: testFile, error: testError } = await supabase.storage
      .from('papers')
      .upload('test-file.txt', testBuffer, {
        contentType: 'text/plain',
        upsert: true
      });
    
    if (testError) {
      console.error('Error uploading test file:', testError);
    } else {
      console.log('Test file uploaded successfully');
    }
    
    return NextResponse.json({
      success: true,
      message: 'Storage buckets initialized',
      papersBucket: !papersError,
      solutionsBucket: !solutionsError,
      testFile: !testError
    });
  } catch (error) {
    console.error('Storage initialization error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
} 