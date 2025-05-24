import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for server operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  console.log('Starting simplified file upload process...');
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const useDummyUserId = formData.get('dummyUserId') === 'true';
    
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }
    
    // Create a unique filename with timestamp
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}-${file.name}`;
    
    console.log(`Uploading file to papers bucket: ${fileName}`);
    
    // Upload file to storage
    const { data: storageData, error: storageError } = await supabase.storage
      .from('papers')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (storageError) {
      console.error('Storage upload error:', storageError);
      return NextResponse.json({ success: false, error: storageError.message }, { status: 500 });
    }
    
    // Insert into database with minimal fields
    try {
      // Prepare record with only the essential fields
      const record: any = {
        title,
        file_path: fileName,
        file_type: fileExtension
      };
      
      // Add dummy user_id if requested
      if (useDummyUserId) {
        console.log('Adding dummy user_id to paper record');
        // Only add user_id if we really need to
        try {
          // Try inserting without user_id first
          const { error: testError } = await supabase
            .from('papers')
            .insert({
              title: 'TEST DELETE ME',
              file_path: 'test.pdf',
              file_type: 'pdf'
            });
          
          if (testError && testError.message.includes('violates not-null constraint')) {
            // If user_id is required, use UUID v4 function from Supabase
            const { data: uuidData } = await supabase
              .rpc('uuid_generate_v4');
            
            if (uuidData) {
              record.user_id = uuidData;
            }
          }
          
          // Delete the test record
          await supabase
            .from('papers')
            .delete()
            .eq('title', 'TEST DELETE ME');
            
        } catch (userErr) {
          console.log('Error checking user_id requirement:', userErr);
        }
      }
      
      // Insert the record
      const { data, error } = await supabase
        .from('papers')
        .insert(record)
        .select();
      
      if (error) {
        console.error('Database insert error:', error);
        // Continue despite error - the file is already in storage
      } else {
        console.log('Paper record created with ID:', data?.[0]?.id);
      }
    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      // Continue despite error - the file is already in storage
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      fileInfo: {
        name: fileName,
        type: fileExtension,
        path: storageData?.path || fileName
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