import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for server operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function DELETE(request: NextRequest) {
  console.log('Starting file deletion process...');
  
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('filePath');
    const bucket = searchParams.get('bucket') as 'papers' | 'solutions';
    const recordId = searchParams.get('recordId'); // Optional: for database record deletion
    
    if (!filePath || !bucket) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required parameters: filePath and bucket' 
      }, { status: 400 });
    }

    if (!['papers', 'solutions'].includes(bucket)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid bucket. Must be "papers" or "solutions"' 
      }, { status: 400 });
    }

    console.log(`Deleting file: ${filePath} from bucket: ${bucket}`);

    // Step 1: Delete from storage
    const { error: storageError } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (storageError) {
      console.error('Storage deletion error:', storageError);
      return NextResponse.json({ 
        success: false, 
        error: `Failed to delete file from storage: ${storageError.message}` 
      }, { status: 500 });
    }

    console.log('File deleted from storage successfully');

    // Step 2: Delete from database (if record exists)
    let databaseDeletionResult = null;
    
    try {
      if (bucket === 'papers') {
        // Delete paper record by file_path or id
        const deleteQuery = recordId 
          ? supabase.from('papers').delete().eq('id', recordId)
          : supabase.from('papers').delete().eq('file_path', filePath);
          
        const { data, error: dbError } = await deleteQuery;
        
        if (dbError) {
          console.warn('Database deletion warning for papers:', dbError);
          databaseDeletionResult = { warning: dbError.message };
        } else {
          console.log('Paper record deleted from database');
          databaseDeletionResult = { success: true, deletedRecords: data };
          
          // Also delete associated solutions
          const { error: solutionsError } = await supabase
            .from('solutions')
            .delete()
            .eq('paper_id', recordId || 'unknown');
            
          if (solutionsError) {
            console.warn('Warning deleting associated solutions:', solutionsError);
          } else {
            console.log('Associated solutions deleted');
          }
        }
      } else if (bucket === 'solutions') {
        // Delete solution record by file_path or id
        const deleteQuery = recordId 
          ? supabase.from('solutions').delete().eq('id', recordId)
          : supabase.from('solutions').delete().eq('file_path', filePath);
          
        const { data, error: dbError } = await deleteQuery;
        
        if (dbError) {
          console.warn('Database deletion warning for solutions:', dbError);
          databaseDeletionResult = { warning: dbError.message };
        } else {
          console.log('Solution record deleted from database');
          databaseDeletionResult = { success: true, deletedRecords: data };
        }
      }
    } catch (dbError) {
      console.warn('Database deletion failed (non-fatal):', dbError);
      databaseDeletionResult = { warning: 'Database deletion failed but file was removed from storage' };
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
      details: {
        filePath,
        bucket,
        storageDeleted: true,
        databaseResult: databaseDeletionResult
      }
    });

  } catch (error) {
    console.error('Deletion process error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error during deletion' 
    }, { status: 500 });
  }
}
