import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for server operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    console.log('Initializing storage buckets...');
    console.log('Supabase URL:', supabaseUrl);
    console.log('Service key available:', !!supabaseServiceKey);

    // Check if we have valid credentials
    if (!supabaseUrl || supabaseUrl.includes('demo') || !supabaseServiceKey || supabaseServiceKey.includes('demo')) {
      console.log('Demo mode detected - skipping storage initialization');
      return NextResponse.json({
        success: true,
        message: 'Demo mode - storage initialization skipped',
        demoMode: true
      });
    }

    // First, test basic connection
    try {
      const { data: testConnection, error: connectionError } = await supabase
        .from('papers')
        .select('count')
        .limit(1);

      if (connectionError) {
        console.log('Connection test failed:', connectionError.message);

        // If it's an auth error, it might be due to wrong anon key
        if (connectionError.message.includes('JWT') || connectionError.message.includes('Invalid API key')) {
          return NextResponse.json({
            success: false,
            error: 'Authentication failed - please check your Supabase API keys',
            details: 'The anon key or service role key appears to be incorrect'
          }, { status: 500 });
        }

        return NextResponse.json({
          success: false,
          error: `Connection failed: ${connectionError.message}`,
          details: 'Unable to connect to Supabase database'
        }, { status: 500 });
      }

      console.log('Database connection successful');
    } catch (connErr) {
      console.error('Connection test error:', connErr);
      return NextResponse.json({
        success: false,
        error: 'Network connection failed',
        details: connErr instanceof Error ? connErr.message : 'Unknown connection error'
      }, { status: 500 });
    }

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