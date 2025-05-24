import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export interface PaperWithSolutions {
  id: string;
  title: string;
  file_path: string;
  file_type: string;
  file_size: number | null;
  paper_type: string;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  status: string;
  solutions: {
    id: string;
    paper_id: string;
    question_id: string;
    file_path: string;
    file_type: string;
    file_size: number | null;
    created_at: string;
    updated_at: string;
    user_id: string | null;
    content: string;
  }[];
}

export interface OrganizedPapers {
  exam: PaperWithSolutions[];
  assignment: PaperWithSolutions[];
  notes: PaperWithSolutions[];
  other: PaperWithSolutions[];
}

export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore });
    
    // Get search params if any
    const { searchParams } = new URL(request.url);
    const paperType = searchParams.get('paperType');
    const searchQuery = searchParams.get('search');
    
    console.log('Fetching papers with params:', { paperType, searchQuery });
    
    // Start with the base query
    let query = supabase
      .from('papers')
      .select(`
        *,
        solutions (*)
      `)
      .order('created_at', { ascending: false });
    
    // Apply paper type filter if specified
    if (paperType && paperType !== 'all') {
      query = query.eq('paper_type', paperType);
    }
    
    // Apply search filter if specified
    if (searchQuery && searchQuery.trim() !== '') {
      query = query.ilike('title', `%${searchQuery.trim()}%`);
    }
    
    const { data: papers, error } = await query;
    
    if (error) {
      console.error('Error fetching papers:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }
    
    // Organize papers by type
    const organizedPapers: OrganizedPapers = {
      exam: [],
      assignment: [],
      notes: [],
      other: []
    };
    
    papers.forEach((paper) => {
      // Normalize the paper type to handle potential null values or case inconsistencies
      const normalizedType = (paper.paper_type || 'other').toLowerCase();
      
      // Map to one of our organized categories
      let category: keyof OrganizedPapers;
      if (normalizedType.includes('exam')) {
        category = 'exam';
      } else if (normalizedType.includes('assignment')) {
        category = 'assignment';
      } else if (normalizedType.includes('note')) {
        category = 'notes';
      } else {
        category = 'other';
      }
      
      // Add to the appropriate category
      organizedPapers[category].push(paper as PaperWithSolutions);
    });
    
    return NextResponse.json({ 
      success: true, 
      papers,
      organizedPapers,
      filters: {
        paperType: paperType || 'all',
        searchQuery: searchQuery || ''
      }
    });
    
  } catch (error) {
    console.error('Error in get-papers-organized API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch papers: ' + (error instanceof Error ? error.message : String(error))
    }, { status: 500 });
  }
} 