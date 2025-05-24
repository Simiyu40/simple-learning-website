import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  console.log('Fetching minimal papers and solutions data...');
  
  const results: {
    papers: any[];
    solutions: { [key: string]: any[] };
    error: string | null;
  } = {
    papers: [],
    solutions: {},
    error: null
  };
  
  try {
    // For papers, select only fields we know exist
    try {
      const { data: papers, error: papersError } = await serviceClient
        .from('papers')
        .select('id, title, file_path, file_type, created_at, user_id, status')
        .order('created_at', { ascending: false });
      
      if (papersError) {
        console.error('Error fetching papers:', papersError);
        results.error = `Error fetching papers: ${papersError.message}`;
      } else {
        results.papers = papers || [];
        console.log(`Retrieved ${papers?.length || 0} papers`);
      }
    } catch (papersErr) {
      console.error('Exception fetching papers:', papersErr);
    }
    
    // For solutions, select only fields we know exist
    try {
      const { data: solutions, error: solutionsError } = await serviceClient
        .from('solutions')
        .select('id, paper_id, question_id, file_path, file_type, created_at, user_id, content')
        .order('created_at', { ascending: false });
      
      if (solutionsError) {
        console.error('Error fetching solutions:', solutionsError);
        if (!results.error) {
          results.error = `Error fetching solutions: ${solutionsError.message}`;
        }
      } else {
        // Group solutions by paper_id
        const grouped: { [key: string]: any[] } = {};
        (solutions || []).forEach((sol) => {
          if (!grouped[sol.paper_id]) grouped[sol.paper_id] = [];
          grouped[sol.paper_id].push(sol);
        });
        
        results.solutions = grouped;
        console.log(`Retrieved ${solutions?.length || 0} solutions`);
      }
    } catch (solutionsErr) {
      console.error('Exception fetching solutions:', solutionsErr);
    }
    
    // If we still have no papers, try to import from storage
    if (results.papers.length === 0 && !results.error) {
      try {
        // Fall back to listing files from storage
        const { data: papersFiles, error: papersError } = await serviceClient.storage
          .from('papers')
          .list('', { sortBy: { column: 'created_at', order: 'desc' } });
        
        if (!papersError && papersFiles) {
          // Create paper records from storage files
          results.papers = papersFiles.map(file => {
            // Extract title from filename (remove timestamp if present)
            const parts = file.name.split('-');
            const title = parts.length > 1 && !isNaN(Number(parts[0])) 
              ? parts.slice(1).join('-')
              : file.name;
            
            // Extract file type
            const fileType = file.name.split('.').pop() || 'unknown';
            
            return {
              id: file.id,
              title: title,
              file_path: file.name,
              file_type: fileType,
              created_at: file.created_at || new Date().toISOString()
            };
          });
          
          console.log(`Retrieved ${results.papers.length} papers from storage`);
        }
      } catch (storageErr) {
        console.error('Exception listing storage files:', storageErr);
      }
    }
    
    return NextResponse.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Error fetching minimal data:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch data',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 