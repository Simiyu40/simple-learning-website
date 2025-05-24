import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  console.log('Listing files from storage...');
  
  const results: {
    papers: any[];
    solutions: any[];
    error: string | null;
  } = {
    papers: [],
    solutions: [],
    error: null
  };
  
  try {
    // List files from papers bucket
    try {
      const { data: papersFiles, error: papersError } = await serviceClient.storage
        .from('papers')
        .list('', { sortBy: { column: 'created_at', order: 'desc' } });
      
      if (papersError) {
        console.error('Error listing papers bucket:', papersError);
        results.error = `Error listing papers: ${papersError.message}`;
      } else {
        results.papers = papersFiles.map(file => ({
          name: file.name,
          id: file.id,
          bucket: 'papers',
          created_at: file.created_at,
          updated_at: file.updated_at,
          last_modified_at: file.last_accessed_at,
          size: file.metadata?.size,
          mime_type: file.metadata?.mimetype
        }));
      }
    } catch (papersErr) {
      console.error('Exception listing papers bucket:', papersErr);
    }
    
    // List files from solutions bucket
    try {
      const { data: solutionsFiles, error: solutionsError } = await serviceClient.storage
        .from('solutions')
        .list('', { sortBy: { column: 'created_at', order: 'desc' } });
      
      if (solutionsError) {
        console.error('Error listing solutions bucket:', solutionsError);
        if (!results.error) {
          results.error = `Error listing solutions: ${solutionsError.message}`;
        }
      } else {
        results.solutions = solutionsFiles.map(file => ({
          name: file.name,
          id: file.id,
          bucket: 'solutions',
          created_at: file.created_at,
          updated_at: file.updated_at,
          last_modified_at: file.last_accessed_at,
          size: file.metadata?.size,
          mime_type: file.metadata?.mimetype
        }));
      }
    } catch (solutionsErr) {
      console.error('Exception listing solutions bucket:', solutionsErr);
    }
    
    return NextResponse.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Error listing storage files:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to list storage files',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 