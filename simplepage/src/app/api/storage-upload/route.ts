import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for server operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  console.log('Starting storage-only file upload process...');
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string; // Store in metadata
    
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }
    
    // Create a unique filename with timestamp and title
    const timestamp = Date.now();
    const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}-${sanitizedTitle}.${fileExtension}`;
    
    console.log(`Uploading file to papers bucket: ${fileName}`);
    
    // Upload file to storage with metadata
    const { data: storageData, error: storageError } = await supabase.storage
      .from('papers')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
        duplex: 'half',
        // Include basic metadata in file name
        // (Will be available in read view)
      });
    
    if (storageError) {
      console.error('Storage upload error:', storageError);
      return NextResponse.json({ success: false, error: storageError.message }, { status: 500 });
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('papers')
      .getPublicUrl(fileName);
    
    console.log('File uploaded successfully to storage');
    
    // Return success response with file info
    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully to storage',
      fileInfo: {
        name: fileName,
        title: title,
        type: fileExtension,
        path: storageData?.path || fileName,
        url: urlData?.publicUrl
      }
    });
  } catch (error) {
    console.error('Upload process error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
} 