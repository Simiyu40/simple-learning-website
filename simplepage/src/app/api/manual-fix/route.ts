import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  console.log('Running manual fix for papers...');
  
  try {
    // First, make sure the paper_type column exists
    try {
      const addColumnResult = await serviceClient.rpc('admin_query', {
        sql: "ALTER TABLE papers ADD COLUMN IF NOT EXISTS paper_type TEXT DEFAULT 'other';"
      });
      console.log('Added paper_type column:', addColumnResult);
    } catch (e) {
      console.error('Error adding column (may already exist):', e);
    }
    
    // Update existing papers to have paper_type set
    try {
      const updateResult = await serviceClient.rpc('admin_query', {
        sql: "UPDATE papers SET paper_type = 'other' WHERE paper_type IS NULL OR paper_type = '';"
      });
      console.log('Updated papers with default paper_type:', updateResult);
    } catch (e) {
      console.error('Error updating papers:', e);
    }
    
    // Check if any papers don't have paper_type
    const { data, error } = await serviceClient
      .from('papers')
      .select('id, title, paper_type')
      .is('paper_type', null);
      
    if (error) {
      console.error('Error checking papers:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    // Get a count of paper types
    const { data: countData, error: countError } = await serviceClient
      .rpc('admin_query', {
        sql: "SELECT paper_type, COUNT(*) FROM papers GROUP BY paper_type;"
      });
    
    if (countError) {
      console.error('Error counting paper types:', countError);
    }
    
    // Dump the first few papers for debugging
    const { data: samplePapers, error: sampleError } = await serviceClient
      .from('papers')
      .select('*')
      .limit(5);
      
    if (sampleError) {
      console.error('Error getting sample papers:', sampleError);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Manual fix completed',
      missingPaperTypes: data?.length || 0,
      paperTypeCounts: countData || [],
      samplePapers: samplePapers || []
    });
  } catch (error) {
    console.error('Error in manual fix:', error);
    return NextResponse.json({
      success: false,
      error: 'Manual fix failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 