import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for server operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  console.log('Starting minimal file upload process...');
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const paperType = formData.get('paperType') as string || 'other'; // Default to 'other' if not provided
    const paperId = formData.get('paperId') as string;
    const questionId = formData.get('questionId') as string;
    
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }
    
    // Determine if this is a paper or solution upload
    const isPaper = !paperId && !questionId;
    const bucket = isPaper ? 'papers' : 'solutions';
    
    // Create a unique filename with timestamp and sanitized original name
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileExtension = originalName.split('.').pop()?.toLowerCase() || 'unknown';
    const fileName = `${timestamp}-${originalName}`;
    
    console.log(`Uploading file to ${bucket} bucket: ${fileName}`);
    
    // Get file size
    const fileSize = file.size || 0;
    
    // Upload file to appropriate bucket
    const { data: storageData, error: storageError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (storageError) {
      console.error('Storage upload error:', storageError);
      return NextResponse.json({ success: false, error: storageError.message }, { status: 500 });
    }
    
    // Get public URL for the file
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);
      
    const publicUrl = urlData?.publicUrl || '';
    
    // Create database entry with properly categorized data
    try {
      if (isPaper) {
        // Ensure paper_type is one of the valid options
        const validatedPaperType = ['exam', 'assignment', 'notes', 'other'].includes(paperType) 
          ? paperType 
          : 'other';
          
        const { data, error } = await supabase
          .from('papers')
          .insert({
            title,
            file_path: fileName,
            file_type: fileExtension,
            file_size: fileSize,
            paper_type: validatedPaperType,
            status: 'completed'
          })
          .select();
        
        if (error) {
          console.log('Database insert warning (non-fatal):', error);
          // Continue even if database insert fails - the file is already in storage
        } else {
          console.log('Paper record created with ID:', data?.[0]?.id);
        }
        
        // Return success response with file info and category
        return NextResponse.json({
          success: true,
          message: 'Paper uploaded successfully',
          fileInfo: {
            id: data?.[0]?.id || null,
            name: fileName,
            title: title,
            type: fileExtension,
            size: fileSize,
            bucket: bucket,
            path: storageData?.path || fileName,
            url: publicUrl,
            paper_type: validatedPaperType
          }
        });
      } else if (paperId && questionId) {
        // Store solution record
        const { data, error } = await supabase
          .from('solutions')
          .insert({
            paper_id: paperId,
            question_id: questionId,
            file_path: fileName,
            file_type: fileExtension,
            file_size: fileSize
          })
          .select();
        
        if (error) {
          console.log('Database insert warning (non-fatal):', error);
          // Continue even if database insert fails
        } else {
          console.log('Solution record created with ID:', data?.[0]?.id);
        }
        
        // Return success response with file info
        return NextResponse.json({
          success: true,
          message: 'Solution uploaded successfully',
          fileInfo: {
            id: data?.[0]?.id || null,
            name: fileName,
            type: fileExtension,
            size: fileSize,
            bucket: bucket,
            path: storageData?.path || fileName,
            url: publicUrl,
            paper_id: paperId,
            question_id: questionId
          }
        });
      }
    } catch (dbError) {
      console.log('Database operation failed (non-fatal):', dbError);
      // We'll still return success because the file was uploaded to storage
    }
    
    console.log('File uploaded successfully to storage');
    
    // Default return for cases not handled above
    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      fileInfo: {
        name: fileName,
        type: fileExtension,
        size: fileSize,
        bucket: bucket,
        path: storageData?.path || fileName,
        url: publicUrl
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