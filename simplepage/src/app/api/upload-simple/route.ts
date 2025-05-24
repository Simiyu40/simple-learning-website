import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key for server-side uploads
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create a supabase client with the service role key
const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to get a system user ID (simple implementation)
async function getSystemUserId() {
  return '00000000-0000-0000-0000-000000000001';
}

export async function POST(request: NextRequest) {
  try {
    console.log('Processing upload with simple method...');
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucketName = formData.get('bucket') as string;
    const title = formData.get('title') as string;
    const paperId = formData.get('paperId') as string;
    const questionId = formData.get('questionId') as string;
    
    console.log('Upload request received:', { 
      bucketName, 
      title: title?.substring(0, 20)
    });
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    if (!bucketName || !['papers', 'solutions'].includes(bucketName)) {
      return NextResponse.json({ error: 'Invalid or missing bucket name' }, { status: 400 });
    }
    
    // Create file path
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name}`;
    const filePath = `${fileName}`;
    
    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();
    
    // Upload file to Supabase Storage with service role client
    const { error: uploadError } = await serviceClient.storage
      .from(bucketName)
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        cacheControl: '3600'
      });
    
    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: `Storage upload error: ${uploadError.message}` }, 
        { status: 500 }
      );
    }
    
    console.log('File uploaded successfully to storage:', filePath);
    
    // Get a valid user ID for the upload
    const userId = await getSystemUserId();
    
    // Create database record
    if (bucketName === 'papers') {
      if (!title) {
        return NextResponse.json({ error: 'Title is required for paper uploads' }, { status: 400 });
      }
      
      try {
        // First try to create tables if they don't exist
        try {
          await serviceClient.from('papers').select('count').limit(1);
        } catch (tableError) {
          console.log('Table may not exist, trying to create it...');
          
          // Create the table (basic version) - no admin functions needed
          try {
            await serviceClient.from('papers').insert([
              {
                id: crypto.randomUUID(),
                title: 'temp_setup_record',
                file_path: 'temp',
                file_type: 'temp',
                user_id: userId,
                status: 'pending'
              }
            ]);
            
            // Delete the temporary record
            await serviceClient
              .from('papers')
              .delete()
              .eq('title', 'temp_setup_record');
            
            console.log('Paper table initialized');
          } catch (setupError) {
            console.log('Setup attempt error:', setupError);
            // Continue anyway
          }
        }
        
        // Use the standard insert method
        const { error: dbError } = await serviceClient
          .from('papers')
          .insert([{
            id: crypto.randomUUID(),
            title: title,
            file_path: filePath,
            file_type: fileExt || 'unknown',
            user_id: userId,
            status: 'completed'
          }]);
        
        if (dbError) {
          console.error('Database insert error:', dbError);
          return NextResponse.json({ 
            success: false, 
            error: dbError.message,
            message: `Failed to create database record for ${bucketName}`,
            filePath
          }, { status: 500 });
        }
      } catch (insertError) {
        console.error('Database insert exception:', insertError);
        return NextResponse.json({ 
          success: false, 
          error: insertError instanceof Error ? insertError.message : String(insertError),
          message: `Failed to create database record for ${bucketName}`,
          filePath
        }, { status: 500 });
      }
      
    } else if (bucketName === 'solutions') {
      if (!paperId || !questionId) {
        return NextResponse.json(
          { error: 'Paper ID and Question ID are required for solution uploads' }, 
          { status: 400 }
        );
      }
      
      try {
        // First try to create tables if they don't exist
        try {
          await serviceClient.from('solutions').select('count').limit(1);
        } catch (tableError) {
          console.log('Table may not exist, trying to create it...');
          
          // Create the table (basic version) - no admin functions needed
          try {
            await serviceClient.from('solutions').insert([
              {
                id: crypto.randomUUID(),
                paper_id: paperId,
                question_id: 'temp_setup',
                file_path: 'temp',
                file_type: 'temp',
                user_id: userId,
                content: ''
              }
            ]);
            
            // Delete the temporary record
            await serviceClient
              .from('solutions')
              .delete()
              .eq('question_id', 'temp_setup');
            
            console.log('Solutions table initialized');
          } catch (setupError) {
            console.log('Setup attempt error:', setupError);
            // Continue anyway
          }
        }
        
        // Use the standard insert method
        const { error: dbError } = await serviceClient
          .from('solutions')
          .insert([{
            id: crypto.randomUUID(),
            paper_id: paperId,
            question_id: questionId,
            file_path: filePath,
            file_type: fileExt || 'unknown',
            user_id: userId,
            content: ''
          }]);
        
        if (dbError) {
          console.error('Database insert error:', dbError);
          return NextResponse.json({ 
            success: false, 
            error: dbError.message,
            message: `Failed to create database record for ${bucketName}`,
            filePath
          }, { status: 500 });
        }
      } catch (insertError) {
        console.error('Database insert exception:', insertError);
        return NextResponse.json({ 
          success: false, 
          error: insertError instanceof Error ? insertError.message : String(insertError),
          message: `Failed to create database record for ${bucketName}`,
          filePath
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `${bucketName === 'papers' ? 'Paper' : 'Solution'} uploaded successfully`,
      filePath
    });
    
  } catch (error) {
    console.error('Error in upload API:', error);
    return NextResponse.json(
      { error: 'An error occurred during upload' }, 
      { status: 500 }
    );
  }
} 