import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for server operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching solutions from the database...');
    
    // Get search params from URL
    const searchParams = request.nextUrl.searchParams;
    const paperId = searchParams.get('paperId');
    
    // Build the base query
    let query = supabase
      .from('solutions')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Apply paper ID filter if provided
    if (paperId) {
      query = query.eq('paper_id', paperId);
    }
    
    // Execute the query
    const { data: solutions, error } = await query;
    
    if (error) {
      console.error('Error fetching solutions:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Could not fetch solutions', 
        details: error
      }, { status: 500 });
    }
    
    // Process solutions to ensure consistent structure
    const processedSolutions = (solutions || []).map(solution => {
      // Apply defaults for any potentially missing fields
      return {
        ...solution,
        file_size: solution.file_size || 0,
        created_at: solution.created_at || new Date().toISOString(),
        updated_at: solution.updated_at || new Date().toISOString()
      };
    });
    
    // Group solutions by paper_id for easier frontend rendering
    const solutionsByPaper: { [key: string]: any[] } = {};
    processedSolutions.forEach(solution => {
      if (!solutionsByPaper[solution.paper_id]) {
        solutionsByPaper[solution.paper_id] = [];
      }
      solutionsByPaper[solution.paper_id].push(solution);
    });
    
    return NextResponse.json({
      success: true,
      solutions: processedSolutions,
      solutionsByPaper,
      filters: {
        paperId: paperId || null
      }
    });
  } catch (error) {
    console.error('Solutions fetch error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
} 