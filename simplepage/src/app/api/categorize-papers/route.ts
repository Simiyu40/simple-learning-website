import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for server operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  console.log('Starting paper categorization process...');
  
  try {
    // Get all papers that don't have a paper_type set
    const { data: papers, error: papersError } = await supabase
      .from('papers')
      .select('*')
      .is('paper_type', null);
      
    if (papersError) {
      console.error('Error fetching papers:', papersError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch papers', 
        details: papersError.message 
      }, { status: 500 });
    }
    
    console.log(`Found ${papers?.length || 0} papers without paper_type`);
    
    // If no papers need categorization, check for papers with default 'other' type
    if (!papers || papers.length === 0) {
      const { data: otherPapers, error: otherError } = await supabase
        .from('papers')
        .select('*')
        .eq('paper_type', 'other');
        
      if (otherError) {
        console.error('Error fetching other papers:', otherError);
      } else {
        console.log(`Found ${otherPapers?.length || 0} papers with 'other' type that could be categorized`);
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'No papers need categorization',
        otherPapers: otherPapers?.length || 0
      });
    }
    
    // Keywords to help categorize papers
    const categoryCriteria = {
      exam: ['exam', 'test', 'quiz', 'final', 'midterm', 'assessment'],
      assignment: ['assignment', 'homework', 'project', 'task', 'problem set', 'lab'],
      notes: ['notes', 'lecture', 'study guide', 'summary', 'outline', 'review']
    };
    
    // Categorize each paper
    const updates = [];
    for (const paper of papers) {
      let paperType = 'other';
      const titleLower = paper.title.toLowerCase();
      
      // Check if title contains any keywords
      for (const [category, keywords] of Object.entries(categoryCriteria)) {
        if (keywords.some(keyword => titleLower.includes(keyword))) {
          paperType = category;
          break;
        }
      }
      
      // Update the paper
      const { error: updateError } = await supabase
        .from('papers')
        .update({ paper_type: paperType })
        .eq('id', paper.id);
        
      if (updateError) {
        console.error(`Error updating paper ${paper.id}:`, updateError);
      } else {
        console.log(`Categorized paper ${paper.id} as ${paperType}: ${paper.title}`);
        updates.push({
          id: paper.id,
          title: paper.title,
          paperType
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Categorized ${updates.length} papers`,
      updates
    });
  } catch (error) {
    console.error('Error in paper categorization:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to categorize papers',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 